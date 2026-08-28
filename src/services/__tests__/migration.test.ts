import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseFrom } = vi.hoisted(() => ({ supabaseFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: supabaseFrom },
}));

import { backfillToCloud, migrateLegacyLocalData, recoveredRecordId, scanForLegacyData } from '@/services/migration';
import { STORAGE_KEYS } from '@/services/storage';

describe('local tracker history recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseFrom.mockReset();
  });

  it('creates stable account-scoped IDs for recovered dose rows', () => {
    const first = recoveredRecordId('account-a', 'legacy-row');
    expect(first).toBe(recoveredRecordId('account-a', 'legacy-row'));
    expect(first).not.toBe(recoveredRecordId('account-b', 'legacy-row'));
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('detects signed-out and unscoped daily entries', () => {
    localStorage.setItem(`${STORAGE_KEYS.DAILY_DOSES}::guest`, JSON.stringify([{ id: 'guest-entry' }]));
    localStorage.setItem(STORAGE_KEYS.DAILY_DOSES, JSON.stringify([{ id: 'legacy-entry' }]));

    const summary = scanForLegacyData('current-user');

    expect(summary.namespaces.map((item) => item.displayLabel)).toContain('Signed-out tracker data');
    expect(summary.namespaces.map((item) => item.displayLabel)).toContain('Earlier tracker data');
  });

  it('detects and scopes reminders saved by the older reminder hook', () => {
    localStorage.setItem('peptide-dose-reminders', JSON.stringify([{ id: 'old-reminder' }]));

    const summary = scanForLegacyData('current-user');
    const result = migrateLegacyLocalData('current-user');
    const recovered = JSON.parse(
      localStorage.getItem(`${STORAGE_KEYS.SCHEDULED_REMINDERS}::current-user`) || '[]',
    ) as Array<{ id: string }>;

    expect(summary.namespaces.map((item) => item.displayLabel)).toContain('Earlier tracker data');
    expect(result.success).toBe(true);
    expect(recovered).toEqual([{ id: 'old-reminder' }]);
    expect(localStorage.getItem('peptide-dose-reminders')).not.toBeNull();
  });

  it('merges recovered entries by ID without deleting the source copy', () => {
    localStorage.setItem(`${STORAGE_KEYS.DAILY_DOSES}::current-user`, JSON.stringify([{ id: 'cloud-copy', date: '2026-08-17' }]));
    localStorage.setItem(`${STORAGE_KEYS.DAILY_DOSES}::guest`, JSON.stringify([
      { id: 'cloud-copy', date: '2026-08-17' },
      { id: 'recent-local', date: '2026-08-26' },
    ]));

    const result = migrateLegacyLocalData('current-user');
    const merged = JSON.parse(localStorage.getItem(`${STORAGE_KEYS.DAILY_DOSES}::current-user`) || '[]') as Array<{ id: string }>;

    expect(result.success).toBe(true);
    expect(merged.map((item) => item.id).sort()).toEqual(['cloud-copy', 'recent-local']);
    expect(localStorage.getItem(`${STORAGE_KEYS.DAILY_DOSES}::guest`)).not.toBeNull();
  });

  it('backfills both current and legacy reminder field names with stable account-scoped IDs', async () => {
    const inserted: Array<Record<string, unknown>> = [];
    supabaseFrom.mockImplementation((table: string) => {
      if (table === 'dose_reminders') {
        return {
          select: () => ({ eq: async () => ({ data: [], error: null }) }),
          upsert: async (rows: Array<Record<string, unknown>>) => {
            inserted.push(...rows);
            return { error: null };
          },
        };
      }
      if (table === 'journey_events') return { insert: async () => ({ error: null }) };
      throw new Error(`Unexpected table: ${table}`);
    });
    localStorage.setItem(`${STORAGE_KEYS.SCHEDULED_REMINDERS}::account-a`, JSON.stringify([
      {
        id: 'current-shape', peptide_id: 'bpc-157', peptide_name: 'BPC-157',
        dose: 'clinician plan', time: '08:30:00', days: ['mon'], enabled: true,
      },
      {
        id: 'legacy-shape', peptideId: 'tb-500', peptideName: 'TB-500',
        dose: 'recorded amount', time: '19:15', days: ['fri'], enabled: false,
      },
    ]));

    const result = await backfillToCloud('account-a');

    expect(result.success).toBe(true);
    expect(inserted).toHaveLength(2);
    expect(inserted.map((row) => row.id)).toEqual([
      recoveredRecordId('account-a', 'current-shape'),
      recoveredRecordId('account-a', 'legacy-shape'),
    ]);
    expect(inserted[0]).toMatchObject({
      peptide_id: 'bpc-157', peptide_name: 'BPC-157', time: '08:30', days: ['mon'],
    });
    expect(inserted[1]).toMatchObject({
      peptide_id: 'tb-500', peptide_name: 'TB-500', time: '19:15', days: ['fri'], enabled: false,
    });
  });
});
