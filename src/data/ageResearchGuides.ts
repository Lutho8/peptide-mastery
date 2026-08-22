export interface AgeResearchTopic {
  label: string;
  compounds: string;
}

export interface AgeResearchGuide {
  id: '30s' | '40s' | '50s' | '60plus';
  title: string;
  intro: string;
  topics: AgeResearchTopic[];
}

export const ageResearchGuides: AgeResearchGuide[] = [
  {
    id: '30s',
    title: 'Research map for your 30s',
    intro: 'A plain-language starting map for the five topics requested by Peptide South Africa.',
    topics: [
      { label: 'Mitochondrial and metabolic research', compounds: 'SS-31 / MOTS-c' },
      { label: 'Immune-system research', compounds: 'Thymosin Alpha-1' },
      { label: 'Recovery and tissue research', compounds: 'BPC-157' },
      { label: 'Inflammation and gut research', compounds: 'KPV' },
      { label: 'Skin, collagen and tissue research', compounds: 'GHK-Cu' },
    ],
  },
  {
    id: '40s',
    title: 'Research map for your 40s',
    intro: 'Start with evidence quality, current health context and medication review—not an age-only stack.',
    topics: [
      { label: 'Metabolic evidence', compounds: 'Semaglutide / Tirzepatide' },
      { label: 'Mitochondrial research', compounds: 'SS-31 / MOTS-c' },
      { label: 'Immune evidence', compounds: 'Thymosin Alpha-1' },
      { label: 'Recovery research', compounds: 'BPC-157 / KPV' },
      { label: 'Skin and tissue research', compounds: 'GHK-Cu' },
    ],
  },
  {
    id: '50s',
    title: 'Research map for your 50s',
    intro: 'Prioritize clinician-reviewed cardiometabolic context, interactions and the limits of experimental evidence.',
    topics: [
      { label: 'Cardiometabolic trial evidence', compounds: 'Semaglutide / Tirzepatide' },
      { label: 'Mitochondrial evidence', compounds: 'Elamipretide (SS-31)' },
      { label: 'Immune evidence and limitations', compounds: 'Thymosin Alpha-1' },
      { label: 'Tissue-repair research', compounds: 'BPC-157 / GHK-Cu' },
      { label: 'Gut and inflammation research', compounds: 'KPV' },
    ],
  },
  {
    id: '60plus',
    title: 'Research map for 60+',
    intro: 'Medication interactions, kidney/liver context, frailty and clinician review come before compound selection.',
    topics: [
      { label: 'Clinician-led metabolic evidence', compounds: 'Semaglutide / Tirzepatide' },
      { label: 'Narrow-indication mitochondrial evidence', compounds: 'Elamipretide (SS-31)' },
      { label: 'Immune evidence and negative trials', compounds: 'Thymosin Alpha-1' },
      { label: 'Experimental recovery evidence', compounds: 'BPC-157 / KPV' },
      { label: 'Skin and tissue research', compounds: 'GHK-Cu' },
    ],
  },
];

export function getAgeResearchGuide(age: number): AgeResearchGuide {
  if (age >= 60) return ageResearchGuides[3];
  if (age >= 50) return ageResearchGuides[2];
  if (age >= 40) return ageResearchGuides[1];
  return ageResearchGuides[0];
}
