import { describe, expect, it } from 'vitest';
import { getAllCategories, peptides } from '@/data/peptides';

describe('peptide category counts', () => {
  it('derives every displayed count from the merged catalog', () => {
    for (const category of getAllCategories()) {
      expect(category.count).toBe(peptides.filter((peptide) => peptide.category === category.id).length);
    }
  });

  it('keeps catalog entries assigned to a known category', () => {
    const known = new Set(getAllCategories().map((category) => category.id));
    expect(peptides.filter((peptide) => !known.has(peptide.category))).toEqual([]);
  });

  it('does not advertise empty categories', () => {
    expect(getAllCategories().every((category) => category.count > 0)).toBe(true);
  });
});
