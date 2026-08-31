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
  beginner: BeginnerCompoundContext;
}

export interface BeginnerCompoundContext {
  simpleExplanation: string;
  discussedFor: string[];
  safetyFlags: string[];
  status: string;
  administration?: string;
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

const CURATED_BEGINNER_EXPLANATIONS: Record<string, string> = {
  semaglutide: 'It copies a natural GLP-1 signal that helps you feel full, slows how quickly food leaves the stomach and helps the body manage blood sugar.',
  tirzepatide: 'It turns on two gut-hormone signals, GIP and GLP-1, which can reduce hunger and improve blood-sugar control.',
  retatrutide: 'It is an experimental medicine that activates three metabolic signals—GIP, GLP-1 and glucagon—to affect hunger, blood sugar and energy use.',
  eloralintide: 'It is an experimental amylin medicine designed to strengthen the body’s “I’m full” signal so a person may feel satisfied with less food.',
  cagrilintide: 'It is an experimental long-acting version of amylin, a hormone involved in fullness after eating.',
  bpc157: 'It is an experimental peptide discussed for tissue and gut repair, but convincing human evidence is still extremely limited.',
  tb500: 'It is a lab-made fragment related to thymosin beta-4 and is discussed for tissue repair; most claims are not supported by strong human trials.',
  mk677: 'It is not a peptide. It is an oral ghrelin-receptor drug that can raise growth hormone and IGF-1, and can also increase hunger and worsen blood-sugar control.',
  ipamorelin: 'It is a growth-hormone secretagogue, meaning it signals the pituitary gland to release more growth hormone.',
  cjc1295: 'It is a lab-made version of a growth-hormone-releasing signal that tells the pituitary gland to release more growth hormone.',
  tesamorelin: 'It is a prescription growth-hormone-releasing medicine approved for a narrow use: reducing excess abdominal fat in certain adults with HIV.',
  ghkcu: 'It is a copper-carrying peptide found naturally in the body and is mostly discussed for skin, hair and wound-repair research.',
  motsc: 'It is a small signal made from mitochondrial genetic material and is being studied for metabolism and how cells respond to energy stress.',
  ss31: 'Also called elamipretide, it targets mitochondria. Its approval is limited to Barth syndrome and does not prove general anti-ageing benefits.',
  aod9604: 'It is a fragment related to human growth hormone that was studied for fat loss, but it has not become an approved obesity medicine.',
};

function beginnerStatus(peptide: NonNullable<ReturnType<typeof findPeptideOrBlend>>): string {
  if (peptide.fdaApproved) return 'Approved medicine — only for its authorised product, indication and patient group';
  if (peptide.clinicalStatus === 'phase3') return 'Investigational — phase 3 evidence or development';
  if (peptide.clinicalStatus === 'phase2') return 'Investigational — phase 2 evidence or development';
  if (peptide.clinicalStatus === 'phase1') return 'Early investigational — phase 1';
  if (peptide.clinicalStatus === 'preclinical') return 'Preclinical — mainly laboratory or animal research';
  return 'Research or catalogue compound — approval and human evidence not established here';
}

function fallbackBeginnerExplanation(peptide: NonNullable<ReturnType<typeof findPeptideOrBlend>>): string {
  const firstSentence = peptide.mechanism.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (!firstSentence) return `${peptide.name} is listed in the app for research education, but a plain-language evidence review is still pending.`;
  return firstSentence
    .replace(/\bagonist\b/gi, 'signal activator')
    .replace(/\bantagonist\b/gi, 'signal blocker')
    .replace(/\bsubcutaneous\b/gi, 'under-the-skin')
    .replace(/\blipolysis\b/gi, 'fat breakdown')
    .replace(/\banxiolytic\b/gi, 'anxiety-reducing effect')
    .replace(/\bneuroprotective\b/gi, 'nerve-cell protection')
    .replace(/\bimmunomodulat(?:e|es|ing)\b/gi, 'changes immune activity');
}

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
    beginner: {
      simpleExplanation: CURATED_BEGINNER_EXPLANATIONS[peptideId] ?? fallbackBeginnerExplanation(peptide),
      discussedFor: peptide.benefits.slice(0, 4),
      safetyFlags: [...peptide.risks, ...(peptide.warnings ?? [])]
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 6),
      status: beginnerStatus(peptide),
      administration: peptide.administration,
    },
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
