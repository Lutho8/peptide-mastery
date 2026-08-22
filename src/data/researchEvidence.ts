import type { Peptide } from './peptides';
import type { PeptideBlend } from './peptideBlends';
import { researchReferences } from './researchReferences';

export const RESEARCH_LAST_REVIEWED = '2026-08-23';

export type EvidenceLevel =
  | 'regulatory-approval'
  | 'phase-3'
  | 'phase-2'
  | 'human-pilot'
  | 'human-observational'
  | 'preclinical'
  | 'catalog-only';

export interface EvidenceSummary {
  level: EvidenceLevel;
  label: string;
  note: string;
  sourceUrl?: string;
  sourceLabel?: string;
  lastReviewed: string;
}

const VERIFIED: Record<string, Omit<EvidenceSummary, 'lastReviewed'>> = {
  ss31: {
    level: 'regulatory-approval',
    label: 'Approved · narrow indication',
    note: 'Elamipretide has accelerated FDA approval for Barth syndrome in patients weighing at least 30 kg. This does not establish general longevity or metabolic benefit.',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements/fda-grants-accelerated-approval-first-treatment-barth-syndrome',
    sourceLabel: 'FDA · 2025',
  },
  semaglutide: {
    level: 'regulatory-approval',
    label: 'Approved medicine · indication-specific',
    note: 'Large randomized outcome trials exist. Product, indication and patient-specific decisions remain clinical matters.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/38785209/',
    sourceLabel: 'FLOW · NEJM 2024',
  },
  tirzepatide: {
    level: 'regulatory-approval',
    label: 'Approved medicine · indication-specific',
    note: 'Multiple randomized phase 3 trials exist. Evidence for the medicine does not transfer to custom blends or research material.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/38912654/',
    sourceLabel: 'SURMOUNT-OSA · NEJM 2024',
  },
  cagrilintide: {
    level: 'phase-3',
    label: 'Phase 3 combination evidence',
    note: 'REDEFINE 1 studied cagrilintide coadministered with semaglutide under trial conditions. It does not validate arbitrary stacks.',
    sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2502081',
    sourceLabel: 'REDEFINE 1 · NEJM 2025',
  },
  survodutide: {
    level: 'phase-3',
    label: 'Phase 3 evidence',
    note: 'A randomized phase 3 obesity trial has been published; regulatory status and indication must still be checked in the user’s jurisdiction.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/42253238/',
    sourceLabel: 'SYNCHRONIZE-1 · 2026',
  },
  retatrutide: {
    level: 'phase-2',
    label: 'Investigational · phase 2 published',
    note: 'Randomized phase 2 results are published while phase 3 development continues. This is not approval or a self-treatment protocol.',
    sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972',
    sourceLabel: 'NEJM · 2023',
  },
  bpc157: {
    level: 'human-pilot',
    label: 'Human evidence extremely limited',
    note: 'The newest safety publication included two previously exposed adults. Most efficacy claims still rely on preclinical evidence.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/40131143/',
    sourceLabel: 'Human pilot · 2025',
  },
  ta1: {
    level: 'phase-3',
    label: 'Mixed human evidence',
    note: 'A large 2025 phase 3 sepsis trial found no 28-day mortality benefit. Evidence depends on indication and should not be generalized.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39814420/',
    sourceLabel: 'TESTS trial · BMJ 2025',
  },
  motsc: {
    level: 'preclinical',
    label: 'Predominantly preclinical',
    note: 'Mechanistic and animal evidence exists; the catalog does not currently contain a verified therapeutic phase 3 outcome trial.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/25738459/',
    sourceLabel: 'Cell Metabolism · 2015',
  },
  kpv: {
    level: 'preclinical',
    label: 'Predominantly preclinical',
    note: 'Anti-inflammatory mechanisms are described in laboratory research; combination and clinical-outcome evidence is not established here.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16163992/',
    sourceLabel: 'Mechanistic literature',
  },
  ghkcu: {
    level: 'preclinical',
    label: 'Laboratory and topical research',
    note: 'Mechanistic and tissue-remodelling literature exists. Route, formulation and combination claims require separate evidence.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/24508075/',
    sourceLabel: 'Gene · 2014',
  },
};

export function getPeptideEvidence(peptide: Peptide): EvidenceSummary {
  const verified = VERIFIED[peptide.id];
  if (verified) return { ...verified, lastReviewed: RESEARCH_LAST_REVIEWED };

  const refs = researchReferences.filter((ref) => ref.peptideIds.includes(peptide.id));
  if (refs.length > 0) {
    return {
      level: 'human-observational',
      label: 'Source linked · level not re-verified',
      note: `${refs.length} source${refs.length === 1 ? '' : 's'} linked. A primary-source evidence classification is still pending; no protocol should be inferred.`,
      sourceUrl: refs[0].url,
      sourceLabel: refs[0].journal,
      lastReviewed: RESEARCH_LAST_REVIEWED,
    };
  }

  return {
    level: 'catalog-only',
    label: 'Catalogued · evidence review pending',
    note: 'Included for catalog completeness. No app-verified primary source has yet been assigned, so efficacy, safety or dosing must not be inferred.',
    lastReviewed: RESEARCH_LAST_REVIEWED,
  };
}

export function getBlendEvidence(blend: PeptideBlend): EvidenceSummary {
  return {
    level: 'catalog-only',
    label: 'Component evidence only',
    note: `${blend.components.length} listed components. Unless a source explicitly studies this exact formulation, component evidence does not prove the blend or stack is effective, compatible or safe.`,
    lastReviewed: RESEARCH_LAST_REVIEWED,
  };
}

export const evidenceTone: Record<EvidenceLevel, string> = {
  'regulatory-approval': 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  'phase-3': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  'phase-2': 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  'human-pilot': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  'human-observational': 'bg-violet-500/15 text-violet-500 border-violet-500/30',
  'preclinical': 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  'catalog-only': 'bg-muted text-muted-foreground border-border',
};
