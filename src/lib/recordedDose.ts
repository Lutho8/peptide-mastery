export type RecordedDoseUnit = 'mg' | 'IU' | 'units';

export interface ParsedRecordedDose {
  dose: number;
  unit: RecordedDoseUnit;
  originalAmount: number;
  originalUnit: 'mcg' | 'mg' | 'iu' | 'unit' | 'units';
}

/**
 * Parse an amount already recorded by the user. This only normalises units for
 * storage; it never chooses or recommends an amount.
 */
export function parseRecordedDose(value: string): ParsedRecordedDose | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(mcg|mg|iu|units?)$/i);
  if (!match) return null;

  const originalAmount = Number(match[1]);
  if (!Number.isFinite(originalAmount) || originalAmount <= 0) return null;

  const originalUnit = match[2].toLowerCase() as ParsedRecordedDose['originalUnit'];
  if (originalUnit === 'mcg') {
    return { dose: originalAmount / 1000, unit: 'mg', originalAmount, originalUnit };
  }
  if (originalUnit === 'iu') {
    return { dose: originalAmount, unit: 'IU', originalAmount, originalUnit };
  }
  if (originalUnit === 'unit' || originalUnit === 'units') {
    return { dose: originalAmount, unit: 'units', originalAmount, originalUnit };
  }
  return { dose: originalAmount, unit: 'mg', originalAmount, originalUnit };
}
