import { describe, expect, it } from 'vitest';
import { parseRecordedDose } from '@/lib/recordedDose';

describe('parseRecordedDose', () => {
  it('normalises mcg to the mg storage unit without changing the recorded amount meaning', () => {
    expect(parseRecordedDose('500 mcg')).toEqual({
      dose: 0.5,
      unit: 'mg',
      originalAmount: 500,
      originalUnit: 'mcg',
    });
  });

  it.each([
    ['1 mg', 1, 'mg'],
    ['10 IU', 10, 'IU'],
    ['8 units', 8, 'units'],
    ['8 unit', 8, 'units'],
  ])('parses %s', (input, dose, unit) => {
    expect(parseRecordedDose(input)).toMatchObject({ dose, unit });
  });

  it.each(['', 'abc', '0 mg', '-1 mg', '1 ml', '1.2.3 mg'])('rejects invalid value %s', (input) => {
    expect(parseRecordedDose(input)).toBeNull();
  });
});
