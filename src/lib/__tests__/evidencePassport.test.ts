import { describe, expect, it } from 'vitest';
import { peptides } from '@/data/peptides';
import { buildEvidencePassport, compareByEvidence } from '@/lib/evidencePassport';

describe('evidence passport', () => {
  it('keeps evidence, development, route, identity and safety separate', () => {
    const semaglutide = peptides.find((peptide) => peptide.id === 'semaglutide');
    expect(semaglutide).toBeTruthy();
    const passport = buildEvidencePassport(semaglutide!);
    expect(passport.dimensions.map((dimension) => dimension.id)).toEqual([
      'human-evidence',
      'development-status',
      'identity-match',
      'route-match',
      'safety-record',
    ]);
    expect(passport.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sorts stronger reviewed evidence ahead of preclinical evidence', () => {
    const semaglutide = peptides.find((peptide) => peptide.id === 'semaglutide')!;
    const motsc = peptides.find((peptide) => peptide.id === 'motsc')!;
    expect(compareByEvidence(semaglutide, motsc)).toBeLessThan(0);
  });
});
