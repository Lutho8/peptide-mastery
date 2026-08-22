import { expandedPeptides } from './peptidesExpanded';
import { newPeptidesFromCatalog } from './peptidesNewCatalog';
import { VIAL_SIZES_MG } from './vialSizes';

export type PeptideCategory = 'immune' | 'longevity' | 'cognitive' | 'metabolic' | 'healing' | 'gh-secretagogue' | 'weight-loss' | 'anti-aging' | 'skin-hair' | 'hormonal' | 'bioregulators';

// Category configuration with counts matching actual database
export const categoryConfig: Record<PeptideCategory, { label: string; count: number; color: string; bgColor: string }> = {
  'weight-loss': { label: 'Weight Loss', count: 9, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  'gh-secretagogue': { label: 'Growth Hormone', count: 11, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  'healing': { label: 'Healing', count: 4, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  'anti-aging': { label: 'Anti-Aging', count: 0, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  'cognitive': { label: 'Cognitive', count: 6, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  'immune': { label: 'Immune', count: 5, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  'skin-hair': { label: 'Skin & Hair', count: 8, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  'hormonal': { label: 'Hormonal', count: 3, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  'bioregulators': { label: 'Bioregulators', count: 0, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  'longevity': { label: 'Longevity', count: 8, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  'metabolic': { label: 'Metabolic', count: 2, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
};

export interface Peptide {
  id: string;
  name: string;
  shortName: string;
  category: PeptideCategory;
  molecularWeight?: string;
  halfLife?: string;
  longevityScore: number;
  mechanism: string;
  benefits: string[];
  athleteBenefits: string[];
  risks: string[];
  dosing: {
    beginner: string;
    intermediate: string;
    advanced: string;
    athlete: string;
  };
  frequency: string;
  administration: string;
  expectedResults: {
    week1_2: string;
    week3_4: string;
    week5_8: string;
    longTerm: string;
  };
  janoshikTested: boolean;
  janoshikPurity?: number;
  janoshikDate?: string;
  janoshikCOA?: Array<{
    taskNumber: string;
    verifyKey: string;
    sampleName: string;
    measuredAmount: string;
    purity?: string;
    testDate: string;
    manufacturer: string;
  }>;
  supplier: {
    name: string;
    productCode: string;
    price: number;
    stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  };
  interactions?: string[];
  contraindications?: string[];
  references?: string[];
  // New fields for peptibase.dev parity
  aminoAcidSequence?: string;
  bioavailability?: string;
  storageRequirements?: string;
  legalStatus?: {
    usa: 'research-only' | 'prescription' | 'approved' | 'banned';
    eu: string;
    australia: string;
  };
  clinicalStatus?: 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'approved';
  fdaApproved?: boolean;
  fdaApprovalYear?: number;
  warnings?: string[];
  notableStudies?: Array<{
    title: string;
    year: number;
    finding: string;
    doi?: string;
  }>;
  recommendedDuration?: string;
  /** Available vial sizes in mg, sourced from supplier catalog. */
  vialSizesMg?: number[];
  cycleProtocol?: {
    minDays: number;
    maxDays: number;
    breakDays: number;
    restartAdvice: string;
    breakAdvice: string[];
  };
}

export const corePeptides: Peptide[] = [
  {
    id: 'ta1',
    name: 'Thymosin Alpha-1',
    shortName: 'TA1',
    category: 'immune',
    molecularWeight: '3108 Da',
    halfLife: '2 hours',
    longevityScore: 8,
    mechanism: 'A 28-amino acid immunomodulating polypeptide that stimulates both innate and adaptive immune responses. Activates Toll-like receptors and downstream signaling pathways. Restores immune homeostasis and enhances T-cell function, dendritic cell maturation, and cytokine production.',
    benefits: [
      'Enhanced immune function via TLR activation',
      'Improved vaccine response',
      'Anti-viral properties (HIV, hepatitis)',
      'Reduced inflammation',
      'Synergistic with chemotherapy for anti-tumor response'
    ],
    athleteBenefits: [
      'Faster recovery from illness',
      'Reduced training-related immune suppression',
      'Better adaptation to high training loads'
    ],
    risks: [
      'Injection site reactions',
      'Rare allergic reactions'
    ],
    dosing: {
      beginner: '0.8mg 2x/week',
      intermediate: '1.0mg 3x/week',
      advanced: '1.5mg 3x/week',
      athlete: '1.5mg 3x/week'
    },
    frequency: '3x weekly',
    recommendedDuration: '8–12 weeks per cycle, with 4-week breaks between cycles',
    cycleProtocol: {
      minDays: 56,
      maxDays: 84,
      breakDays: 28,
      restartAdvice: 'Resume after 4-week break. Re-check CBC and immune markers before starting next cycle.',
      breakAdvice: [
        'Continue balanced nutrition with emphasis on zinc, vitamin D, and selenium for immune support',
        'Maintain regular sleep schedule (7–9 hrs) to preserve immune gains',
        'Monitor any lingering injection site reactions before restarting',
        'Consider bloodwork (CBC with differential) to assess immune baseline before next cycle',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Improved energy, reduced minor illness duration',
      week3_4: 'Notable immune resilience, better recovery',
      week5_8: 'Significant immune optimization, enhanced CD8+ T-cell response',
      longTerm: 'Sustained immune function improvement'
    },
    janoshikTested: true,
    janoshikPurity: 99.2,
    janoshikDate: '2024-10-15',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'TA1-5MG',
      price: 45,
      stock: 'in-stock'
    },
    references: ['PMID: 28106477', 'PMID: 36812669'],
    contraindications: ['Organ transplant recipients', 'Autoimmune conditions requiring immunosuppression'],
    aminoAcidSequence: 'Ser-Asp-Ala-Ala-Val-Asp-Thr-Ser-Ser-Glu-Ile-Thr-Thr-Lys-Asp-Leu-Lys-Glu-Lys-Lys-Glu-Val-Val-Glu-Glu-Ala-Glu-Asn',
    bioavailability: 'High (subcutaneous)',
    storageRequirements: 'Store at 2-8°C, protect from light, stable 24 months lyophilized',
    legalStatus: {
      usa: 'research-only',
      eu: 'Authorization varies by country; verify current national status',
      australia: 'Not approved by the TGA for routine therapeutic use'
    },
    clinicalStatus: 'phase3',
    fdaApproved: false,
    warnings: [
      'Monitor for signs of autoimmune activation',
      'Use with caution in immunocompromised patients',
      'A 2025 phase 3 sepsis trial found no 28-day mortality benefit; evidence is indication-specific'
    ],
    notableStudies: [
      {
        title: 'Thymosin alpha-1 in hepatitis B treatment',
        year: 2008,
        finding: 'Demonstrated antiviral efficacy in chronic hepatitis B patients',
        doi: '10.1016/j.jhep.2008.03.023'
      }
    ]
  },
  {
    id: 'epitalon',
    name: 'Epitalon',
    shortName: 'Epithalon',
    category: 'longevity',
    molecularWeight: '390.35 Da',
    halfLife: '10-15 minutes',
    longevityScore: 10,
    mechanism: 'A naturally occurring tetrapeptide that induces telomerase enzyme activity by upregulating hTERT mRNA expression. Promotes dose-dependent telomere length extension in normal human epithelial and fibroblast cells. Regulates melatonin production and circadian rhythm.',
    benefits: [
      'Telomere lengthening via hTERT upregulation',
      'Improved sleep quality',
      'Enhanced melatonin production',
      'Anti-aging effects at cellular level',
      'Telomerase activation for longevity'
    ],
    athleteBenefits: [
      'Better recovery through improved sleep',
      'Cellular regeneration',
      'Long-term tissue health'
    ],
    risks: [
      'May affect sleep patterns initially',
      'Limited long-term human data'
    ],
    dosing: {
      beginner: '5mg daily for 10 days',
      intermediate: '10mg daily for 10 days',
      advanced: '10mg daily for 20 days',
      athlete: '10mg daily for 10 days'
    },
    frequency: 'Daily (10-day cycle, 2-3 cycles per year)',
    recommendedDuration: '10–20 days per cycle, 2–3 cycles per year with 4–6 month intervals',
    cycleProtocol: {
      minDays: 10,
      maxDays: 20,
      breakDays: 150,
      restartAdvice: 'Run 2–3 short cycles per year. Wait 4–6 months between cycles for optimal telomere response.',
      breakAdvice: [
        'Supplement with astragalus root and resveratrol to support telomere maintenance during off-cycle',
        'Prioritize antioxidant-rich diet (berries, dark leafy greens) to reduce oxidative telomere damage',
        'Maintain consistent exercise — moderate cardio supports telomerase activity naturally',
        'Track sleep quality; poor sleep accelerates telomere shortening',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Improved sleep onset, vivid dreams',
      week3_4: 'Deeper sleep, better recovery',
      week5_8: 'Enhanced energy and vitality',
      longTerm: 'Cellular rejuvenation, telomere maintenance'
    },
    janoshikTested: true,
    janoshikPurity: 98.7,
    janoshikDate: '2024-09-22',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'EPI-50MG',
      price: 85,
      stock: 'in-stock'
    },
    references: ['PMID: 40908429', 'PMID: 16388879']
    ,
    aminoAcidSequence: 'Ala-Glu-Asp-Gly',
    bioavailability: 'Moderate (subcutaneous)',
    storageRequirements: 'Store at -20°C, protect from light, stable 2 years lyophilized',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'phase2',
    fdaApproved: false,
    warnings: [
      'Limited long-term human safety data',
      'May affect melatonin-sensitive conditions'
    ],
    notableStudies: [
      {
        title: 'Epithalon and telomerase activation',
        year: 2003,
        finding: 'Induced telomerase activity in human somatic cells',
        doi: '10.1134/S0006297903080049'
      }
    ]
  },
  {
    id: 'semax',
    name: 'Semax',
    shortName: 'Semax',
    category: 'cognitive',
    molecularWeight: '813.93 Da',
    halfLife: '10-15 minutes',
    longevityScore: 7,
    mechanism: 'A synthetic heptapeptide comprising the ACTH (4-7) fragment with a C-terminal Pro-Gly-Pro tripeptide. Targets µ-opioid receptors, regulates USP18 and deubiquitination of FTO protein. Inhibits pyroptosis and decreases oxidative stress in neuronal cells. Modulates BDNF and enhances neuroplasticity.',
    benefits: [
      'Enhanced cognitive function',
      'Improved memory and learning',
      'Neuroprotection via µ-opioid receptor modulation',
      'Reduced anxiety and oxidative stress',
      'Promotes functional recovery after neurological injury'
    ],
    athleteBenefits: [
      'Better focus during training',
      'Improved mind-muscle connection',
      'Enhanced reaction time',
      'Neuroprotective during high-stress training'
    ],
    risks: [
      'Nasal irritation',
      'Possible headaches initially'
    ],
    dosing: {
      beginner: '300mcg daily intranasal',
      intermediate: '600mcg daily intranasal',
      advanced: '900mcg daily intranasal',
      athlete: '600mcg daily intranasal'
    },
    frequency: 'Daily',
    recommendedDuration: '30–90 days continuous, with optional 2-week breaks between cycles',
    cycleProtocol: {
      minDays: 30,
      maxDays: 90,
      breakDays: 14,
      restartAdvice: 'Resume after 2-week washout. Receptor sensitivity restores within 10–14 days.',
      breakAdvice: [
        'Continue cognitive training (puzzles, reading, learning) to consolidate neural gains',
        'Use natural nootropic support: lion\'s mane mushroom, omega-3 fatty acids, and phosphatidylserine',
        'Maintain consistent sleep hygiene — sleep is critical for BDNF-dependent memory consolidation',
        'Practice meditation or mindfulness to sustain enhanced focus and neuroplasticity',
      ],
    },
    administration: 'Intranasal spray',
    expectedResults: {
      week1_2: 'Increased mental clarity, focus',
      week3_4: 'Improved memory consolidation',
      week5_8: 'Enhanced cognitive performance',
      longTerm: 'Sustained neuroprotection, reduced neuroinflammation'
    },
    janoshikTested: true,
    janoshikPurity: 99.401,
    janoshikDate: '2025-07-04',
    janoshikCOA: [
      {
        taskNumber: '#69935',
        verifyKey: 'IL67K5WH8NK1',
        sampleName: 'Semax 10mg',
        measuredAmount: '10.65 mg',
        purity: '99.401%',
        testDate: '04 JUL 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
    ],
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'SEM-30MG',
      price: 55,
      stock: 'in-stock'
    },
    references: ['PMID: 40692165', 'PMID: 17459469']
    ,
    aminoAcidSequence: 'Met-Glu-His-Phe-Pro-Gly-Pro',
    bioavailability: 'High (intranasal)',
    storageRequirements: 'Store at 2-8°C, protect from light, stable 12 months reconstituted',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'approved',
    fdaApproved: false,
    warnings: [
      'May cause nasal irritation',
      'Not recommended for those with nasal septum issues'
    ],
    notableStudies: [
      {
        title: 'Semax neuroprotective effects',
        year: 2011,
        finding: 'Demonstrated significant neuroprotection in stroke models',
        doi: '10.1007/s12035-011-8211-5'
      }
    ]
  },
  {
    id: 'ss31',
    name: 'SS-31 (Elamipretide)',
    shortName: 'SS-31',
    category: 'longevity',
    molecularWeight: '639.88 Da',
    halfLife: '2-4 hours',
    longevityScore: 9,
    mechanism: 'A mitochondria-targeted tetrapeptide that binds with high affinity to cardiolipin on the inner mitochondrial membrane. Inhibits cytochrome c peroxidase activity, preventing cardiolipin peroxidation and protecting mitochondrial cristae structure. Accelerates ATP recovery and reduces oxidative damage. Translationally upregulates frataxin protein levels in a dose-dependent manner.',
    benefits: [
      'Mitochondrial cristae protection',
      'Enhanced ATP production and recovery',
      'Reduced oxidative stress via cardiolipin binding',
      'Cellular rejuvenation',
      'Improved aconitase and respiratory chain activity',
      'Restored mitochondrial morphology'
    ],
    athleteBenefits: [
      'Improved endurance capacity',
      'Faster ATP regeneration after exertion',
      'Enhanced recovery between sets',
      'Better mitochondrial membrane potential'
    ],
    risks: [
      'Injection site reactions',
      'Possible initial fatigue'
    ],
    dosing: {
      beginner: '2.5mg daily',
      intermediate: '5mg daily',
      advanced: '10mg daily',
      athlete: '5mg daily'
    },
    frequency: 'Daily',
    recommendedDuration: '8–12 weeks per cycle; clinical trials used 4–12 week protocols',
    cycleProtocol: {
      minDays: 56,
      maxDays: 84,
      breakDays: 28,
      restartAdvice: 'Resume after 4-week break. Reassess mitochondrial markers and exercise performance.',
      breakAdvice: [
        'Maintain mitochondrial health with CoQ10, PQQ, and NAD+ precursors (NMN or NR)',
        'Continue regular exercise — the mitochondrial biogenesis benefits compound with training',
        'Focus on cold exposure (cold showers, ice baths) to naturally stimulate mitochondrial activity',
        'Track cardiovascular performance metrics to measure retained benefits',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Subtle energy improvements',
      week3_4: 'Noticeable endurance gains, improved NAD+/NADH ratio',
      week5_8: 'Significant performance enhancement',
      longTerm: 'Mitochondrial biogenesis, sustained cristae protection'
    },
    janoshikTested: true,
    janoshikPurity: 98.9,
    janoshikDate: '2024-10-28',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'SS31-50MG',
      price: 120,
      stock: 'low-stock'
    },
    references: ['PMID: 23813215', 'DOI: 10.1038/s41598-017-10320-2']
    ,
    aminoAcidSequence: 'D-Arg-Dmt-Lys-Phe-NH2',
    bioavailability: 'High (subcutaneous)',
    storageRequirements: 'Store at -20°C, protect from light, stable 2 years lyophilized',
    legalStatus: {
      usa: 'approved',
      eu: 'Verify current EMA and national authorization status',
      australia: 'Verify current TGA authorization status'
    },
    clinicalStatus: 'approved',
    fdaApproved: true,
    fdaApprovalYear: 2025,
    warnings: [
      'FDA accelerated approval is limited to Barth syndrome in patients weighing at least 30 kg',
      'Confirmatory evidence is required; approval does not support general longevity use'
    ],
    notableStudies: [
      {
        title: 'SS-31 in mitochondrial myopathy',
        year: 2014,
        finding: 'Improved exercise tolerance in primary mitochondrial myopathy patients',
        doi: '10.1016/j.nmd.2014.09.003'
      }
    ]
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    shortName: 'Reta',
    category: 'metabolic',
    molecularWeight: '4112 Da',
    halfLife: '6 days',
    longevityScore: 8,
    mechanism: 'A novel unimolecular triple agonist of the glucose-dependent insulinotropic polypeptide (GIP), glucagon-like peptide 1 (GLP-1), and glucagon (GCG) receptors. Promotes satiety, enhances insulin sensitivity, increases energy expenditure via glucagon receptor activation, and significantly reduces liver fat.',
    benefits: [
      'Significant fat loss (up to 24.2% at 48 weeks)',
      'Improved metabolic health',
      'Enhanced insulin sensitivity and lipid metabolism',
      'Appetite regulation',
      '86% relative reduction in liver fat (MASLD)',
      'Normal liver fat achieved in 85%+ of participants'
    ],
    athleteBenefits: [
      'Body recomposition',
      'Improved energy partitioning',
      'Better nutrient utilization',
      'Enhanced metabolic flexibility'
    ],
    risks: [
      'GI side effects initially (nausea, diarrhea)',
      'Possible muscle loss without resistance training',
      'Requires gradual dose titration'
    ],
    dosing: {
      beginner: '1mg weekly',
      intermediate: '4mg weekly',
      advanced: '8-12mg weekly',
      athlete: '4-8mg weekly'
    },
    frequency: 'Once weekly',
    recommendedDuration: '24–48 weeks with gradual dose titration (1mg → 4mg → 8mg → 12mg every 4 weeks)',
    cycleProtocol: {
      minDays: 168,
      maxDays: 336,
      breakDays: 56,
      restartAdvice: 'Taper dose down before stopping (reverse titration over 4 weeks). Restart at lowest effective dose after break.',
      breakAdvice: [
        'Taper off gradually — do NOT stop abruptly to avoid GI rebound and appetite surge',
        'Maintain caloric deficit with high-protein diet (1.6–2.2g/kg) to preserve lean mass',
        'Increase structured exercise volume to compensate for reduced metabolic support',
        'Monitor fasting glucose, HbA1c, and lipid panel during break to track metabolic maintenance',
        'Consider GLP-1 receptor sensitivity restoration — avoid high-glycemic foods during washout',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Reduced appetite, possible GI adjustment',
      week3_4: 'Noticeable weight loss begins',
      week5_8: 'Significant fat reduction, liver fat normalization',
      longTerm: 'Metabolic optimization, up to 24% weight reduction at 48 weeks'
    },
    janoshikTested: true,
    janoshikPurity: 99.856,
    janoshikDate: '2025-07-03',
    janoshikCOA: [
      {
        taskNumber: '#61141',
        verifyKey: 'UMR871KAJ2N9',
        sampleName: 'Retatrutide 10mg',
        measuredAmount: '10.80 mg',
        purity: '99.060%',
        testDate: '01 APR 2025',
        manufacturer: 'https://zztai-tech.com',
      },
      {
        taskNumber: '#69929',
        verifyKey: 'TA2CQT3F44X9',
        sampleName: 'Retatrutide 10mg',
        measuredAmount: '11.22 mg',
        purity: '99.856%',
        testDate: '03 JUL 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
      {
        taskNumber: '#83560',
        verifyKey: 'SLSMW69V6T1U',
        sampleName: 'Retatrutide 5mg',
        measuredAmount: '5.17 mg',
        purity: '99.242%',
        testDate: '21 OCT 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
      {
        taskNumber: '#83559',
        verifyKey: 'NPSK8I9SNR12',
        sampleName: 'Retatrutide 15mg',
        measuredAmount: '15.80 mg',
        purity: '99.407%',
        testDate: '21 OCT 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
      {
        taskNumber: '#83561',
        verifyKey: '4UPD97DVG8VB',
        sampleName: 'Retatrutide 20mg',
        measuredAmount: '20.48 mg',
        purity: '99.558%',
        testDate: '21 OCT 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
      {
        taskNumber: '#83562',
        verifyKey: 'FFI2TMXKV5PY',
        sampleName: 'Retatrutide 30mg',
        measuredAmount: '30.61 mg',
        purity: '99.622%',
        testDate: '21 OCT 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
      {
        taskNumber: '#103521',
        verifyKey: 'IP2JHRQSC9T9',
        sampleName: 'Retatrutide 50mg',
        measuredAmount: '50.83 mg',
        purity: '99.830%',
        testDate: '30 JAN 2026',
        manufacturer: 'https://zztai-tech.com/',
      },
    ],
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'RETA-10MG',
      price: 195,
      stock: 'in-stock'
    },
    references: ['DOI: 10.1038/s41591-024-03018-2', 'DOI: 10.1038/s41421-024-00700-0']
    ,
    aminoAcidSequence: 'Modified GLP-1/GIP/Glucagon triple agonist',
    bioavailability: 'High (subcutaneous)',
    storageRequirements: 'Store at 2-8°C, protect from light, do not freeze',
    legalStatus: {
      usa: 'research-only',
      eu: 'Clinical trial phase (Eli Lilly)',
      australia: 'Not scheduled (research)'
    },
    clinicalStatus: 'phase3',
    fdaApproved: false,
    warnings: [
      'GI side effects common during titration',
      'Monitor for hypoglycemia when combined with insulin',
      'Avoid in patients with personal/family history of MTC'
    ],
    notableStudies: [
      {
        title: 'TRIUMPH-2 Phase 3 Trial',
        year: 2024,
        finding: 'Achieved 24.2% weight loss at 48 weeks with highest dose',
        doi: '10.1038/s41591-024-03018-2'
      }
    ]
  },
  {
    id: 'bpc157',
    name: 'BPC-157',
    shortName: 'BPC',
    category: 'healing',
    molecularWeight: '1419.53 Da',
    halfLife: '24 hours',
    longevityScore: 8,
    mechanism: 'Gastric pentadecapeptide that promotes angiogenesis, modulates nitric oxide pathways, and accelerates tissue repair through multiple growth factor pathways. Demonstrates potential benefits in tendon and muscle repair in preclinical studies.',
    benefits: [
      'Accelerated wound healing',
      'Tendon and ligament repair',
      'Gut healing and cytoprotection',
      'Anti-inflammatory effects',
      'Potential muscle repair support'
    ],
    athleteBenefits: [
      'Faster injury recovery',
      'Joint and connective tissue support',
      'Reduced inflammation from training',
      'Local injection near injury site enhances effects'
    ],
    risks: [
      'Limited human clinical trial data',
      'Possible interaction with blood thinners',
      'Case series data only - no controlled human trials'
    ],
    dosing: {
      beginner: '250mcg daily',
      intermediate: '500mcg daily',
      advanced: '500mcg 2x daily',
      athlete: '500mcg daily (systemic) or local injection'
    },
    frequency: 'Daily',
    recommendedDuration: '4–8 weeks for acute injury; up to 12 weeks for chronic conditions',
    cycleProtocol: {
      minDays: 28,
      maxDays: 84,
      breakDays: 14,
      restartAdvice: 'Resume only if injury persists or for new injury. Most acute injuries resolve within one cycle.',
      breakAdvice: [
        'Continue physical therapy and progressive loading of injured tissue',
        'Support healing with collagen peptides (15g daily), vitamin C, and glycine supplementation',
        'Maintain anti-inflammatory nutrition: omega-3s, turmeric/curcumin, tart cherry',
        'Use the break to assess healing progress — imaging or functional tests before considering another cycle',
      ],
    },
    administration: 'Subcutaneous injection (near injury site if applicable)',
    expectedResults: {
      week1_2: 'Reduced pain and inflammation',
      week3_4: 'Accelerated healing visible',
      week5_8: 'Significant tissue repair',
      longTerm: 'Complete recovery support'
    },
    janoshikTested: true,
    janoshikPurity: 99.3,
    janoshikDate: '2024-10-05',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'BPC-5MG',
      price: 42,
      stock: 'in-stock'
    },
    references: ['PMID: 41476424', 'PMID: 30915550']
    ,
    aminoAcidSequence: 'Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val',
    bioavailability: 'High (subcutaneous), Moderate (oral)',
    storageRequirements: 'Store at -20°C, protect from light, stable 2 years lyophilized',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'preclinical',
    fdaApproved: false,
    warnings: [
      'No controlled human clinical trials',
      'Based primarily on animal research data',
      'May interact with blood thinners'
    ],
    notableStudies: [
      {
        title: 'BPC-157 wound healing effects',
        year: 2018,
        finding: 'Accelerated wound healing and angiogenesis in animal models',
        doi: '10.1007/s00018-018-2803-5'
      }
    ]
  },
  {
    id: 'tb500',
    name: 'TB-500',
    shortName: 'TB-500',
    category: 'healing',
    molecularWeight: '4963 Da',
    halfLife: '7-14 days',
    longevityScore: 7,
    mechanism: 'Synthetic derivative of Thymosin Beta-4 (TB-4). Promotes angiogenesis, cell migration, and tissue repair through actin-binding properties. Demonstrated tissue repair benefits in preclinical models.',
    benefits: [
      'Systemic healing support',
      'Promotes angiogenesis',
      'Reduced inflammation',
      'Improved flexibility',
      'Hair growth promotion'
    ],
    athleteBenefits: [
      'Full-body recovery support',
      'Joint mobility improvement',
      'Synergistic with BPC-157 for comprehensive healing'
    ],
    risks: [
      'Possible fatigue initially',
      'Limited human orthopaedic data',
      'Banned in competitive sports'
    ],
    dosing: {
      beginner: '2.5mg 2x/week',
      intermediate: '5mg 2x/week',
      advanced: '5mg 3x/week',
      athlete: '5mg 2x weekly'
    },
    frequency: '2x weekly',
    recommendedDuration: '4–8 weeks loading phase, then 2x/week maintenance for up to 12 weeks',
    cycleProtocol: {
      minDays: 28,
      maxDays: 84,
      breakDays: 21,
      restartAdvice: 'Resume after 3-week break. Often paired with BPC-157 for synergistic repair.',
      breakAdvice: [
        'Continue gentle mobility work and progressive tissue loading during break',
        'Supplement with collagen, vitamin C, and MSM to support connective tissue remodeling',
        'Monitor inflammatory markers (CRP, ESR) to assess healing progress',
        'Maintain adequate protein intake (1.6g/kg) to support ongoing tissue repair',
      ],
    },
    administration: 'Subcutaneous or intramuscular injection',
    expectedResults: {
      week1_2: 'General well-being improvement',
      week3_4: 'Reduced chronic inflammation, enhanced angiogenesis',
      week5_8: 'Enhanced tissue repair',
      longTerm: 'Sustained healing benefits'
    },
    janoshikTested: true,
    janoshikPurity: 99.109,
    janoshikDate: '2025-04-24',
    janoshikCOA: [
      {
        taskNumber: '#62995',
        verifyKey: '',
        sampleName: 'TB500 (Thymosin B4 Acetate) 5mg',
        measuredAmount: '5.97 mg',
        purity: '99.109%',
        testDate: '24 APR 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
    ],
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'TB5-10MG',
      price: 65,
      stock: 'in-stock'
    },
    references: ['PMID: 41476424', 'PMID: 25290457']
    ,
    aminoAcidSequence: 'Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-Glu-Ile-Glu-Lys-Phe-Asp-Lys-Ser-Lys-Leu-Lys-Lys-Thr-Glu-Thr-Gln-Glu-Lys-Asn-Pro-Leu-Pro-Ser-Lys-Glu-Thr-Ile-Glu-Gln-Glu-Lys-Gln-Ala-Gly-Glu-Ser',
    bioavailability: 'High (subcutaneous/intramuscular)',
    storageRequirements: 'Store at -20°C, protect from light, stable 2 years lyophilized',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'preclinical',
    fdaApproved: false,
    warnings: [
      'Banned by WADA for competitive sports',
      'Limited human safety data',
      'May promote blood vessel growth'
    ],
    notableStudies: [
      {
        title: 'Thymosin beta-4 cardiac repair',
        year: 2012,
        finding: 'Promoted cardiac repair following myocardial infarction in mice',
        doi: '10.1161/CIRCULATIONAHA.112.103648'
      }
    ]
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    shortName: 'Ipam',
    category: 'gh-secretagogue',
    molecularWeight: '711.85 Da',
    halfLife: '2 hours',
    longevityScore: 8,
    mechanism: 'A highly selective pentapeptide growth hormone secretagogue that mimics GHRP-6 but with superior selectivity. Stimulates GH release via ghrelin receptor pathway without releasing ACTH, cortisol, or prolactin even at high doses.',
    benefits: [
      'Increased GH release (selective)',
      'Improved body composition',
      'Enhanced recovery',
      'Better sleep quality',
      'No cortisol or prolactin elevation'
    ],
    athleteBenefits: [
      'Muscle growth support',
      'Fat loss enhancement',
      'Faster recovery between sessions',
      'Improved muscle tension (with CJC-1295)'
    ],
    risks: [
      'Water retention possible',
      'Numbness/tingling initially',
      'May increase appetite'
    ],
    dosing: {
      beginner: '100mcg before bed',
      intermediate: '200mcg before bed',
      advanced: '300mcg before bed',
      athlete: '200mcg before bed (combine with CJC-1295)'
    },
    frequency: 'Daily (before bed)',
    recommendedDuration: '8–16 weeks continuous; cycle 5 days on / 2 days off for extended use',
    cycleProtocol: {
      minDays: 56,
      maxDays: 112,
      breakDays: 28,
      restartAdvice: 'Resume after 4-week break to restore GH receptor sensitivity. Check IGF-1 levels before restart.',
      breakAdvice: [
        'Maintain fasted morning cardio to preserve fat oxidation pathways',
        'Prioritize 7–9 hours of deep sleep — natural GH secretion peaks during slow-wave sleep',
        'Use natural GH-supporting habits: high-intensity training, sauna, cold exposure',
        'Track body composition during break to assess how well results are maintained',
        'Supplement with arginine, ornithine, and GABA before bed for natural GH support',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Improved sleep, recovery',
      week3_4: 'Fat loss begins, muscle fullness',
      week5_8: 'Noticeable body recomposition',
      longTerm: 'Sustained GH optimization without hormonal disruption'
    },
    janoshikTested: true,
    janoshikPurity: 99.4,
    janoshikDate: '2024-11-05',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'IPAM-5MG',
      price: 38,
      stock: 'in-stock'
    },
    references: ['PMID: 9849822', 'PMID: 41476424']
    ,
    aminoAcidSequence: 'Aib-His-D-2-Nal-D-Phe-Lys-NH2',
    bioavailability: 'High (subcutaneous)',
    storageRequirements: 'Store at 2-8°C, protect from light, stable 30 days reconstituted',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'phase2',
    fdaApproved: false,
    warnings: [
      'May increase appetite initially',
      'Use with caution in diabetics',
      'Monitor for water retention'
    ],
    notableStudies: [
      {
        title: 'Ipamorelin GH release study',
        year: 1998,
        finding: 'Demonstrated selective GH release without affecting cortisol or prolactin',
        doi: '10.1210/endo.139.11.6263'
      }
    ]
  },
  {
    id: 'cjc1295',
    name: 'CJC-1295 (no DAC)',
    shortName: 'CJC',
    category: 'gh-secretagogue',
    molecularWeight: '3367.97 Da',
    halfLife: '30 minutes (no DAC) / 5.8-8.1 days (with DAC)',
    longevityScore: 8,
    mechanism: 'A long-acting GHRH analog that produces dose-dependent increases in mean plasma GH concentrations (2-10 fold for 6+ days) and IGF-I levels (1.5-3 fold for 9-11 days). After multiple doses, IGF-I remains elevated for up to 28 days. Synergistic with GHRP peptides.',
    benefits: [
      'Enhanced GH pulse amplitude (2-10x)',
      'Sustained IGF-1 elevation (9-11 days per injection)',
      'Body composition improvement',
      'Anti-aging effects',
      'Cumulative effect with repeated dosing'
    ],
    athleteBenefits: [
      'Synergistic with Ipamorelin for enhanced GH secretion',
      'Enhanced recovery and muscle tension',
      'Improved performance markers'
    ],
    risks: [
      'Flushing sensation',
      'Water retention',
      'Requires fasted administration'
    ],
    dosing: {
      beginner: '100mcg before bed (30µg/kg)',
      intermediate: '200mcg before bed (60µg/kg)',
      advanced: '200mcg 2x daily',
      athlete: '200mcg before bed with Ipamorelin'
    },
    frequency: 'Daily (before bed)',
    recommendedDuration: '8–16 weeks continuous; best combined with Ipamorelin on same schedule',
    cycleProtocol: {
      minDays: 56,
      maxDays: 112,
      breakDays: 28,
      restartAdvice: 'Resume with Ipamorelin after 4-week break. Pair together for sustained GH pulse optimization.',
      breakAdvice: [
        'Match break schedule with Ipamorelin — both should cycle off simultaneously',
        'Maintain fasted training and protein-rich pre-bed meals for natural GH support',
        'Track IGF-1 levels before restarting to confirm receptor resensitization',
        'Continue resistance training to maintain lean mass gains from the GH cycle',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Enhanced sleep quality, GH elevation',
      week3_4: 'Improved recovery and energy, IGF-1 sustained',
      week5_8: 'Body composition changes',
      longTerm: 'Sustained GH optimization, cumulative IGF-1 benefits'
    },
    janoshikTested: true,
    janoshikPurity: 99.0,
    janoshikDate: '2024-10-20',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'CJC-5MG',
      price: 42,
      stock: 'in-stock'
    },
    references: ['PMID: 16352683', 'PMID: 41476424']
    ,
    aminoAcidSequence: 'Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Asn-Ser-Tyr-Arg-Lys-Val-Leu-Gly-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH2',
    bioavailability: 'High (subcutaneous)',
    storageRequirements: 'Store at 2-8°C, protect from light, stable 30 days reconstituted',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'phase2',
    fdaApproved: false,
    warnings: [
      'Requires fasted administration for optimal effect',
      'May cause flushing and warmth sensation',
      'Monitor blood glucose in diabetics'
    ],
    notableStudies: [
      {
        title: 'CJC-1295 pharmacokinetics study',
        year: 2006,
        finding: 'Produced sustained 2-10 fold elevation in GH and 1.5-3 fold IGF-1 increase',
        doi: '10.1210/jc.2005-2664'
      }
    ]
  },
  {
    id: 'ghkcu',
    name: 'GHK-Cu',
    shortName: 'GHK-Cu',
    category: 'longevity',
    molecularWeight: '403.92 Da',
    halfLife: '4-6 hours',
    longevityScore: 9,
    mechanism: 'Copper peptide complex that activates regenerative genes, promotes collagen synthesis, and provides potent antioxidant and anti-inflammatory effects. Shows promise in wound healing and tissue regeneration in preclinical studies.',
    benefits: [
      'Skin rejuvenation',
      'Wound healing',
      'Anti-aging gene activation',
      'Collagen synthesis',
      'Anti-inflammatory properties'
    ],
    athleteBenefits: [
      'Connective tissue support',
      'Skin health optimization',
      'Systemic regeneration',
      'Recovery support'
    ],
    risks: [
      'Copper toxicity at high doses',
      'Skin discoloration possible',
      'No clinical musculoskeletal data yet'
    ],
    dosing: {
      beginner: '1mg daily',
      intermediate: '2mg daily',
      advanced: '3mg daily',
      athlete: '2mg daily'
    },
    frequency: 'Daily',
    recommendedDuration: '8–12 weeks per cycle; topical use can be continuous',
    cycleProtocol: {
      minDays: 56,
      maxDays: 84,
      breakDays: 21,
      restartAdvice: 'Resume after 3-week break. Topical GHK-Cu can continue during injectable break.',
      breakAdvice: [
        'Continue topical copper peptide products to maintain skin and hair benefits',
        'Support collagen synthesis with vitamin C (1000mg daily) and marine collagen',
        'Maintain wound-healing and anti-aging support with retinoids and niacinamide topically',
        'Track skin elasticity and hair density metrics to assess retained benefits',
      ],
    },
    administration: 'Subcutaneous injection or topical',
    expectedResults: {
      week1_2: 'Improved skin quality',
      week3_4: 'Enhanced healing markers, reduced inflammation',
      week5_8: 'Visible anti-aging effects',
      longTerm: 'Sustained regenerative benefits'
    },
    janoshikTested: true,
    janoshikPurity: 99.1,
    janoshikDate: '2024-09-30',
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'GHKCU-50MG',
      price: 58,
      stock: 'in-stock'
    },
    references: ['PMID: 41476424', 'PMID: 30681787']
    ,
    aminoAcidSequence: 'Gly-His-Lys:Cu',
    bioavailability: 'High (subcutaneous), Moderate (topical)',
    storageRequirements: 'Store at -20°C, protect from light, stable 2 years lyophilized',
    legalStatus: {
      usa: 'research-only',
      eu: 'Cosmetic ingredient (topical), Research (injectable)',
      australia: 'Schedule 4 (prescription)'
    },
    clinicalStatus: 'phase2',
    fdaApproved: false,
    warnings: [
      'Monitor copper levels with extended use',
      'Discontinue if skin irritation occurs',
      'Not recommended during pregnancy'
    ],
    notableStudies: [
      {
        title: 'GHK-Cu gene expression study',
        year: 2014,
        finding: 'Upregulated 32% of human genes involved in wound healing',
        doi: '10.1016/j.gene.2014.02.016'
      }
    ]
  },
  {
    id: 'motsc',
    name: 'MOTS-c',
    shortName: 'MOTS-c',
    category: 'longevity',
    molecularWeight: '2174.51 Da',
    halfLife: '6-8 hours',
    longevityScore: 9,
    mechanism: 'Mitochondrial-derived peptide that activates AMPK, enhances glucose uptake, and promotes metabolic homeostasis and exercise mimetic effects.',
    benefits: [
      'Metabolic optimization',
      'Exercise mimetic effects',
      'Improved insulin sensitivity',
      'Mitochondrial function'
    ],
    athleteBenefits: [
      'Enhanced endurance',
      'Better energy utilization',
      'Improved metabolic flexibility'
    ],
    risks: [
      'Limited human data',
      'Possible hypoglycemia'
    ],
    dosing: {
      beginner: '5mg weekly',
      intermediate: '10mg weekly',
      advanced: '10mg 3x/week',
      athlete: '10mg weekly'
    },
    frequency: 'Weekly',
    recommendedDuration: '8–12 weeks per cycle with 4-week breaks; limited human protocol data',
    cycleProtocol: {
      minDays: 56,
      maxDays: 84,
      breakDays: 28,
      restartAdvice: 'Resume after 4-week break. Monitor exercise performance and metabolic markers.',
      breakAdvice: [
        'Maintain HIIT and zone 2 cardio to preserve AMPK pathway activation',
        'Support metabolic health with berberine or metformin (if prescribed) during break',
        'Track fasting glucose and insulin sensitivity markers during off-cycle',
        'Continue balanced nutrition with emphasis on complex carbs and fiber for metabolic support',
      ],
    },
    administration: 'Subcutaneous injection',
    expectedResults: {
      week1_2: 'Improved energy levels',
      week3_4: 'Enhanced exercise capacity',
      week5_8: 'Metabolic improvements',
      longTerm: 'Sustained metabolic health'
    },
    janoshikTested: true,
    janoshikPurity: 99.098,
    janoshikDate: '2025-10-21',
    janoshikCOA: [
      {
        taskNumber: '#83567',
        verifyKey: 'HGNB5E53261C',
        sampleName: 'MOTS-C 10mg',
        measuredAmount: '11.42 mg',
        purity: '99.098%',
        testDate: '21 OCT 2025',
        manufacturer: 'https://zztai-tech.com/',
      },
    ],
    supplier: {
      name: 'ZZTai-Tech',
      productCode: 'MOTS-10MG',
      price: 145,
      stock: 'low-stock'
    },
    references: ['PMID: 25738459', 'PMID: 30559430']
    ,
    aminoAcidSequence: 'Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg',
    bioavailability: 'High (subcutaneous)',
    storageRequirements: 'Store at -20°C, protect from light, stable 2 years lyophilized',
    legalStatus: {
      usa: 'research-only',
      eu: 'Not regulated (research peptide)',
      australia: 'Not scheduled (research)'
    },
    clinicalStatus: 'preclinical',
    fdaApproved: false,
    warnings: [
      'Limited human safety data',
      'Monitor blood glucose levels',
      'May interact with diabetes medications'
    ],
    notableStudies: [
      {
        title: 'MOTS-c metabolic regulation',
        year: 2015,
        finding: 'Demonstrated exercise mimetic effects and improved insulin sensitivity',
        doi: '10.1016/j.cmet.2015.02.009'
      }
    ]
  }
];

// Merge core and expanded peptides, avoiding duplicates
const coreIds = new Set(corePeptides.map(p => p.id));
const merged: Peptide[] = [
  ...corePeptides,
  ...expandedPeptides.filter(p => !coreIds.has(p.id)),
];
const mergedIds = new Set(merged.map(p => p.id));
const allPeptides = [
  ...merged,
  ...newPeptidesFromCatalog.filter(p => !mergedIds.has(p.id)),
];
// Apply vial-size catalog overrides without mutating the source data.
export const peptides: Peptide[] = allPeptides.map(p =>
  p.vialSizesMg ? p : (VIAL_SIZES_MG[p.id] ? { ...p, vialSizesMg: VIAL_SIZES_MG[p.id] } : p)
);

export const getCategoryColor = (category: PeptideCategory): string => {
  const colors: Partial<Record<PeptideCategory, string>> = {
    'immune': 'bg-immune',
    'longevity': 'bg-longevity',
    'cognitive': 'bg-cognitive',
    'metabolic': 'bg-metabolic',
    'healing': 'bg-healing',
    'gh-secretagogue': 'bg-gh',
    'weight-loss': 'bg-metabolic',
    'anti-aging': 'bg-longevity',
    'skin-hair': 'bg-healing',
    'hormonal': 'bg-gh',
    'bioregulators': 'bg-immune',
  };
  return colors[category] || 'bg-secondary';
};

export const getCategoryGradient = (category: PeptideCategory): string => {
  const gradients: Record<PeptideCategory, string> = {
    'immune': 'category-immune',
    'longevity': 'category-longevity',
    'cognitive': 'category-cognitive',
    'metabolic': 'category-metabolic',
    'healing': 'category-healing',
    'gh-secretagogue': 'category-gh',
    'weight-loss': 'category-metabolic',
    'anti-aging': 'category-longevity',
    'skin-hair': 'category-healing',
    'hormonal': 'category-gh',
    'bioregulators': 'category-immune',
  };
  return gradients[category] || 'category-immune';
};

export const getCategoryLabel = (category: PeptideCategory): string => {
  return categoryConfig[category]?.label || category;
};

export const getAllCategories = () => {
  return Object.entries(categoryConfig).map(([key, value]) => ({
    id: key as PeptideCategory,
    ...value
  }));
};
