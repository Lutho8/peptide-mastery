import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { migrateLegacyLocalData, recoveredDoseId, scanForLegacyData } from '@/services/migration';
import { STORAGE_KEYS } from '@/services/storage';

describe('local tracker history recovery', () => {
  beforeEach(() => localStorage.clear());

  it('creates stable account-scoped IDs for recovered dose rows', () => {
    const first = recoveredDoseId('account-a', 'legacy-row');
    expect(first).toBe(recoveredDoseId('account-a', 'legacy-row'));
    expect(first).not.toBe(recoveredDoseId('account-b', 'legacy-row'));
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('detects signed-out and unscoped daily entries', () => {
    localStorage.setItem(`${STORAGE_KEYS.DAILY_DOSES}::guest`, JSON.stringify([{ id: 'guest-entry' }]));
    localStorage.setItem(STORAGE_KEYS.DAILY_DOSES, JSON.stringify([{ id: 'legacy-entry' }]));

    const summary = scanForLegacyData('current-user');

    expect(summary.namespaces.map((item) => item.displayLabel)).toContain('Signed-out tracker data');
    expect(summary.namespaces.map((item) => item.displayLabel)).toContain('Earlier tracker data');
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
});
