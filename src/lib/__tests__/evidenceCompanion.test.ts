import { describe, expect, it } from 'vitest';
import {
  buildEvidencePacket,
  isSafeEvidenceUrl,
  questionRequestsMeasurementExplanation,
  questionRequestsPersonalDose,
} from '@/lib/evidenceCompanion';

describe('evidence companion boundaries', () => {
  it('detects personal-dose requests without blocking study-protocol questions', () => {
    expect(questionRequestsPersonalDose('What dose should I take for recovery?')).toBe(true);
    expect(questionRequestsPersonalDose('Recommend a starting protocol for me')).toBe(true);
    expect(questionRequestsPersonalDose('What dose and population were studied in the paper?')).toBe(false);
  });

  it('shares calculator context only for an explicit measurement question', () => {
    expect(questionRequestsMeasurementExplanation('Explain my recorded syringe units')).toBe(true);
    expect(questionRequestsMeasurementExplanation('What does the strongest human evidence show?')).toBe(false);
  });

  it('only accepts source hosts used by the curated evidence library', () => {
    expect(isSafeEvidenceUrl('https://pubmed.ncbi.nlm.nih.gov/33567185/')).toBe(true);
    expect(isSafeEvidenceUrl('https://www.nejm.org/doi/full/10.1056/NEJMoa2301972')).toBe(true);
    expect(isSafeEvidenceUrl('https://example.com/invented-study')).toBe(false);
    expect(isSafeEvidenceUrl('javascript:alert(1)')).toBe(false);
  });

  it('builds a source-linked packet without exposing catalogue dose tiers', () => {
    const packet = buildEvidencePacket('semaglutide');
    expect(packet).not.toBeNull();
    expect(packet?.sources.length).toBeGreaterThan(0);
    expect(packet?.sources.every((source) => isSafeEvidenceUrl(source.url))).toBe(true);
    expect(packet).not.toHaveProperty('dosing');
    expect(JSON.stringify(packet)).not.toMatch(/"intermediate"|"advanced"|"athlete"/i);
  });

  it('gives every compound a beginner context and grounds Eloralintide in its phase 2 source', () => {
    const packet = buildEvidencePacket('eloralintide');
    expect(packet?.beginner.simpleExplanation).toMatch(/full|amylin/i);
    expect(packet?.beginner.status).toMatch(/phase 2/i);
    expect(packet?.beginner.safetyFlags.join(' ')).toMatch(/nausea|fatigue/i);
    expect(packet?.sources[0]?.url).toBe('https://pubmed.ncbi.nlm.nih.gov/41207310/');
    expect(packet?.sources[0]?.studiedProtocol).toMatch(/1, 3, 6 or 9 mg/i);
  });
});
