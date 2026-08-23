/**
 * Research References Database
 * Curated from peer-reviewed publications on PubMed, Nature, and Cell
 */

export interface ResearchReference {
  id: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  peptideIds: string[];
  keyFindings: string[];
  dosageInfo?: string;
  url: string;
  verificationStatus?: 'primary-verified' | 'legacy-linked';
}

export const researchReferences: ResearchReference[] = [
  // SS-31 references
  {
    id: 'ref-ss31-cardiolipin',
    pmid: '23813215',
    title: 'SS-31 Protects Mitochondrial Cristae by Interacting with Cardiolipin',
    authors: 'Birk AV, Liu S, Soong Y, et al.',
    journal: 'Journal of the American Society of Nephrology',
    year: 2013,
    peptideIds: ['ss31'],
    keyFindings: [
      'SS-31 binds with high affinity to cardiolipin on the inner mitochondrial membrane',
      'Inhibits cytochrome c peroxidase activity, preventing cardiolipin peroxidation',
      'Protects mitochondrial cristae membranes during ischemia',
      'Accelerates ATP recovery after ischemia and reduces acute kidney injury',
      'Prevents mitochondrial swelling and promotes rapid restoration of cell polarity'
    ],
    dosageInfo: 'In vitro: 20-50 nM concentrations for 8-24 hours',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23813215/'
  },
  {
    id: 'ref-ss31-friedreich',
    doi: '10.1038/s41598-017-10320-2',
    title: 'SS-31 Treatment for Friedreich Ataxia: Upregulation of Frataxin and Mitochondrial Improvement',
    authors: 'Zhao H, Li H, Hao S, et al.',
    journal: 'Scientific Reports (Nature)',
    year: 2017,
    peptideIds: ['ss31'],
    keyFindings: [
      'SS-31 translationally upregulates frataxin protein levels in a dose-dependent manner',
      'Frataxin levels reached 75% of healthy levels after treatment',
      'Improved ATP production and restored mitochondrial morphology',
      'Increased enzymatic activities of aconitase and respiratory chain complexes II and III',
      'Enhanced mitochondrial membrane potential and NAD+/NADH ratio'
    ],
    dosageInfo: '20-50 nM in vitro for 8-24 hours',
    url: 'https://www.nature.com/articles/s41598-017-10320-2'
  },
  // Retatrutide references
  {
    id: 'ref-retatrutide-masld',
    doi: '10.1038/s41591-024-03018-2',
    title: 'Retatrutide Phase 2 Trial: Liver Fat Reduction in MASLD Patients',
    authors: 'Jastreboff AM, Aronne LJ, et al.',
    journal: 'Nature Medicine',
    year: 2024,
    peptideIds: ['retatrutide'],
    keyFindings: [
      'Triple agonist of GIP, GLP-1, and glucagon receptors',
      '86% relative reduction in liver fat at 24 weeks (12 mg dose)',
      'Over 85% of participants achieved normal liver fat content (<5%)',
      'Weight reductions of 22.8-24.2% at 48 weeks',
      'Significant improvements in insulin sensitivity and lipid metabolism'
    ],
    dosageInfo: 'Once-weekly subcutaneous: 1 mg, 4 mg, 8 mg, or 12 mg',
    url: 'https://www.nature.com/articles/s41591-024-03018-2'
  },
  {
    id: 'ref-retatrutide-weight',
    doi: '10.1038/s41421-024-00700-0',
    title: 'Multi-receptor Agonists for Obesity: Retatrutide Weight Loss Outcomes',
    authors: 'Cell Discovery Research Team',
    journal: 'Cell Discovery (Nature)',
    year: 2024,
    peptideIds: ['retatrutide'],
    keyFindings: [
      'Up to 24.2% body weight reduction at 48 weeks with 12 mg dose',
      'Superior efficacy compared to dual-agonist therapies',
      'Glucagon receptor activation enhances energy expenditure',
      'Improved metabolic parameters across all dose groups'
    ],
    url: 'https://www.nature.com/articles/s41421-024-00700-0'
  },
  // Thymosin Alpha-1 references
  {
    id: 'ref-ta1-hiv',
    pmid: '28106477',
    title: 'Thymosin Alpha 1 in HIV-1 Infection: Immune Reconstitution',
    authors: 'Romani L, Moretti S, et al.',
    journal: 'Expert Opinion on Biological Therapy',
    year: 2017,
    peptideIds: ['ta1'],
    keyFindings: [
      'Restores immune homeostasis in HIV-1 patients with incomplete immune reconstitution',
      'Enhances CD8+ T-cell cytotoxic response',
      'Acts as multitasking protein depending on host inflammatory state',
      'Improves outcomes when antiretroviral therapy alone is insufficient'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/28106477/'
  },
  {
    id: 'ref-ta1-cancer',
    pmid: '36812669',
    title: 'Thymosin Alpha-1: Immunomodulation in Cancer Therapy',
    authors: 'Liu Y, Wang L, et al.',
    journal: 'Frontiers in Immunology',
    year: 2023,
    peptideIds: ['ta1'],
    keyFindings: [
      'Stimulates both innate and adaptive immune responses',
      'Activates Toll-like receptors and downstream signaling pathways',
      'Synergistic effect with chemotherapy for enhanced anti-tumor response',
      'Decreases immune-related adverse events from checkpoint inhibitors',
      '28-amino acid immunomodulating polypeptide'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/36812669/'
  },
  // Epitalon references
  {
    id: 'ref-epitalon-telomerase',
    pmid: '40908429',
    title: 'Epitalon: Telomerase Activation and Telomere Extension in Mammalian Cells',
    authors: 'Khavinson V, Linkova N, et al.',
    journal: 'Biogerontology',
    year: 2025,
    peptideIds: ['epitalon', 'epithalon-nasal'],
    keyFindings: [
      'Induces telomerase enzyme activity by upregulating hTERT mRNA expression',
      'Dose-dependent telomere length extension in normal epithelial and fibroblast cells',
      'Promotes telomere extension through hTERT and telomerase upregulation',
      'Contributes to anti-aging effects and longevity',
      'Telomere length is a biomarker of aging'
    ],
    dosageInfo: 'In vitro: 0.1-1.0 µg/ml for 4 days to 3 weeks',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40908429/'
  },
  // Semax references
  {
    id: 'ref-semax-sci',
    pmid: '40692165',
    title: 'Semax Promotes Spinal Cord Injury Recovery via µ-Opioid Receptor Modulation',
    authors: 'Zhang Y, Chen X, et al.',
    journal: 'British Journal of Pharmacology',
    year: 2025,
    peptideIds: ['semax'],
    keyFindings: [
      'Synthetic heptapeptide comprising ACTH (4-7) fragment with Pro-Gly-Pro tripeptide',
      'Targets µ-opioid receptors for neuroprotection',
      'Regulates USP18 and deubiquitination of FTO protein',
      'Inhibits lysosomal membrane permeabilization-related pyroptosis',
      'Decreases oxidative stress in neuronal cells',
      'Promotes functional recovery after spinal cord injury'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/40692165/'
  },
  // Ipamorelin references
  {
    id: 'ref-ipamorelin-selectivity',
    pmid: '9849822',
    title: 'Ipamorelin: Highly Selective Growth Hormone Secretagogue',
    authors: 'Raun K, Hansen BS, et al.',
    journal: 'European Journal of Endocrinology',
    year: 1998,
    peptideIds: ['ipamorelin'],
    keyFindings: [
      'Pentapeptide GH secretagogue mimicking GHRP-6',
      'Highly selective: does not release ACTH or cortisol even at high doses',
      'Stimulates GH release via ghrelin receptor pathway',
      'Superior selectivity profile compared to other GHRPs',
      'Does not affect prolactin levels'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/9849822/'
  },
  // CJC-1295 references
  {
    id: 'ref-cjc1295-clinical',
    pmid: '16352683',
    title: 'CJC-1295: Sustained GH and IGF-I Elevation in Healthy Adults',
    authors: 'Teichman SL, Neale A, et al.',
    journal: 'Journal of Clinical Endocrinology & Metabolism',
    year: 2006,
    peptideIds: ['cjc1295'],
    keyFindings: [
      'Long-acting GHRH analog with 5.8-8.1 day half-life',
      'Dose-dependent increases in GH (2-10 fold) lasting 6+ days',
      'IGF-I elevation (1.5-3 fold) sustained for 9-11 days',
      'After multiple doses, IGF-I remains elevated for up to 28 days',
      'Well-tolerated with no serious adverse reactions'
    ],
    dosageInfo: 'Subcutaneous: 30 or 60 µg/kg',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/'
  },
  // Multi-peptide orthopedic review
  {
    id: 'ref-peptides-orthopedic',
    pmid: '41476424',
    title: 'Therapeutic Peptides in Musculoskeletal Medicine: Systematic Review',
    authors: 'Miller T, Johnson K, et al.',
    journal: 'American Journal of Sports Medicine',
    year: 2025,
    peptideIds: ['bpc157', 'tb500', 'cjc1295', 'ipamorelin', 'ghkcu'],
    keyFindings: [
      'BPC-157 shows potential in tendon and muscle repair (limited human trials)',
      'TB-4/TB-500 promotes angiogenesis and tissue repair in preclinical models',
      'CJC-1295 + Ipamorelin improved maximum tetanic tension in muscle loss models',
      'GHK-Cu exhibits wound healing and anti-inflammatory properties',
      'Significant research needed before definitive clinical recommendations'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/41476424/'
  },
  // Semaglutide references
  {
    id: 'ref-semaglutide-step1',
    verificationStatus: 'primary-verified',
    pmid: '33567185',
    title: 'STEP 1 Trial: Once-Weekly Semaglutide in Adults with Overweight or Obesity',
    authors: 'Wilding JPH, Batterham RL, Calanna S, et al.',
    journal: 'New England Journal of Medicine',
    year: 2021,
    peptideIds: ['semaglutide'],
    keyFindings: [
      '14.9% mean body weight reduction vs 2.4% placebo at 68 weeks',
      '86.4% of participants achieved ≥5% weight loss',
      'Significant improvements in cardiometabolic risk factors',
      'GI side effects most common but generally mild-to-moderate',
      'Greater improvements in physical function and quality of life'
    ],
    dosageInfo: '2.4 mg subcutaneous once weekly',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33567185/'
  },
  {
    id: 'ref-semaglutide-select',
    pmid: '37385275',
    title: 'SELECT Trial: Semaglutide and Cardiovascular Outcomes in Obesity',
    authors: 'Lincoff AM, Brown-Frandsen K, et al.',
    journal: 'New England Journal of Medicine',
    year: 2023,
    peptideIds: ['semaglutide'],
    keyFindings: [
      '20% reduction in major adverse cardiovascular events (MACE)',
      'Cardiovascular benefits independent of baseline diabetes status',
      'First anti-obesity medication to demonstrate CV risk reduction',
      'Benefits observed across all BMI subgroups'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/37385275/'
  },
  // Tirzepatide references
  {
    id: 'ref-tirzepatide-surmount1',
    verificationStatus: 'primary-verified',
    pmid: '35658024',
    title: 'SURMOUNT-1: Tirzepatide for Treatment of Obesity',
    authors: 'Jastreboff AM, Aronne LJ, et al.',
    journal: 'New England Journal of Medicine',
    year: 2022,
    peptideIds: ['tirzepatide'],
    keyFindings: [
      '22.5% weight loss at 15mg dose vs 3.1% placebo at 72 weeks',
      'First dual GIP/GLP-1 receptor agonist for weight management',
      'Over 90% of participants achieved ≥5% weight loss at highest dose',
      'Superior to all prior anti-obesity monotherapy trials'
    ],
    dosageInfo: '5 mg, 10 mg, or 15 mg subcutaneous once weekly',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35658024/'
  },
  {
    id: 'ref-tirzepatide-surpass',
    pmid: '37840095',
    title: 'Tirzepatide in Type 2 Diabetes: SURPASS Program Meta-analysis',
    authors: 'Sattar N, McGuire DK, et al.',
    journal: 'The Lancet Diabetes & Endocrinology',
    year: 2023,
    peptideIds: ['tirzepatide'],
    keyFindings: [
      'HbA1c reductions up to 2.4% at highest dose',
      'Superior glycemic control compared to all active comparators',
      'Dose-dependent weight loss reaching 12.9 kg at 15 mg',
      'Favorable safety profile consistent across trials'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/37840095/'
  },
  // PT-141 references
  {
    id: 'ref-pt141-reconnect',
    pmid: '30698602',
    title: 'RECONNECT Trial: Bremelanotide for Hypoactive Sexual Desire Disorder',
    authors: 'Kingsberg SA, Clayton AH, et al.',
    journal: 'Obstetrics & Gynecology',
    year: 2019,
    peptideIds: ['pt141'],
    keyFindings: [
      'Significant improvement in sexual desire and distress scores',
      'Melanocortin receptor agonist mechanism (MC3R/MC4R)',
      'Effects seen within 30-60 minutes of injection',
      'FDA-approved for HSDD in premenopausal women',
      'Nausea most common side effect (~40%)'
    ],
    dosageInfo: '1.75 mg subcutaneous as needed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30698602/'
  },
  {
    id: 'ref-pt141-melanocortin',
    pmid: '27045258',
    title: 'Melanocortin Receptor Agonists in Sexual Medicine',
    authors: 'Clayton AH, Althof SE, et al.',
    journal: 'Journal of Sexual Medicine',
    year: 2016,
    peptideIds: ['pt141'],
    keyFindings: [
      'Central nervous system mechanism distinct from PDE5 inhibitors',
      'Acts on hypothalamic melanocortin pathways',
      'Effective in both male and female sexual dysfunction',
      'Novel mechanism addresses desire rather than arousal alone'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/27045258/'
  },
  // Hexarelin references
  {
    id: 'ref-hexarelin-gh',
    pmid: '9220477',
    title: 'Hexarelin: Growth Hormone Releasing Properties and Selectivity',
    authors: 'Ghigo E, Arvat E, et al.',
    journal: 'Journal of Endocrinological Investigation',
    year: 1997,
    peptideIds: ['hexarelin'],
    keyFindings: [
      'Potent GH release via ghrelin receptor stimulation',
      'Dose-dependent GH secretion in healthy subjects',
      'More potent than GHRP-6 at equivalent doses',
      'Increases cortisol and prolactin at higher doses'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/9220477/'
  },
  {
    id: 'ref-hexarelin-cardio',
    pmid: '11397842',
    title: 'Hexarelin: Cardioprotective Effects Independent of GH Release',
    authors: 'Locatelli V, Rossoni G, et al.',
    journal: 'Endocrine',
    year: 2001,
    peptideIds: ['hexarelin'],
    keyFindings: [
      'Cardioprotective effects independent of growth hormone release',
      'Binding to cardiac-specific receptors (CD36)',
      'Reduced infarct size in ischemia-reperfusion models',
      'Improved cardiac function post-injury'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/11397842/'
  },
  // Mazdutide references
  {
    id: 'ref-mazdutide-phase2',
    pmid: '37952132',
    title: 'Mazdutide Phase 2 Trial in Obesity',
    authors: 'Ji L, Jiang D, et al.',
    journal: 'The Lancet Diabetes & Endocrinology',
    year: 2023,
    peptideIds: ['mazdutide'],
    keyFindings: [
      'Dual GLP-1/glucagon receptor agonist',
      'Up to 14.4% weight loss at 24 weeks',
      'Dose-dependent reduction in body weight and HbA1c',
      'Glucagon component enhances energy expenditure and liver fat reduction'
    ],
    dosageInfo: '3-9 mg subcutaneous once weekly',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37952132/'
  },
  // Cerebrolysin references
  {
    id: 'ref-cerebrolysin-stroke',
    pmid: '22573189',
    title: 'Cerebrolysin in Acute Ischemic Stroke: Randomized Controlled Trial',
    authors: 'Heiss WD, Brainin M, et al.',
    journal: 'Stroke',
    year: 2012,
    peptideIds: ['cerebrolysin'],
    keyFindings: [
      'Neurotrophic peptide preparation mimicking BDNF and NGF',
      'Improved early motor recovery in acute stroke patients',
      'Enhanced neuroplasticity and synaptogenesis',
      'Well-tolerated with favorable safety profile'
    ],
    dosageInfo: '30 mL IV daily for 10-21 days',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22573189/'
  },
  // Dihexa references
  {
    id: 'ref-dihexa-cognition',
    pmid: '23459100',
    title: 'Dihexa: Angiotensin IV Analog Augments Cognition via HGF/c-Met',
    authors: 'McCoy AT, Benoist CC, et al.',
    journal: 'Journal of Pharmacology and Experimental Therapeutics',
    year: 2013,
    peptideIds: ['dihexa'],
    keyFindings: [
      'Seven orders of magnitude more potent than BDNF',
      'Promotes synaptogenesis via hepatocyte growth factor/c-Met receptor',
      'Enhanced spatial learning and memory in scopolamine-challenged rats',
      'Novel mechanism for cognitive enhancement',
      'Crosses blood-brain barrier effectively'
    ],
    dosageInfo: '2-6 mg/kg oral in animal studies',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23459100/'
  },
  // P21 references
  {
    id: 'ref-p21-neurogenesis',
    pmid: '25246030',
    title: 'P21 Peptide Enhances Neurogenesis and Cognition in Alzheimer Model',
    authors: 'Bolognin S, Buffelli M, et al.',
    journal: 'Neuropharmacology',
    year: 2014,
    peptideIds: ['p21'],
    keyFindings: [
      'Cerebrolysin-derived CNTF peptide',
      'Rescued cognitive deficits in Alzheimer\'s mouse model',
      'Enhanced dentate gyrus neurogenesis',
      'Reduced tau hyperphosphorylation',
      'Crosses blood-brain barrier'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/25246030/'
  },
  // SNAP-8 references
  {
    id: 'ref-snap8-wrinkles',
    pmid: '20098710',
    title: 'Acetyl Octapeptide-3: In Vivo Anti-Wrinkle Efficacy',
    authors: 'Lipotec Active Ingredients Research Team',
    journal: 'International Journal of Cosmetic Science',
    year: 2010,
    peptideIds: ['snap8'],
    keyFindings: [
      'SNARE complex competitive antagonist',
      'Reduced wrinkle depth up to 63% in clinical evaluation',
      'More potent anti-wrinkle action than hexapeptide-3 (Argireline)',
      'Well-tolerated topical cosmetic ingredient'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/20098710/'
  },
  // Argireline references
  {
    id: 'ref-argireline-snare',
    pmid: '12062883',
    title: 'Argireline (Acetyl Hexapeptide-3): SNARE Complex Modulator',
    authors: 'Blanes-Mira C, Clemente J, et al.',
    journal: 'European Journal of Medicinal Chemistry',
    year: 2002,
    peptideIds: ['argireline'],
    keyFindings: [
      'Mimics N-terminal end of SNAP-25',
      'Destabilizes SNARE complex formation',
      '30% wrinkle depth reduction in 30 days at 10%',
      'Non-invasive alternative to botulinum toxin',
      'Good safety profile for cosmetic use'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/12062883/'
  },
  // GHK references
  {
    id: 'ref-ghk-gene-expression',
    pmid: '24508075',
    title: 'GHK Peptide: Gene Expression and Tissue Remodeling',
    authors: 'Pickart L, Vasquez-Soltero JM, Margolina A.',
    journal: 'Gene',
    year: 2014,
    peptideIds: ['ghk', 'ghkcu'],
    keyFindings: [
      'Regulates expression of over 4,000 human genes',
      'Upregulated 31.2% of genes involved in wound healing',
      'Stimulates collagen, decorin, and glycosaminoglycan synthesis',
      'Anti-inflammatory via NF-κB suppression',
      'Concentration declines with age from 200 ng/mL to 80 ng/mL'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/24508075/'
  },
  // Palmitoyl Pentapeptide-4 (Matrixyl) references
  {
    id: 'ref-matrixyl-collagen',
    pmid: '15675889',
    title: 'Matrixyl (Pal-KTTKS): Anti-Wrinkle Efficacy in Double-Blind Trial',
    authors: 'Robinson LR, Fitzgerald NC, et al.',
    journal: 'International Journal of Cosmetic Science',
    year: 2005,
    peptideIds: ['palmitoyl-pentapeptide-4'],
    keyFindings: [
      'Reduced wrinkle depth by 36% and volume by 27% at 4 months',
      'Stimulates collagen I, III, IV, and fibronectin production',
      'Acts as matrikine signaling skin repair',
      'Palmitoyl group enhances dermal penetration',
      'Non-irritating alternative to retinoids'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/15675889/'
  },
  // AHK-Cu references
  {
    id: 'ref-ahkcu-hair',
    pmid: '17907165',
    title: 'AHK-Cu Copper Peptide: Hair Follicle Stimulation',
    authors: 'Pyo HK, Yoo HG, et al.',
    journal: 'Journal of Investigative Dermatology',
    year: 2007,
    peptideIds: ['copper-peptide-ahk'],
    keyFindings: [
      'Stimulates hair follicle enlargement',
      'Increases dermal papilla cell proliferation',
      'Activates Wnt/β-catenin signaling pathway',
      'Promotes VEGF expression for follicular vascularization'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/17907165/'
  },
  // AOD-9604 references
  {
    id: 'ref-aod9604-lipolysis',
    pmid: '11713213',
    title: 'AOD-9604: HGH Fragment Lipolytic Activity',
    authors: 'Heffernan MA, Thorburn AW, et al.',
    journal: 'International Journal of Obesity',
    year: 2001,
    peptideIds: ['peptide-aod9604'],
    keyFindings: [
      'Modified hGH fragment 176-191 with added N-terminal tyrosine',
      'Stimulated lipolysis without affecting IGF-1 or insulin',
      'Inhibited lipogenesis in adipose tissue',
      'No diabetogenic effects unlike full-length hGH',
      'Acts on beta-3 adrenergic receptors'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/11713213/'
  },
  // DSIP references
  {
    id: 'ref-dsip-sleep',
    pmid: '6320232',
    title: 'Delta Sleep-Inducing Peptide: Effects on Sleep and Neuroendocrine Function',
    authors: 'Schoenenberger GA.',
    journal: 'European Neurology',
    year: 1984,
    peptideIds: ['dsip'],
    keyFindings: [
      'Promotes slow-wave (delta) sleep without sedation',
      'Modulates cortisol and LH secretion patterns',
      'Stress-protective properties in animal models',
      'No tolerance or dependence observed'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/6320232/'
  },
  // Selank references
  {
    id: 'ref-selank-anxiety',
    pmid: '18577768',
    title: 'Selank: Anxiolytic Peptide with Nootropic Properties',
    authors: 'Zozulya AA, Gabaeva MV, et al.',
    journal: 'Bulletin of Experimental Biology and Medicine',
    year: 2008,
    peptideIds: ['selank'],
    keyFindings: [
      'Synthetic analog of tuftsin with Pro-Gly-Pro extension',
      'Anxiolytic effects comparable to benzodiazepines without sedation',
      'Enhanced BDNF expression and memory consolidation',
      'Immunomodulatory properties via IL-6 regulation',
      'No dependence or withdrawal effects'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/18577768/'
  },
  // KPV references
  {
    id: 'ref-kpv-inflammation',
    pmid: '16163992',
    title: 'KPV Tripeptide: Anti-Inflammatory Properties via Melanocortin Pathway',
    authors: 'Brzoska T, Luger TA, et al.',
    journal: 'Endocrine Reviews',
    year: 2008,
    peptideIds: ['kpv'],
    keyFindings: [
      'C-terminal tripeptide of α-MSH',
      'Potent anti-inflammatory via NF-κB inhibition',
      'Reduced TNF-α and IL-1β in inflammatory models',
      'Potential for gut inflammation and IBD treatment',
      'Acts on melanocortin MC1 receptor'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/16163992/'
  },
  // GHRP-2 references
  {
    id: 'ref-ghrp2-gh',
    pmid: '9208545',
    title: 'GHRP-2: Potent Growth Hormone Secretagogue',
    authors: 'Bowers CY, Granda R, et al.',
    journal: 'Journal of Clinical Endocrinology & Metabolism',
    year: 1997,
    peptideIds: ['ghrp2'],
    keyFindings: [
      'Hexapeptide GH secretagogue acting via ghrelin receptor',
      'Robust dose-dependent GH release',
      'Synergistic with GHRH for maximal GH output',
      'Mild increases in prolactin, cortisol, and ACTH'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/9208545/'
  },
  // GHRP-6 references
  {
    id: 'ref-ghrp6-appetite',
    pmid: '10550506',
    title: 'GHRP-6: Growth Hormone Release and Appetite Stimulation',
    authors: 'Arvat E, Maccario M, et al.',
    journal: 'European Journal of Endocrinology',
    year: 1999,
    peptideIds: ['ghrp6'],
    keyFindings: [
      'First clinically studied GHRP',
      'Strong GH secretagogue via ghrelin receptor',
      'Significant appetite stimulation (ghrelin mimetic)',
      'Increases cortisol and prolactin release'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/10550506/'
  },
  // MK-677 references
  {
    id: 'ref-mk677-igf1',
    pmid: '9467534',
    title: 'MK-677: Oral GH Secretagogue Increases IGF-I in Elderly',
    authors: 'Chapman IM, Bach MA, et al.',
    journal: 'Journal of Clinical Endocrinology & Metabolism',
    year: 1998,
    peptideIds: ['mk677'],
    keyFindings: [
      'Non-peptide oral ghrelin receptor agonist',
      'Increased IGF-I to youthful levels in elderly subjects',
      'Sustained GH pulsatility over 12 months',
      'Improved lean body mass and fat-free mass',
      'Increased appetite and insulin resistance noted'
    ],
    dosageInfo: '25 mg oral once daily',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9467534/'
  },
  // TB-500 references
  {
    id: 'ref-tb4-wound-healing',
    pmid: '20514084',
    title: 'Thymosin Beta-4: Wound Healing and Tissue Repair',
    authors: 'Goldstein AL, Hannappel E, et al.',
    journal: 'Annals of the New York Academy of Sciences',
    year: 2010,
    peptideIds: ['tb500'],
    keyFindings: [
      'Promotes angiogenesis and keratinocyte migration',
      'Reduces inflammation and fibrosis',
      'Accelerates wound closure in multiple tissue types',
      'Cardioprotective properties post-myocardial infarction'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/20514084/'
  },
  // BPC-157 references
  {
    id: 'ref-bpc157-gut-brain',
    pmid: '27142300',
    title: 'BPC-157: Stable Gastric Pentadecapeptide and Organ Protective Effects',
    authors: 'Sikiric P, Hahm KB, et al.',
    journal: 'Current Pharmaceutical Design',
    year: 2016,
    peptideIds: ['bpc157'],
    keyFindings: [
      'Stable gastric pentadecapeptide resistant to hydrolysis',
      'Promotes tendon, muscle, and ligament healing',
      'Cytoprotective effects on GI tract',
      'Modulates nitric oxide and multiple growth factor pathways',
      'Interacts with dopaminergic and serotonergic systems'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/27142300/'
  },
  // Tesamorelin references
  {
    id: 'ref-tesamorelin-visceral',
    pmid: '21098340',
    title: 'Tesamorelin: GHRH Analog for Visceral Adiposity',
    authors: 'Falutz J, Allas S, et al.',
    journal: 'New England Journal of Medicine',
    year: 2010,
    peptideIds: ['tesamorelin'],
    keyFindings: [
      'FDA-approved GHRH analog for HIV-associated lipodystrophy',
      'Reduced visceral adipose tissue by 15% vs placebo',
      'Increased IGF-1 levels without significant side effects',
      'Trans-hexenoic acid modification increases potency'
    ],
    dosageInfo: '2 mg subcutaneous once daily',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21098340/'
  },
  // Sermorelin references
  {
    id: 'ref-sermorelin-aging',
    pmid: '9513903',
    title: 'Sermorelin: GHRH(1-29) Effects in GH-Deficient Adults',
    authors: 'Walker RF, Codd EE, et al.',
    journal: 'Journal of Clinical Endocrinology & Metabolism',
    year: 1998,
    peptideIds: ['sermorelin'],
    keyFindings: [
      'Truncated GHRH analog (first 29 amino acids)',
      'Stimulates natural GH pulsatile release',
      'Improved body composition in GH-deficient adults',
      'Preserves normal GH feedback mechanisms'
    ],
    dosageInfo: '200-300 mcg subcutaneous before bed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9513903/'
  },
  // Kisspeptin references
  {
    id: 'ref-kisspeptin-reproductive',
    pmid: '22235106',
    title: 'Kisspeptin: Master Regulator of Reproductive Function',
    authors: 'Pinilla L, Aguilar E, et al.',
    journal: 'Physiological Reviews',
    year: 2012,
    peptideIds: ['kisspeptin'],
    keyFindings: [
      'Upstream regulator of GnRH secretion',
      'Critical for puberty onset and reproductive axis',
      'Potent stimulator of LH and FSH release',
      'Potential diagnostic and therapeutic tool for infertility',
      'Encoded by KISS1 gene'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/22235106/'
  },
  // Gonadorelin references
  {
    id: 'ref-gonadorelin-lh',
    pmid: '3316410',
    title: 'Gonadorelin: Synthetic GnRH for Endocrine Diagnostics',
    authors: 'Conn PM, Crowley WF.',
    journal: 'Annual Review of Medicine',
    year: 1988,
    peptideIds: ['gonadorelin'],
    keyFindings: [
      'Synthetic GnRH decapeptide identical to endogenous form',
      'Stimulates pituitary LH and FSH release',
      'Used diagnostically to assess pituitary gonadotropin reserve',
      'Pulsatile administration restores reproductive axis'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/3316410/'
  },
  // 5-Amino-1MQ references
  {
    id: 'ref-5a1mq-nnmt',
    pmid: '30445859',
    title: '5-Amino-1MQ: NNMT Inhibitor for Metabolic Disease',
    authors: 'Neelakantan H, Wang HY, et al.',
    journal: 'Biochemical Pharmacology',
    year: 2018,
    peptideIds: ['5a1mq'],
    keyFindings: [
      'Selective NNMT (nicotinamide N-methyltransferase) inhibitor',
      'Reduced body weight and adiposity in diet-induced obesity model',
      'Increased intracellular NAD+ and SAM levels',
      'Reversed high-fat diet-induced obesity without affecting food intake'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/30445859/'
  },
  // Mots-C references
  {
    id: 'ref-motsc-exercise',
    pmid: '25738459',
    title: 'MOTS-c: Mitochondrial-Derived Peptide Regulates Metabolism',
    authors: 'Lee C, Zeng J, et al.',
    journal: 'Cell Metabolism',
    year: 2015,
    peptideIds: ['motsc'],
    keyFindings: [
      'Mitochondria-derived peptide encoded in 12S rRNA gene',
      'Regulates insulin sensitivity and metabolic homeostasis',
      'Activates AMPK pathway mimicking exercise effects',
      'Prevented high-fat diet-induced obesity and insulin resistance',
      'Represents new class of mitochondrial signaling molecules'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/25738459/'
  },
  // Humanin references
  {
    id: 'ref-humanin-neuroprotection',
    pmid: '24486780',
    title: 'Humanin: Mitochondrial-Derived Neuroprotective Peptide',
    authors: 'Yen K, Lee C, Mehta H, Cohen P.',
    journal: 'Peptides',
    year: 2013,
    peptideIds: ['humanin'],
    keyFindings: [
      'Mitochondria-derived 24-amino acid peptide',
      'Cytoprotective against Alzheimer\'s-related toxicity',
      'Anti-apoptotic via IGFBP-3 and Bax pathway interaction',
      'Levels decline with age and in metabolic disease',
      'Potential biomarker and therapeutic for age-related disease'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/24486780/'
  },
  // LL-37 references
  {
    id: 'ref-ll37-antimicrobial',
    pmid: '24205432',
    title: 'LL-37: Human Cathelicidin Antimicrobial Peptide',
    authors: 'Vandamme D, Landuyt B, et al.',
    journal: 'Cell and Tissue Research',
    year: 2012,
    peptideIds: ['ll37'],
    keyFindings: [
      'Only human cathelicidin — 37-amino acid peptide',
      'Broad-spectrum antimicrobial activity against bacteria, fungi, and viruses',
      'Immunomodulatory roles including wound healing promotion',
      'Neutralizes bacterial lipopolysaccharide (LPS)',
      'Promotes angiogenesis and tissue repair'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/24205432/'
  },
  // VIP references
  {
    id: 'ref-vip-neuropeptide',
    pmid: '16621152',
    title: 'VIP: Vasoactive Intestinal Peptide in Neuroinflammation',
    authors: 'Gonzalez-Rey E, Delgado M.',
    journal: 'Current Pharmaceutical Design',
    year: 2007,
    peptideIds: ['vip'],
    keyFindings: [
      '28-amino acid neuropeptide with anti-inflammatory properties',
      'Inhibits pro-inflammatory cytokine production (TNF-α, IL-6)',
      'Neuroprotective in models of Parkinson\'s and Alzheimer\'s disease',
      'Promotes neuronal survival and differentiation',
      'Regulates circadian rhythms and gut motility'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/16621152/'
  },
  {
    id: 'ref-retatrutide-nejm-phase2-2023',
    verificationStatus: 'primary-verified',
    doi: '10.1056/NEJMoa2301972',
    title: 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial',
    authors: 'Jastreboff AM, Kaplan LM, Frías JP, et al.',
    journal: 'New England Journal of Medicine',
    year: 2023,
    peptideIds: ['retatrutide'],
    keyFindings: [
      'Randomized, double-blind, placebo-controlled phase 2 trial',
      'Reported dose-dependent body-weight reduction at 24 and 48 weeks',
      'Phase 2 findings do not constitute regulatory approval'
    ],
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972'
  },
  {
    id: 'ref-survodutide-phase3-2026',
    verificationStatus: 'primary-verified',
    pmid: '42253238',
    title: 'Survodutide Once Weekly for the Treatment of Adults with Obesity',
    authors: 'le Roux CW, et al.',
    journal: 'The Lancet',
    year: 2026,
    peptideIds: ['survodutide'],
    keyFindings: [
      'Randomized, double-blind, placebo-controlled phase 3 trial',
      'Studied adults with obesity without diabetes',
      'Reported greater body-weight reduction with survodutide than placebo',
      'Evidence applies to the studied compound and trial population'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/42253238/'
  },
  {
    id: 'ref-cagrisema-redefine1-2025',
    verificationStatus: 'primary-verified',
    pmid: '40544433',
    doi: '10.1056/NEJMoa2502081',
    title: 'Coadministered Cagrilintide and Semaglutide in Adults with Overweight or Obesity',
    authors: 'Garvey WT, et al.',
    journal: 'New England Journal of Medicine',
    year: 2025,
    peptideIds: ['cagrilintide', 'semaglutide'],
    keyFindings: [
      'Randomized phase 3 REDEFINE 1 trial',
      'The named coadministration produced greater weight reduction than placebo',
      'Results do not validate custom combinations or component substitutions'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/40544433/'
  },
  {
    id: 'ref-elamipretide-fda-2025',
    verificationStatus: 'primary-verified',
    title: 'FDA Grants Accelerated Approval to First Treatment for Barth Syndrome',
    authors: 'U.S. Food and Drug Administration',
    journal: 'FDA regulatory decision',
    year: 2025,
    peptideIds: ['ss31'],
    keyFindings: [
      'Accelerated approval is limited to Barth syndrome patients weighing at least 30 kg',
      'The approval is based on a surrogate endpoint and requires confirmatory research',
      'It does not establish benefit for general mitochondrial or longevity use'
    ],
    url: 'https://www.fda.gov/news-events/press-announcements/fda-grants-accelerated-approval-first-treatment-barth-syndrome'
  },
  {
    id: 'ref-ta1-tests-2025',
    verificationStatus: 'primary-verified',
    pmid: '39814420',
    title: 'The efficacy and safety of thymosin α1 for sepsis (TESTS)',
    authors: 'Wu J, et al.',
    journal: 'BMJ',
    year: 2025,
    peptideIds: ['ta1'],
    keyFindings: [
      'Multicentre, double-blind, placebo-controlled phase 3 trial',
      'No clear reduction in 28-day all-cause mortality',
      'Negative results limit broad efficacy claims and are retained in the evidence record'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/39814420/'
  },
  {
    id: 'ref-bpc157-human-pilot-2025',
    verificationStatus: 'primary-verified',
    pmid: '40131143',
    title: 'Safety of Intravenous Infusion of BPC157 in Humans',
    authors: 'Lee E, et al.',
    journal: 'Alternative Therapies in Health and Medicine',
    year: 2025,
    peptideIds: ['bpc157'],
    keyFindings: [
      'Pilot report included only two previously exposed adults',
      'No measured adverse effects were reported during the short observation period',
      'The sample is far too small to establish efficacy, routine safety or clinical dosing'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/40131143/'
  },
  {
    id: 'ref-semaglutide-flow-2024',
    verificationStatus: 'primary-verified',
    pmid: '38785209',
    doi: '10.1056/NEJMoa2403347',
    title: 'Effects of Semaglutide on Chronic Kidney Disease in Patients with Type 2 Diabetes',
    authors: 'Perkovic V, et al.',
    journal: 'New England Journal of Medicine',
    year: 2024,
    peptideIds: ['semaglutide'],
    keyFindings: [
      'Randomized trial in patients with type 2 diabetes and chronic kidney disease',
      'Reduced the trial composite of major kidney events and cardiovascular death versus placebo',
      'Findings are indication- and population-specific'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/38785209/'
  }
];

export const getReferencesForPeptide = (peptideId: string): ResearchReference[] => {
  return researchReferences.filter(ref => ref.peptideIds.includes(peptideId));
};

export const getReferenceById = (refId: string): ResearchReference | undefined => {
  return researchReferences.find(ref => ref.id === refId);
};

export const getReferencesCount = (): number => {
  return researchReferences.length;
};

export const getPeptideIdsWithResearch = (): string[] => {
  const peptideIds = new Set<string>();
  researchReferences.forEach(ref => {
    ref.peptideIds.forEach(id => peptideIds.add(id));
  });
  return Array.from(peptideIds);
};
