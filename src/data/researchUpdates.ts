export interface ResearchUpdate {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  date: string;
  category: 'clinical-trial' | 'study' | 'regulatory' | 'evidence-limit';
  peptideId?: string;
  peptideName?: string;
}

/** Evidence-led feed. Last source review: 2026-08-23. */
export const researchUpdates: ResearchUpdate[] = [
  {
    id: 'survodutide-phase3-2026',
    headline: 'Survodutide phase 3 obesity results published',
    summary: 'The randomized SYNCHRONIZE-1 trial reported greater body-weight reduction with once-weekly survodutide than placebo in adults with obesity without diabetes. This is compound-specific phase 3 evidence; it does not validate other products or untested combinations.',
    source: 'The Lancet · PMID 42253238',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/42253238/',
    date: '2026-06-07',
    category: 'clinical-trial',
    peptideId: 'survodutide',
    peptideName: 'Survodutide',
  },
  {
    id: 'elamipretide-fda-2025',
    headline: 'Elamipretide received accelerated FDA approval for a narrow indication',
    summary: 'The FDA approved Forzinity (elamipretide/SS-31) to improve muscle strength in patients with Barth syndrome weighing at least 30 kg. Approval is indication-specific and confirmatory evidence is still required; it is not evidence for general mitochondrial or longevity use.',
    source: 'U.S. Food and Drug Administration',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements/fda-grants-accelerated-approval-first-treatment-barth-syndrome',
    date: '2025-09-19',
    category: 'regulatory',
    peptideId: 'ss31',
    peptideName: 'Elamipretide (SS-31)',
  },
  {
    id: 'cagrisema-redefine1-2025',
    headline: 'REDEFINE 1 reported phase 3 data for cagrilintide–semaglutide',
    summary: 'A randomized phase 3 trial found greater weight reduction with coadministered cagrilintide and semaglutide than placebo in adults with overweight or obesity. The publication evaluates that named combination under trial conditions, not custom peptide stacks.',
    source: 'New England Journal of Medicine · DOI 10.1056/NEJMoa2502081',
    sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2502081',
    date: '2025-06-22',
    category: 'clinical-trial',
    peptideId: 'cagrilintide',
    peptideName: 'Cagrilintide + Semaglutide',
  },
  {
    id: 'ta1-sepsis-2025',
    headline: 'Large thymosin alpha-1 sepsis trial found no mortality benefit',
    summary: 'In a multicentre, double-blind phase 3 trial of 1,089 analysed adults with sepsis, thymosin alpha-1 did not reduce 28-day all-cause mortality versus placebo. Negative findings are retained because an evidence library must show what did not work as well as positive signals.',
    source: 'BMJ · PMID 39814420',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39814420/',
    date: '2025-01-16',
    category: 'evidence-limit',
    peptideId: 'ta1',
    peptideName: 'Thymosin Alpha-1',
  },
  {
    id: 'bpc157-human-pilot-2025',
    headline: 'BPC-157 human safety publication remains an extremely small pilot',
    summary: 'A 2025 publication described intravenous exposure in only two previously exposed adults and reported no measured adverse effects over the short observation period. A sample of two cannot establish efficacy, routine safety, dosing, or clinical use.',
    source: 'Alternative Therapies · PMID 40131143',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/40131143/',
    date: '2025-03-25',
    category: 'evidence-limit',
    peptideId: 'bpc157',
    peptideName: 'BPC-157',
  },
  {
    id: 'tirzepatide-osa-2024',
    headline: 'Tirzepatide phase 3 trials evaluated obesity with sleep apnoea',
    summary: 'Two randomized trials in adults with moderate-to-severe obstructive sleep apnoea and obesity reported reductions in apnoea–hypopnoea index, body weight and hypoxic burden. Results apply to the studied population and product, under clinical supervision.',
    source: 'New England Journal of Medicine · PMID 38912654',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/38912654/',
    date: '2024-06-21',
    category: 'clinical-trial',
    peptideId: 'tirzepatide',
    peptideName: 'Tirzepatide',
  },
  {
    id: 'semaglutide-flow-2024',
    headline: 'FLOW trial reported kidney outcomes for semaglutide',
    summary: 'In adults with type 2 diabetes and chronic kidney disease, randomized treatment with semaglutide reduced the trial’s composite risk of major kidney events and cardiovascular death versus placebo. This does not support extrapolation to unrelated peptides or self-directed treatment.',
    source: 'New England Journal of Medicine · PMID 38785209',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/38785209/',
    date: '2024-05-24',
    category: 'clinical-trial',
    peptideId: 'semaglutide',
    peptideName: 'Semaglutide',
  },
  {
    id: 'retatrutide-phase2-2023',
    headline: 'Retatrutide evidence remains investigational',
    summary: 'The published randomized phase 2 obesity trial reported dose-dependent weight reduction over 48 weeks. Retatrutide remains investigational while phase 3 studies continue; phase 2 results are not approval and do not validate products sold outside trials.',
    source: 'New England Journal of Medicine · DOI 10.1056/NEJMoa2301972',
    sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972',
    date: '2023-06-26',
    category: 'clinical-trial',
    peptideId: 'retatrutide',
    peptideName: 'Retatrutide',
  },
];
