import { describe, expect, it } from 'vitest';
import { calculateMeasurement } from '@/lib/measurementMath';

describe('calculateMeasurement', () => {
  it('converts user-entered values for a U-100 syringe', () => {
    const result = calculateMeasurement({
      vialAmountMg: 10,
      diluentMl: 2,
      enteredAmount: 0.5,
      enteredUnit: 'mg',
      syringeType: 'U-100',
      barrelCapacityMl: 1,
    });

    expect(result?.concentrationMgPerMl).toBe(5);
    expect(result?.volumeMl).toBeCloseTo(0.1);
    expect(result?.syringeUnits).toBeCloseTo(10);
    expect(result?.fitsSelectedBarrel).toBe(true);
  });

  it('uses the selected U-40 scale without changing the volume', () => {
    const result = calculateMeasurement({
      vialAmountMg: 10,
      diluentMl: 2,
      enteredAmount: 500,
      enteredUnit: 'mcg',
      syringeType: 'U-40',
      barrelCapacityMl: 0.5,
    });

    expect(result?.targetAmountMg).toBe(0.5);
    expect(result?.volumeMl).toBeCloseTo(0.1);
    expect(result?.syringeUnits).toBeCloseTo(4);
  });

  it('shows 1 mg as 8 units only for the matching user-entered U-40 concentration', () => {
    const result = calculateMeasurement({
      vialAmountMg: 10,
      diluentMl: 2,
      enteredAmount: 1,
      enteredUnit: 'mg',
      syringeType: 'U-40',
      barrelCapacityMl: 1,
    });

    expect(result?.concentrationMgPerMl).toBe(5);
    expect(result?.volumeMl).toBeCloseTo(0.2);
    expect(result?.syringeUnits).toBeCloseTo(8);
  });

  it('flags a result that exceeds the selected barrel capacity', () => {
    const result = calculateMeasurement({
      vialAmountMg: 5,
      diluentMl: 5,
      enteredAmount: 1,
      enteredUnit: 'mg',
      syringeType: 'U-100',
      barrelCapacityMl: 0.5,
    });

    expect(result?.fitsSelectedBarrel).toBe(false);
    expect(result?.syringeUnits).toBe(100);
    expect(result?.maximumBarrelUnits).toBe(50);
  });

  it('rejects invalid values and amounts larger than the vial content', () => {
    expect(calculateMeasurement({ vialAmountMg: 0, diluentMl: 2, enteredAmount: 1, enteredUnit: 'mg', syringeType: 'U-100', barrelCapacityMl: 1 })).toBeNull();
    expect(calculateMeasurement({ vialAmountMg: 5, diluentMl: 2, enteredAmount: 6, enteredUnit: 'mg', syringeType: 'U-100', barrelCapacityMl: 1 })).toBeNull();
  });
});
