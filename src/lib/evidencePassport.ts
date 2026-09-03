import type { Peptide } from '@/data/peptides';
import { buildEvidencePacket } from '@/lib/evidenceCompanion';
import { getPeptideEvidence, type EvidenceLevel } from '@/data/researchEvidence';

export type PassportTone = 'strong' | 'developing' | 'early' | 'unknown' | 'caution';

export interface PassportDimension {
  id: 'human-evidence' | 'development-status' | 'identity-match' | 'route-match' | 'safety-record';
  label: string;
  value: string;
  detail: string;
  tone: PassportTone;
}

export interface EvidencePassport {
  peptideId: string;
  version: string;
  reviewedAt: string;
  dimensions: PassportDimension[];
  gaps: string[];
  sourceCount: number;
}

const evidenceRank: Record<EvidenceLevel, number> = {
  'regulatory-approval': 7,
  'phase-3': 6,
  'phase-2': 5,
  'human-pilot': 4,
  'human-observational': 3,
  preclinical: 2,
  'catalog-only': 1,
};

export function evidenceRankFor(peptide: Peptide): number {
  return evidenceRank[getPeptideEvidence(peptide).level];
}

function humanEvidenceDimension(level: EvidenceLevel): PassportDimension {
  const map: Record<EvidenceLevel, Omit<PassportDimension, 'id' | 'label'>> = {
    'regulatory-approval': {
      value: 'Regulator-reviewed human evidence',
      detail: 'Human outcome evidence exists for a defined medicine, formulation and indication.',
      tone: 'strong',
    },
    'phase-3': {
      value: 'Confirmatory human evidence',
      detail: 'Phase 3 evidence is recorded, but the exact indication and study population still matter.',
      tone: 'strong',
    },
    'phase-2': {
      value: 'Developing human evidence',
      detail: 'Phase 2 evidence can show a signal without establishing approval or broad suitability.',
      tone: 'developing',
    },
    'human-pilot': {
      value: 'Very limited human evidence',
      detail: 'Only a small human pilot or similarly limited exposure is linked.',
      tone: 'early',
    },
    'human-observational': {
      value: 'Human source linked; classification pending',
      detail: 'A human source exists, but its strength and applicability have not completed review.',
      tone: 'early',
    },
    preclinical: {
      value: 'Preclinical evidence',
      detail: 'The current record is mainly laboratory or animal research.',
      tone: 'early',
    },
    'catalog-only': {
      value: 'Evidence review pending',
      detail: 'Catalogue inclusion is not evidence that a claimed outcome is established.',
      tone: 'unknown',
    },
  };
  return { id: 'human-evidence', label: 'Human evidence', ...map[level] };
}

export function buildEvidencePassport(peptide: Peptide): EvidencePassport {
  const evidence = getPeptideEvidence(peptide);
  const packet = buildEvidencePacket(peptide.id);
  const sourceCount = packet?.sources.length ?? 0;
  const hasStudiedProtocol = packet?.sources.some((source) => Boolean(source.studiedProtocol)) ?? false;
  const isBlend = peptide.id.includes('blend') || peptide.name.toLowerCase().includes('blend');
  const safetyCount = new Set([...(peptide.risks ?? []), ...(peptide.warnings ?? [])]).size;
  const gaps: string[] = [];

  if (sourceCount === 0) gaps.push('No app-verified primary source is linked yet.');
  if (evidence.level === 'preclinical') gaps.push('No verified therapeutic human outcome is established in the current record.');
  if (evidence.level === 'catalog-only') gaps.push('The evidence classification is still pending.');
  if (!hasStudiedProtocol) gaps.push('The exact studied route and protocol have not been verified in the source record.');
  if (isBlend) gaps.push('Component evidence does not validate this exact combination.');

  const developmentValue = peptide.fdaApproved
    ? 'Approved medicine — indication-specific'
    : peptide.clinicalStatus === 'phase3'
      ? 'Phase 3 development or evidence'
      : peptide.clinicalStatus === 'phase2'
        ? 'Investigational — phase 2'
        : peptide.clinicalStatus === 'phase1'
          ? 'Early investigational — phase 1'
          : peptide.clinicalStatus === 'preclinical'
            ? 'Preclinical development'
            : 'Status not verified';

  return {
    peptideId: peptide.id,
    version: evidence.lastReviewed,
    reviewedAt: evidence.lastReviewed,
    sourceCount,
    gaps,
    dimensions: [
      humanEvidenceDimension(evidence.level),
      {
        id: 'development-status',
        label: 'Development status',
        value: developmentValue,
        detail: peptide.fdaApproved
          ? 'Approval applies only to the authorised product, population and indication.'
          : 'Investigational development is not the same as approval or product suitability.',
        tone: peptide.fdaApproved ? 'strong' : peptide.clinicalStatus ? 'developing' : 'unknown',
      },
      {
        id: 'identity-match',
        label: 'Identity match',
        value: isBlend ? 'Component-only evidence' : sourceCount > 0 ? 'Named compound linked' : 'Not verified',
        detail: isBlend
          ? 'The current sources may concern individual components rather than the exact blend.'
          : sourceCount > 0
            ? 'Sources are linked to the named compound; formulation and product quality remain separate questions.'
            : 'A matching primary source has not yet been attached.',
        tone: isBlend ? 'caution' : sourceCount > 0 ? 'developing' : 'unknown',
      },
      {
        id: 'route-match',
        label: 'Route relevance',
        value: hasStudiedProtocol ? 'Study protocol recorded' : 'Route match not verified',
        detail: hasStudiedProtocol
          ? 'At least one linked source records a studied protocol; it remains study context, not an instruction.'
          : `Catalogue route: ${peptide.administration || 'not recorded'}. A matching human study route is not confirmed.`,
        tone: hasStudiedProtocol ? 'developing' : 'unknown',
      },
      {
        id: 'safety-record',
        label: 'Safety record',
        value: safetyCount > 0 ? `${safetyCount} documented flag${safetyCount === 1 ? '' : 's'}` : 'Incomplete',
        detail: safetyCount > 0
          ? 'Documented flags are visible, but absence of a listed risk would not prove safety.'
          : 'The current record does not contain a sufficiently reviewed safety summary.',
        tone: safetyCount > 0 ? 'caution' : 'unknown',
      },
    ],
  };
}

export function compareByEvidence(a: Peptide, b: Peptide): number {
  const rankDifference = evidenceRankFor(b) - evidenceRankFor(a);
  if (rankDifference !== 0) return rankDifference;
  return buildEvidencePassport(b).sourceCount - buildEvidencePassport(a).sourceCount;
}
