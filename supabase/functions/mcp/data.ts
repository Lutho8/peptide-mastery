// Minimal public research index. Personal dosing, supplier, price, stock and
// certificate-verification data are deliberately excluded from the MCP.
export type PeptideCategory =
  | "immune" | "longevity" | "cognitive" | "metabolic" | "healing"
  | "gh-secretagogue" | "weight-loss" | "skin-hair" | "hormonal";

export interface Peptide {
  id: string;
  name: string;
  shortName: string;
  category: PeptideCategory;
  longevityScore: number;
  mechanism: string;
  benefits: string[];
  risks: string[];
  references: string[];
}

export interface StackingInteraction {
  peptideId1: string;
  peptideId2: string;
  compatibility: "synergistic" | "compatible" | "caution" | "avoid";
  notes: string;
}

export const peptides: Peptide[] = [
  { id: "bpc157", name: "BPC-157", shortName: "BPC-157", category: "healing", longevityScore: 6, mechanism: "Preclinical research examines tissue-repair and inflammatory pathways.", benefits: ["Tissue-repair research"], risks: ["Human evidence remains limited"], references: [] },
  { id: "tb500", name: "Thymosin Beta-4 fragment", shortName: "TB-500", category: "healing", longevityScore: 6, mechanism: "Research examines actin regulation, cell migration, and repair signalling.", benefits: ["Repair-pathway research"], risks: ["Limited controlled human evidence"], references: [] },
  { id: "semaglutide", name: "Semaglutide", shortName: "Semaglutide", category: "weight-loss", longevityScore: 7, mechanism: "GLP-1 receptor agonist studied for metabolic disease and weight management.", benefits: ["Metabolic research"], risks: ["Prescription medicine with contraindications and monitoring requirements"], references: [] },
  { id: "tirzepatide", name: "Tirzepatide", shortName: "Tirzepatide", category: "weight-loss", longevityScore: 7, mechanism: "Dual GIP and GLP-1 receptor agonist studied in metabolic disease.", benefits: ["Metabolic research"], risks: ["Prescription medicine with contraindications and monitoring requirements"], references: [] },
  { id: "retatrutide", name: "Retatrutide", shortName: "Retatrutide", category: "metabolic", longevityScore: 7, mechanism: "Investigational GIP, GLP-1, and glucagon receptor agonist.", benefits: ["Investigational metabolic research"], risks: ["Investigational compound; long-term evidence is developing"], references: [] },
  { id: "ipamorelin", name: "Ipamorelin", shortName: "Ipamorelin", category: "gh-secretagogue", longevityScore: 5, mechanism: "Growth-hormone secretagogue receptor research compound.", benefits: ["Endocrine research"], risks: ["Not approved for general therapeutic use"], references: [] },
  { id: "cjc1295", name: "CJC-1295", shortName: "CJC-1295", category: "gh-secretagogue", longevityScore: 5, mechanism: "Growth-hormone-releasing hormone analogue studied in endocrine research.", benefits: ["Endocrine research"], risks: ["Not approved for general therapeutic use"], references: [] },
  { id: "ghkcu", name: "GHK-Cu", shortName: "GHK-Cu", category: "skin-hair", longevityScore: 7, mechanism: "Copper-binding peptide studied in skin, wound, and gene-expression research.", benefits: ["Skin and tissue research"], risks: ["Route and formulation materially affect safety"], references: [] },
  { id: "semax", name: "Semax", shortName: "Semax", category: "cognitive", longevityScore: 6, mechanism: "Synthetic peptide studied in neurobiological and cognitive research.", benefits: ["Cognitive research"], risks: ["Regulatory status and evidence vary by country"], references: [] },
  { id: "selank", name: "Selank", shortName: "Selank", category: "cognitive", longevityScore: 6, mechanism: "Synthetic peptide studied in stress-response and cognitive research.", benefits: ["Stress-response research"], risks: ["Limited controlled evidence outside specific settings"], references: [] },
  { id: "ss31", name: "Elamipretide", shortName: "SS-31", category: "longevity", longevityScore: 8, mechanism: "Mitochondria-targeted peptide studied in cellular-energy research.", benefits: ["Mitochondrial research"], risks: ["Investigational status depends on indication and country"], references: [] },
  { id: "motsc", name: "MOTS-c", shortName: "MOTS-c", category: "metabolic", longevityScore: 7, mechanism: "Mitochondrial-derived peptide studied in metabolic signalling.", benefits: ["Metabolic signalling research"], risks: ["Early-stage human evidence"], references: [] },
  { id: "epitalon", name: "Epitalon", shortName: "Epitalon", category: "longevity", longevityScore: 6, mechanism: "Tetrapeptide studied in ageing and circadian research.", benefits: ["Ageing research"], risks: ["Long-term controlled human evidence is limited"], references: [] },
  { id: "ta1", name: "Thymosin Alpha-1", shortName: "TA1", category: "immune", longevityScore: 7, mechanism: "Immunomodulatory peptide studied in innate and adaptive immune pathways.", benefits: ["Immune research"], risks: ["Medical supervision is important in immune conditions"], references: [] },
  { id: "pt141", name: "Bremelanotide", shortName: "PT-141", category: "hormonal", longevityScore: 4, mechanism: "Melanocortin receptor agonist with indication-specific regulatory approval.", benefits: ["Melanocortin research"], risks: ["Contraindications and blood-pressure effects require clinical review"], references: [] },
];

export const categoryConfig: Record<PeptideCategory, { label: string }> = {
  immune: { label: "Immune" }, longevity: { label: "Longevity" }, cognitive: { label: "Cognitive" },
  metabolic: { label: "Metabolic" }, healing: { label: "Healing" }, "gh-secretagogue": { label: "Growth Hormone" },
  "weight-loss": { label: "Weight Management" }, "skin-hair": { label: "Skin & Hair" }, hormonal: { label: "Hormonal" },
};

export const goalToCategories: Record<string, PeptideCategory[]> = {
  "fat-loss": ["weight-loss", "metabolic"], "muscle-gain": ["gh-secretagogue"],
  recovery: ["healing"], longevity: ["longevity"], cognitive: ["cognitive"],
  energy: ["metabolic"], sleep: ["cognitive"], metabolic: ["metabolic", "weight-loss"],
};
export const goalLabels: Record<string, string> = {
  "fat-loss": "Fat Loss", "muscle-gain": "Muscle Gain", recovery: "Recovery & Healing",
  longevity: "Longevity", cognitive: "Cognitive", energy: "Energy", sleep: "Sleep", metabolic: "Metabolic Health",
};

export const stackingInteractions: StackingInteraction[] = [
  { peptideId1: "bpc157", peptideId2: "tb500", compatibility: "caution", notes: "Both are investigational repair compounds. Combined human safety evidence is insufficient; clinician review is required." },
  { peptideId1: "ipamorelin", peptideId2: "cjc1295", compatibility: "caution", notes: "Both affect the growth-hormone axis. Overlapping endocrine effects and monitoring requirements need clinician review." },
  { peptideId1: "semaglutide", peptideId2: "tirzepatide", compatibility: "avoid", notes: "Do not combine overlapping incretin medicines unless a qualified prescriber explicitly directs it." },
  { peptideId1: "retatrutide", peptideId2: "tirzepatide", compatibility: "avoid", notes: "Overlapping investigational and incretin pathways create unnecessary risk without specialist oversight." },
  { peptideId1: "motsc", peptideId2: "retatrutide", compatibility: "caution", notes: "Both relate to metabolic pathways; evidence for combined use is insufficient." },
];
