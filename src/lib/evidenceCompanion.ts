import { findBlendData, findPeptideOrBlend } from '@/data/blendAdapters';
import { getBlendEvidence, getPeptideEvidence } from '@/data/researchEvidence';
import { researchReferences } from '@/data/researchReferences';

export interface EvidenceSource {
  id: string;
  label: string;
  title: string;
  url: string;
  year?: number;
  findings: string[];
  studiedProtocol?: string;
}

export interface EvidencePacket {
  peptideId: string;
  peptideName: string;
  evidenceLabel: string;
  evidenceNote: string;
  lastReviewed: string;
  sources: EvidenceSource[];
}

export interface MeasurementAskContext {
  vialAmountMg?: number;
  diluentMl?: number;
  recordedAmount?: string;
  schedule?: string;
  syringe?: string;
  calculatedUnits?: number;
  calculatedVolumeMl?: number;
}

export interface EvidenceAnswer {
  answer: string;
  citations: EvidenceSource[];
  personalRecommendationDeclined: boolean;
  remainingToday?: number;
  provider?: string;
}

const SAFE_SOURCE_HOSTS = new Set([
  'pubmed.ncbi.nlm.nih.gov',
  'www.fda.gov',
  'fda.gov',
  'www.nejm.org',
  'nejm.org',
  'www.nature.com',
  'nature.com',
]);

export function isSafeEvidenceUrl(url: string): boolean {
  try {
    return SAFE_SOURCE_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function buildEvidencePacket(peptideId: string): EvidencePacket | null {
  const peptide = findPeptideOrBlend(peptideId);
  if (!peptide) return null;

  const blend = findBlendData(peptideId);
  const evidence = blend ? getBlendEvidence(blend) : getPeptideEvidence(peptide);
  const linked = researchReferences.filter((reference) => reference.peptideIds.includes(peptideId));
  const sources: EvidenceSource[] = linked
    .filter((reference) => isSafeEvidenceUrl(reference.url))
    .slice(0, 8)
    .map((reference, index) => ({
      id: reference.id || `source-${index + 1}`,
      label: `${reference.journal} · ${reference.year}`,
      title: reference.title,
      url: reference.url,
      year: reference.year,
      findings: reference.keyFindings.slice(0, 6),
      studiedProtocol: reference.dosageInfo,
    }));

  if (sources.length === 0 && evidence.sourceUrl && isSafeEvidenceUrl(evidence.sourceUrl)) {
    sources.push({
      id: `summary-${peptideId}`,
      label: evidence.sourceLabel || 'Primary source',
      title: evidence.note,
      url: evidence.sourceUrl,
      findings: [evidence.note],
    });
  }

  return {
    peptideId,
    peptideName: peptide.name,
    evidenceLabel: evidence.label,
    evidenceNote: evidence.note,
    lastReviewed: evidence.lastReviewed,
    sources,
  };
}

export function questionRequestsPersonalDose(question: string): boolean {
  const normalized = question.toLowerCase();
  return [
    /\bwhat (dose|dosage|amount) should i\b/,
    /\bhow much should i\b/,
    /\brecommend(?:ed)? (?:a )?(dose|dosage|protocol|cycle)\b/,
    /\b(starting|starter|ideal|best|optimal) (dose|dosage|protocol|cycle)\b/,
    /\bfor me\b.*\b(dose|dosage|protocol|cycle)\b/,
    /\bmy (weight|age|condition|medication|bloodwork)\b/,
  ].some((pattern) => pattern.test(normalized));
}

export function questionRequestsMeasurementExplanation(question: string): boolean {
  return /\b(my|recorded|calculator|calculation|measurement|syringe|units?|diluent|vial)\b/i.test(question);
}

export function numberedSourceLabel(index: number): string {
  return `S${index + 1}`;
}
