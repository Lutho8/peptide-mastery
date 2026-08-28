import { describe, expect, it } from 'vitest';
import {
  formatMeasurementSchedule,
  inferMeasurementSchedule,
  MEASUREMENT_GUIDANCE,
  parseRecordedMeasurementAmount,
} from '@/lib/measurementPlan';

describe('measurement plan helpers', () => {
  it('loads only explicit mg or microgram amounts from recorded plans', () => {
    expect(parseRecordedMeasurementAmount('0.25 mg')).toEqual({ value: '0.25', unit: 'mg' });
    expect(parseRecordedMeasurementAmount('250 mcg twice weekly')).toEqual({ value: '250', unit: 'mcg' });
    expect(parseRecordedMeasurementAmount('250 µg')).toEqual({ value: '250', unit: 'mcg' });
    expect(parseRecordedMeasurementAmount('follow plan')).toBeNull();
    expect(parseRecordedMeasurementAmount('0 mg')).toBeNull();
  });

  it.each([
    ['daily', 'daily'],
    ['2x daily', 'twice-daily'],
    ['once a week', 'weekly'],
    ['twice per week', 'twice-weekly'],
    ['three times weekly', 'three-weekly'],
    ['Mon, Wed & Fri', 'custom'],
  ] as const)('maps %s to non-prescriptive schedule context', (frequency, expected) => {
    expect(inferMeasurementSchedule(frequency).mode).toBe(expected);
  });

  it('preserves the exact recorded schedule text when available', () => {
    expect(formatMeasurementSchedule('twice-weekly', 'Mon & Thu')).toBe('Mon & Thu');
    expect(formatMeasurementSchedule('twice-weekly', '')).toBe('Twice weekly');
  });

  it('keeps user modes limited to explanation and tracking language', () => {
    expect(MEASUREMENT_GUIDANCE.map((mode) => mode.id)).toEqual(['beginner', 'intermediate', 'athlete']);
    for (const mode of MEASUREMENT_GUIDANCE) {
      expect(mode.description.toLowerCase()).not.toMatch(/recommended dose|prescribed dose|auto.?dose/);
    }
  });
});
