import { Peptide, PeptideCategory } from './peptides';

/**
 * Newly catalogued peptides from the latest supplier price sheet.
 * Kept lean (research-grade entries) — name, category, mechanism, benefits,
 * dosing, and vial sizes. No price/supplier data per project policy.
 */

interface NewPeptideSeed {
  id: string;
  name: string;
  shortName: string;
  category: PeptideCategory;
  mechanism: string;
  benefits: string[];
  risks?: string[];
  dose: string;        // single canonical dosing string used across tiers
  frequency: string;
  vialSizesMg: number[];
  longevityScore?: number;
  administration?: string;
  expectedResults?: Peptide['expectedResults'];
  warnings?: string[];
  clinicalStatus?: Peptide['clinicalStatus'];
  fdaApproved?: boolean;
}

const seeds: NewPeptideSeed[] = [
  { id: 'eloralintide', name: 'Eloralintide (LY3841136)', shortName: 'Eloralintide', category: 'weight-loss',
    mechanism: 'A long-acting, selective amylin-receptor agonist being studied for obesity. In everyday terms, it is designed to strengthen the body\'s “I am full” signal so a person may feel satisfied with less food.',
    benefits: [
      'Investigational once-weekly obesity medicine',
      'Phase 2 trial reported dose-dependent weight reduction over 48 weeks',
      'Mean weight change ranged from about 9% at 1 mg to 20% in the 9 mg maintenance arms',
      'Higher-dose arms also showed reductions in waist circumference and improvements in several metabolic markers',
    ],
    risks: [
      'Nausea and fatigue were the most common adverse events in the phase 2 trial',
      'Constipation, diarrhoea, vomiting, decreased appetite and headache were also reported',
      'Blood pressure and pulse fell in treated groups; dizziness, fainting or unusually slow pulse need medical review',
      'Long-term safety is not established because eloralintide remains investigational',
    ],
    dose: 'No approved dose. Phase 2 studied 1, 3, 6 and 9 mg once weekly, plus staged 6→9 mg and 3→6→9 mg arms.',
    frequency: 'Once weekly in the phase 2 trial',
    vialSizesMg: [],
    longevityScore: 7,
    administration: 'Subcutaneous injection in clinical trials',
    expectedResults: {
      week1_2: 'No reliable personal result can be predicted from the published phase 2 data.',
      week3_4: 'The trial measured change over months; early individual response varied.',
      week5_8: 'The published result does not establish a guaranteed short-term timeline for an individual.',
      longTerm: 'At week 48, mean weight change ranged from about -9% at 1 mg to -20% in the 9 mg maintenance arms versus -0.4% with placebo (efficacy estimand).',
    },
    warnings: [
      'Investigational: not an approved medicine or a self-treatment protocol',
      'Trial doses describe research arms, not a personal recommendation',
      'The pivotal phase 2 trial excluded people with type 2 diabetes, pancreatitis history, certain cardiovascular conditions and bradyarrhythmias',
    ],
    clinicalStatus: 'phase2',
    fdaApproved: false },

  { id: 'gonadorelin', name: 'Gonadorelin', shortName: 'Gonadorelin', category: 'hormonal',
    mechanism: 'Synthetic GnRH decapeptide that stimulates pituitary release of LH and FSH.',
    benefits: ['Stimulates LH/FSH release', 'Supports testicular function on TRT', 'Restores HPG signaling'],
    dose: '100mcg 2-3x/week (research)', frequency: '2–3x weekly', vialSizesMg: [2], longevityScore: 6 },

  { id: 'ace031', name: 'ACE-031', shortName: 'ACE-031', category: 'healing',
    mechanism: 'Soluble activin receptor decoy that inhibits myostatin signaling, promoting muscle growth.',
    benefits: ['Increased lean mass', 'Reduced muscle wasting', 'Improved strength'],
    dose: '0.5–1mg weekly', frequency: 'Weekly', vialSizesMg: [1], longevityScore: 6 },

  { id: 'aicar', name: 'AICAR', shortName: 'AICAR', category: 'metabolic',
    mechanism: 'AMPK activator that mimics endurance-exercise signaling and increases mitochondrial biogenesis.',
    benefits: ['Improved endurance', 'Enhanced fat oxidation', 'Mitochondrial biogenesis'],
    dose: '50–500mg daily (research)', frequency: 'Daily', vialSizesMg: [50], longevityScore: 6 },

  { id: 'adipotide', name: 'Adipotide', shortName: 'Adipotide', category: 'weight-loss',
    mechanism: 'Pro-apoptotic peptide targeting prohibitin in white adipose vasculature.',
    benefits: ['Targeted fat loss in animal studies'], risks: ['Renal toxicity in primates — not for human use'],
    dose: 'Research only', frequency: 'Research only', vialSizesMg: [2, 5], longevityScore: 4 },

  { id: 'na-selank-amidate', name: 'N-Acetyl Selank Amidate', shortName: 'NA-Selank', category: 'cognitive',
    mechanism: 'Stabilized analog of Selank with extended half-life via N-acetylation and C-amidation.',
    benefits: ['Anxiolytic', 'Improved focus', 'Longer duration than Selank'],
    dose: '300–600mcg intranasal daily', frequency: 'Daily', vialSizesMg: [30], longevityScore: 6 },

  { id: 'na-semax-amidate', name: 'N-Acetyl Semax Amidate', shortName: 'NA-Semax', category: 'cognitive',
    mechanism: 'Stabilized Semax analog acting on BDNF and melanocortin pathways.',
    benefits: ['Neuroprotection', 'Cognitive enhancement', 'Mood support'],
    dose: '300–600mcg intranasal daily', frequency: 'Daily', vialSizesMg: [30], longevityScore: 7 },

  { id: 'tb500-frag', name: 'TB-500 Fragment', shortName: 'TB-500 Frag', category: 'healing',
    mechanism: 'Active fragment of Thymosin β4 promoting actin regulation and tissue repair.',
    benefits: ['Tissue repair', 'Reduced inflammation', 'Improved recovery'],
    dose: '2–5mg weekly', frequency: 'Weekly', vialSizesMg: [10], longevityScore: 7 },

  { id: 'mgf', name: 'Mechano Growth Factor', shortName: 'MGF', category: 'healing',
    mechanism: 'IGF-1 splice variant released after muscle damage; activates satellite cells.',
    benefits: ['Local muscle repair', 'Satellite cell activation', 'Hypertrophy support'],
    dose: '100–200mcg post-workout (local)', frequency: 'Post-workout', vialSizesMg: [2], longevityScore: 6 },

  { id: 'peg-mgf', name: 'PEG-MGF', shortName: 'PEG-MGF', category: 'healing',
    mechanism: 'Pegylated MGF with extended systemic half-life for sustained satellite-cell activation.',
    benefits: ['Systemic muscle repair', 'Longer half-life than MGF', 'Recovery support'],
    dose: '200–400mcg 2x/week', frequency: '2x weekly', vialSizesMg: [2], longevityScore: 6 },

  { id: 'thymalin', name: 'Thymalin', shortName: 'Thymalin', category: 'immune',
    mechanism: 'Thymic peptide complex restoring T-cell maturation and immune balance.',
    benefits: ['Immune restoration', 'Anti-aging effects in elderly studies', 'Reduced infections'],
    dose: '5–10mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [10], longevityScore: 7 },

  { id: 'melatonin', name: 'Melatonin', shortName: 'Melatonin', category: 'longevity',
    mechanism: 'Pineal hormone regulating circadian rhythm with antioxidant and immune effects.',
    benefits: ['Sleep regulation', 'Antioxidant', 'Circadian alignment'],
    dose: '0.3–5mg before bed', frequency: 'Nightly', vialSizesMg: [10], longevityScore: 7 },

  { id: 'hgh-frag-176-191', name: 'HGH Fragment 176-191', shortName: 'HGH 176-191', category: 'weight-loss',
    mechanism: 'C-terminal HGH fragment with isolated lipolytic activity, no IGF-1 elevation.',
    benefits: ['Targeted fat loss', 'No GH-related side effects', 'No IGF-1 elevation'],
    dose: '250–500mcg 2x/day', frequency: '1–2x daily', vialSizesMg: [2, 5, 10], longevityScore: 6 },

  { id: 'dermorphin', name: 'Dermorphin', shortName: 'Dermorphin', category: 'healing',
    mechanism: 'Highly selective μ-opioid agonist isolated from amphibian skin.',
    benefits: ['Potent analgesia (animal research)'], risks: ['Opioid risks; banned in equine sports'],
    dose: 'Research only', frequency: 'Research only', vialSizesMg: [5], longevityScore: 3 },

  { id: 'glutathione', name: 'Glutathione', shortName: 'GSH', category: 'longevity',
    mechanism: 'Master endogenous antioxidant; tripeptide of glutamate, cysteine, glycine.',
    benefits: ['Oxidative-stress reduction', 'Liver detox support', 'Skin brightening'],
    dose: '600–1500mg IV/IM 1–3x/week', frequency: '1–3x weekly', vialSizesMg: [1500], longevityScore: 8 },

  { id: 'hmg', name: 'Human Menopausal Gonadotropin', shortName: 'HMG', category: 'hormonal',
    mechanism: 'Mixture of LH and FSH activity; stimulates gonadal steroidogenesis.',
    benefits: ['Spermatogenesis support', 'Fertility restoration on TRT'],
    dose: '75 IU 2–3x/week', frequency: '2–3x weekly', vialSizesMg: [0.075], longevityScore: 6 },

  { id: 'epo', name: 'Erythropoietin', shortName: 'EPO', category: 'metabolic',
    mechanism: 'Glycoprotein hormone stimulating red blood cell production.',
    benefits: ['Increased RBC count', 'Improved oxygen delivery'],
    risks: ['Thrombosis, hypertension; banned in sport'],
    dose: 'Research only', frequency: 'Research only', vialSizesMg: [3], longevityScore: 4 },

  { id: 'ara290', name: 'ARA-290 (Cibinetide)', shortName: 'ARA-290', category: 'healing',
    mechanism: 'Non-erythropoietic EPO derivative activating tissue-protective EPO receptor.',
    benefits: ['Neuropathy relief', 'Anti-inflammatory', 'Tissue repair without RBC effects'],
    dose: '4mg subq daily', frequency: 'Daily', vialSizesMg: [10], longevityScore: 7 },

  { id: 'alprostadil', name: 'Alprostadil', shortName: 'Alprostadil', category: 'hormonal',
    mechanism: 'Prostaglandin E1 analog causing smooth-muscle relaxation and vasodilation.',
    benefits: ['Erectile function support', 'Vascular effects'],
    dose: '5–20mcg per dose (medical)', frequency: 'As needed', vialSizesMg: [0.02], longevityScore: 5 },

  { id: 'survodutide', name: 'Survodutide', shortName: 'Survodutide', category: 'weight-loss',
    mechanism: 'Dual GLP-1 / glucagon receptor agonist for weight loss and metabolic disease.',
    benefits: ['Weight loss', 'Improved liver fat (MASH trials)', 'Glycemic control'],
    dose: '0.6–6mg weekly', frequency: 'Weekly', vialSizesMg: [10], longevityScore: 8 },

  { id: 'adamax', name: 'Adamax', shortName: 'Adamax', category: 'cognitive',
    mechanism: 'ACTH(4-10)/Pro-Gly-Pro analog targeting cognition and stress resilience.',
    benefits: ['Cognitive support', 'Anxiolytic', 'Neuroprotective'],
    dose: '200–500mcg intranasal daily', frequency: 'Daily', vialSizesMg: [5], longevityScore: 6 },

  { id: 'pe22-28', name: 'PE 22-28', shortName: 'PE 22-28', category: 'cognitive',
    mechanism: 'Spadin analog blocking TREK-1 channels; rapid antidepressant in rodent models.',
    benefits: ['Antidepressant (preclinical)', 'Mood support'],
    dose: '200–500mcg daily (research)', frequency: 'Daily', vialSizesMg: [10], longevityScore: 5 },

  { id: 'na-epitalon-amidate', name: 'N-Acetyl Epitalon Amidate', shortName: 'NA-Epitalon', category: 'longevity',
    mechanism: 'Stabilized Epitalon analog; pineal-active tetrapeptide with telomerase modulation.',
    benefits: ['Telomere support', 'Pineal regulation', 'Longer half-life than Epitalon'],
    dose: '5–10mg daily for 10–20 days', frequency: 'Daily (cycled)', vialSizesMg: [5], longevityScore: 7 },

  { id: 'vilon', name: 'Vilon', shortName: 'Vilon', category: 'bioregulators',
    mechanism: 'Khavinson dipeptide (Lys-Glu) regulating immune gene expression.',
    benefits: ['Immune modulation', 'Anti-aging in animal studies'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 6 },

  { id: 'pinealon', name: 'Pinealon', shortName: 'Pinealon', category: 'bioregulators',
    mechanism: 'Khavinson tripeptide (Glu-Asp-Arg) targeting brain bioregulation.',
    benefits: ['Cognitive support', 'Neuroprotection', 'Anti-aging'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [5, 10, 20], longevityScore: 6 },

  { id: 'pnc27', name: 'PNC-27', shortName: 'PNC-27', category: 'longevity',
    mechanism: 'p53-derived peptide selectively inducing necrosis in cancer-cell membranes.',
    benefits: ['Selective cancer-cell membranolysis (research)'],
    dose: 'Research only', frequency: 'Research only', vialSizesMg: [5, 10], longevityScore: 5 },

  { id: 'testagen', name: 'Testagen', shortName: 'Testagen', category: 'bioregulators',
    mechanism: 'Khavinson tetrapeptide (Lys-Glu-Asp-Gly) regulating thymic gene expression.',
    benefits: ['Immune support', 'Bioregulation of thymic function'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 6 },

  { id: 'teriparatide', name: 'Teriparatide', shortName: 'Teriparatide', category: 'hormonal',
    mechanism: 'Recombinant parathyroid hormone (1-34) stimulating osteoblast activity.',
    benefits: ['Increased bone density', 'Fracture-risk reduction', 'FDA-approved for osteoporosis'],
    dose: '20mcg subq daily', frequency: 'Daily', vialSizesMg: [10], longevityScore: 7 },

  { id: 'bronchogen', name: 'Bronchogen', shortName: 'Bronchogen', category: 'bioregulators',
    mechanism: 'Khavinson tetrapeptide bioregulator targeting bronchopulmonary tissue.',
    benefits: ['Respiratory tissue support', 'Reduced inflammation in lung studies'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'cardiogen', name: 'Cardiogen', shortName: 'Cardiogen', category: 'bioregulators',
    mechanism: 'Khavinson peptide bioregulator targeting cardiac tissue.',
    benefits: ['Cardiac tissue support', 'Anti-aging in animal models'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'cortagen', name: 'Cortagen', shortName: 'Cortagen', category: 'bioregulators',
    mechanism: 'Khavinson tetrapeptide bioregulator targeting cortical and immune tissue.',
    benefits: ['Cognitive support', 'Immune regulation'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'livagen', name: 'Livagen', shortName: 'Livagen', category: 'bioregulators',
    mechanism: 'Khavinson peptide bioregulator targeting liver and lymphoid tissue.',
    benefits: ['Liver tissue support', 'Immune regulation'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'pancragen', name: 'Pancragen', shortName: 'Pancragen', category: 'bioregulators',
    mechanism: 'Khavinson tetrapeptide bioregulator targeting pancreatic tissue.',
    benefits: ['Pancreatic tissue support', 'Glucose regulation in studies'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'prostamax', name: 'Prostamax', shortName: 'Prostamax', category: 'bioregulators',
    mechanism: 'Khavinson peptide bioregulator targeting prostate tissue.',
    benefits: ['Prostate tissue support', 'BPH research applications'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'cartalax', name: 'Cartalax', shortName: 'Cartalax', category: 'bioregulators',
    mechanism: 'Khavinson tripeptide (Ala-Glu-Asp) targeting cartilage and connective tissue.',
    benefits: ['Cartilage tissue support', 'Joint support in animal studies'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'chonluten', name: 'Chonluten', shortName: 'Chonluten', category: 'bioregulators',
    mechanism: 'Khavinson tripeptide (Glu-Asp-Gly) bioregulator for bronchial epithelium.',
    benefits: ['Respiratory tissue support', 'Anti-inflammatory in lung studies'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'crystagen', name: 'Crystagen', shortName: 'Crystagen', category: 'bioregulators',
    mechanism: 'Khavinson tetrapeptide bioregulator targeting immune (thymic) tissue.',
    benefits: ['Immune tissue support', 'Anti-aging effects in animal studies'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'ovagen', name: 'Ovagen', shortName: 'Ovagen', category: 'bioregulators',
    mechanism: 'Khavinson tripeptide bioregulator targeting hepatic tissue.',
    benefits: ['Liver tissue support', 'Detox-pathway modulation'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },

  { id: 'vesugen', name: 'Vesugen', shortName: 'Vesugen', category: 'bioregulators',
    mechanism: 'Khavinson tripeptide (Lys-Glu-Asp) targeting vascular endothelium.',
    benefits: ['Vascular tissue support', 'Endothelial-function research'],
    dose: '1–2mg daily for 10 days', frequency: 'Daily (cycled)', vialSizesMg: [20], longevityScore: 5 },
];

function expand(seed: NewPeptideSeed): Peptide {
  const dose = seed.dose;
  return {
    id: seed.id,
    name: seed.name,
    shortName: seed.shortName,
    category: seed.category,
    longevityScore: seed.longevityScore ?? 6,
    mechanism: seed.mechanism,
    benefits: seed.benefits,
    athleteBenefits: seed.benefits.slice(0, 3),
    risks: seed.risks ?? ['Injection site reactions', 'Limited long-term human data — research use only'],
    dosing: { beginner: dose, intermediate: dose, advanced: dose, athlete: dose },
    frequency: seed.frequency,
    administration: seed.administration ?? 'Subcutaneous injection (research use)',
    expectedResults: seed.expectedResults ?? {
      week1_2: 'Initial adaptation phase',
      week3_4: 'Early protocol effects emerging',
      week5_8: 'Full protocol effects, where applicable',
      longTerm: 'Sustained effects with proper cycling',
    },
    janoshikTested: false,
    supplier: { name: 'Research Supplier', productCode: seed.id, price: 0, stock: 'in-stock' },
    vialSizesMg: seed.vialSizesMg,
    cycleProtocol: {
      minDays: 28,
      maxDays: 56,
      breakDays: 14,
      restartAdvice: 'Allow a 2–4 week break before restarting.',
      breakAdvice: ['Monitor labs and subjective markers', 'Maintain lifestyle and recovery practices'],
    },
    warnings: seed.warnings ?? ['Research-use only. Not FDA approved. Consult a qualified physician.'],
    clinicalStatus: seed.clinicalStatus,
    fdaApproved: seed.fdaApproved,
  };
}

export const newPeptidesFromCatalog: Peptide[] = seeds.map(expand);
