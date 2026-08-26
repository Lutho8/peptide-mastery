// Top 15 peptides that get dedicated public pages
// Maps slug → peptide ID from the main database
export const topPeptidesSlugs: Record<string, string> = {
  'bpc-157': 'bpc157',
  'tb-500': 'tb500',
  'retatrutide': 'retatrutide',
  'tirzepatide': 'tirzepatide',
  'ipamorelin': 'ipamorelin',
  'cjc-1295': 'cjc1295',
  'ghk-cu': 'ghkcu',
  'epitalon': 'epitalon',
  'ss-31': 'ss31',
  'semax': 'semax',
  'selank': 'selank',
  'thymosin-alpha-1': 'ta1',
  'pt-141': 'pt141',
  'dsip': 'dsip',
  'semaglutide': 'semaglutide',
};

// Category slug → PeptideCategory mapping
export const categorySlugs: Record<string, string> = {
  'healing': 'healing',
  'weight-loss': 'weight-loss',
  'longevity': 'longevity',
  'cognitive': 'cognitive',
  'immune': 'immune',
  'growth-hormone': 'gh-secretagogue',
  'skin-hair': 'skin-hair',
  'hormonal': 'hormonal',
  'metabolic': 'metabolic',
};

// Neutral, source-led category descriptions. These pages describe research
// themes and do not provide treatment selection, dosing or outcome promises.
export const categoryMeta: Record<string, { title: string; description: string; intro: string }> = {
  'healing': {
    title: 'Tissue-Support Peptide Research – BPC-157 & TB-500',
    description: 'Source-led profiles for peptides studied in tissue, angiogenesis, collagen and inflammation models, including BPC-157 and TB-500.',
    intro: 'This category groups compounds studied in tissue, angiogenesis, collagen and inflammation models. Evidence strength, model type and investigational status vary by compound.'
  },
  'weight-loss': {
    title: 'Metabolic & Weight-Management Peptide Research',
    description: 'Study profiles for GLP-1 and multi-agonist compounds, including semaglutide, tirzepatide and investigational retatrutide.',
    intro: 'This category describes GLP-1 and multi-agonist mechanisms studied in metabolic and weight-management research. Product suitability and treatment decisions require an appropriate clinical pathway.'
  },
  'longevity': {
    title: 'Longevity Peptides – Epitalon, SS-31 & Anti-Aging Research',
    description: 'Source-led profiles for compounds studied in telomere, mitochondrial and cellular-senescence models, including Epitalon, SS-31 and GHK-Cu.',
    intro: 'This category groups compounds studied in telomere, mitochondrial and cellular-senescence models. Findings from laboratory or early clinical research do not establish individual outcomes.'
  },
  'cognitive': {
    title: 'Cognitive & Neurological Peptide Research',
    description: 'Research profiles for Semax, Selank and other compounds studied in neurological, neurotrophic and behavioural models.',
    intro: 'This category groups compounds studied in neurological, neurotrophic and behavioural models. It does not claim cognitive enhancement or disease prevention.'
  },
  'immune': {
    title: 'Immune Peptides – Thymosin Alpha-1, Thymalin & Immune Support',
    description: 'Research profiles for Thymosin Alpha-1, Thymalin, LL-37 and other compounds studied in immune signalling models.',
    intro: 'This category groups compounds studied in innate and adaptive immune signalling. Evidence and authorised uses differ by compound and jurisdiction.'
  },
  'growth-hormone': {
    title: 'Growth-Hormone Pathway Peptide Research',
    description: 'Mechanism and study profiles for compounds associated with GHRH and ghrelin-receptor pathways, including Ipamorelin and CJC-1295.',
    intro: 'This category describes compounds studied in GHRH and ghrelin-receptor pathways. It does not recommend combinations, administration or dosing.'
  },
  'skin-hair': {
    title: 'Skin & Hair Peptide Research – GHK-Cu & SNAP-8',
    description: 'Research profiles for GHK-Cu, SNAP-8 and other compounds studied in collagen, extracellular-matrix and follicle models.',
    intro: 'This category groups compounds studied in collagen, extracellular-matrix and follicle models. Research findings are not individual cosmetic outcomes.'
  },
  'hormonal': {
    title: 'Hormonal-Pathway Peptide Research',
    description: 'Research profiles for PT-141, kisspeptin and other compounds studied in endocrine and receptor-signalling pathways.',
    intro: 'This category describes compounds studied in endocrine and receptor-signalling pathways. Clinical questions about sexual health, fertility or hormones belong with a qualified professional.'
  },
  'metabolic': {
    title: 'Metabolic Peptide Research – AOD-9604 & MOTS-c',
    description: 'Research profiles for AOD-9604, MOTS-c and compounds studied in energy-metabolism and mitochondrial models.',
    intro: 'This category groups compounds studied in energy-metabolism and mitochondrial models. Mechanistic research does not establish a treatment effect or individual outcome.'
  },
};

// Guide page definitions
export const guidePages = {
  'reconstitution': {
    title: 'How to Reconstitute Peptides – Step-by-Step Guide',
    description: 'Complete guide to reconstituting lyophilized peptides with bacteriostatic water. Step-by-step instructions, dosing calculations, and storage requirements.',
    slug: 'reconstitution'
  },
  'injection': {
    title: 'Subcutaneous Injection Guide – Safe Peptide Administration',
    description: 'Safe subcutaneous injection technique for peptides. Injection sites, needle selection, sterile protocol, and post-injection care.',
    slug: 'injection'
  },
  'bloodwork': {
    title: 'Bloodwork Monitoring for Peptide Protocols – Essential Panels',
    description: 'Which blood panels to monitor during peptide use. IGF-1, metabolic panels, inflammatory markers, and optimal testing frequency.',
    slug: 'bloodwork'
  }
};
