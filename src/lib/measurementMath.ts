export type MeasurementSyringeType = 'U-40' | 'U-100';
export type MeasurementAmountUnit = 'mg' | 'mcg';

export interface MeasurementInput {
  vialAmountMg: number;
  diluentMl: number;
  enteredAmount: number;
  enteredUnit: MeasurementAmountUnit;
  syringeType: MeasurementSyringeType;
  barrelCapacityMl: number;
}

export interface MeasurementResult {
  targetAmountMg: number;
  concentrationMgPerMl: number;
  volumeMl: number;
  syringeUnits: number;
  syringeUnitsPerMl: 40 | 100;
  maximumBarrelUnits: number;
  fitsSelectedBarrel: boolean;
}

export function calculateMeasurement(input: MeasurementInput): MeasurementResult | null {
  const values = [input.vialAmountMg, input.diluentMl, input.enteredAmount, input.barrelCapacityMl];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) return null;

  const targetAmountMg = input.enteredUnit === 'mcg'
    ? input.enteredAmount / 1000
    : input.enteredAmount;
  if (targetAmountMg > input.vialAmountMg) return null;

  const concentrationMgPerMl = input.vialAmountMg / input.diluentMl;
  const volumeMl = targetAmountMg / concentrationMgPerMl;
  const syringeUnitsPerMl = input.syringeType === 'U-40' ? 40 : 100;
  const syringeUnits = volumeMl * syringeUnitsPerMl;
  const maximumBarrelUnits = input.barrelCapacityMl * syringeUnitsPerMl;

  return {
    targetAmountMg,
    concentrationMgPerMl,
    volumeMl,
    syringeUnits,
    syringeUnitsPerMl,
    maximumBarrelUnits,
    fitsSelectedBarrel: volumeMl <= input.barrelCapacityMl,
  };
}
