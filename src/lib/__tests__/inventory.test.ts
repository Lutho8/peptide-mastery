import { describe, expect, it, vi } from 'vitest';
import { checkInventoryAlerts, getReconstitutionStatus } from '@/data/inventory';
import type { InventoryItem } from '@/types';

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    peptideId: 'recorded-item',
    peptideName: 'Recorded item',
    vialSizeMg: 10,
    remainingMg: 10,
    expirationDate: '',
    ...overrides,
  };
}

describe('inventory alerts', () => {
  it('uses a proportional low-stock threshold', () => {
    expect(checkInventoryAlerts([item({ remainingMg: 2.1 })])).toHaveLength(0);
    expect(checkInventoryAlerts([item({ remainingMg: 2 })]).map((alert) => alert.type)).toContain('low_stock');
  });

  it('does not invent an expiry alert when no expiry was recorded', () => {
    expect(checkInventoryAlerts([item({ expirationDate: '' })])).toHaveLength(0);
  });

  it('uses a separately recorded expiry date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T00:00:00Z'));
    const alerts = checkInventoryAlerts([item({ expirationDate: '2026-08-29T00:00:00Z' })]);
    expect(alerts.map((alert) => alert.type)).toContain('expiring_soon');
    vi.useRealTimers();
  });
});

describe('reconstitution status', () => {
  it('does not infer a universal shelf life from the reconstitution date', () => {
    expect(getReconstitutionStatus('2026-01-01')).toEqual({ status: 'fresh', daysRemaining: 0 });
  });
});
