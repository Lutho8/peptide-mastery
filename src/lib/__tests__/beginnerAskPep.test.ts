import { describe, expect, it } from 'vitest';
import { buildBeginnerAskPepAnswer } from '@/lib/beginnerAskPep';
import { buildEvidencePacket, buildGeneralHealthEvidencePacket } from '@/lib/evidenceCompanion';

describe('beginner AskPep answers', () => {
  const packet = buildEvidencePacket('eloralintide');

  it('answers basic function and status questions without jargon-first copy', () => {
    expect(packet).not.toBeNull();
    const answer = buildBeginnerAskPepAnswer('What is this in simple terms?', packet!, false);
    expect(answer).toMatch(/Short answer.*full/s);
    expect(answer).toMatch(/phase 2/i);
  });

  it('separates a studied dose from a personal recommendation', () => {
    const answer = buildBeginnerAskPepAnswer('What dose should I take?', packet!, true);
    expect(answer).toMatch(/can’t choose or recommend a personal dose/i);
    expect(answer).toMatch(/1, 3, 6 or 9 mg/i);
    expect(answer).toMatch(/study, not a dose for you/i);
  });

  it('covers results and real-world warning-sign questions', () => {
    const answer = buildBeginnerAskPepAnswer('What results and side effects? I feel tired and cold.', packet!, false);
    expect(answer).toMatch(/-20%/);
    expect(answer).toMatch(/nausea|fatigue/i);
    expect(answer).toMatch(/not proof that it is working/i);
  });

  it('answers a Hashimoto confession as a research signal without repeating its doses', () => {
    const thyroidPacket = buildGeneralHealthEvidencePacket();
    const answer = buildBeginnerAskPepAnswer(
      'Is there a peptide for thyroid issues? Have hashimotos. My antibodies reduced 30% after thymosin alpha-1, KPV, BPC-157, MOTS-c, retatrutide and a 7mg nicotine patch.',
      thyroidPacket,
      false,
    );

    expect(answer).toMatch(/no peptide.*proven treatment for Hashimoto/i);
    expect(answer).toMatch(/30% antibody reduction is a real lab change/i);
    expect(answer).toMatch(/cannot show which item caused/i);
    expect(answer).toMatch(/MOTS-c.*cross-sectional/s);
    expect(answer).toMatch(/TSH and free T4/i);
    expect(answer).toMatch(/signal for a research question.*not as a dosing template/s);
    expect(answer).not.toMatch(/1\.5 thymosin|0\.4 KPV|2\.5 MOTS|7mg/i);
  });
});
