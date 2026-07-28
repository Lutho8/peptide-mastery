// Route- and sex-aware dosing tables for peptides that can be administered
// via more than one route (e.g. intranasal AND subcutaneous).
//
// UNIT POLICY: mg / IU / units only — never mcg. Where clinical literature
// uses mcg (intranasal micro-doses), we express the primary value in mg and
// append the mcg equivalent in parentheses for reader familiarity only.
//
// Female values default to ~80% of male dose where sex-specific research is
// thin — flagged in `notes`. Research-only, not medical advice.

export type DoseRoute = 'intranasal' | 'subcutaneous';
export type ExperienceTier = 'beginner' | 'intermediate' | 'advanced' | 'athlete';
export type Sex = 'male' | 'female';

export interface DoseCell {
  male: string;
  female: string;
  notes?: string;
}

export interface DoseTable {
  beginner: DoseCell;
  intermediate: DoseCell;
  advanced: DoseCell;
  athlete: DoseCell;
  frequency: string;
  cycleDays: string;
  sourceNotes?: string;
}

export interface RouteDosing {
  intranasal?: DoseTable;
  subcutaneous?: DoseTable;
  /** Human label for the "why two routes" line rendered under the toggle. */
  routeGuidance?: string;
}

/**
 * Peptide id → per-route dosing.
 * Keys match `id` fields in src/data/peptides.ts and peptidesExpanded.ts.
 */
export const ROUTE_DOSING: Record<string, RouteDosing> = {
  selank: {
    routeGuidance:
      'Selank is bioactive intranasally and subcutaneously. SC delivers a higher systemic dose per mg — intranasal is the most-studied route in Russian clinical trials.',
    subcutaneous: {
      beginner:     { male: '0.1 mg / day',        female: '0.08 mg / day' },
      intermediate: { male: '0.2 mg / day',        female: '0.16 mg / day' },
      advanced:     { male: '0.3 mg / day',        female: '0.25 mg / day' },
      athlete:      { male: '0.2 mg × 2 / day',    female: '0.16 mg × 2 / day', notes: 'Split AM / pre-training' },
      frequency: '1–2× daily',
      cycleDays: '14–30 on / 14 off',
      sourceNotes: 'SC bioavailability ~2.5× intranasal — total daily dose reduced accordingly.',
    },
    intranasal: {
      beginner:     { male: '0.25 mg / day (250 mcg)',      female: '0.2 mg / day (200 mcg)' },
      intermediate: { male: '0.5 mg / day (500 mcg)',       female: '0.4 mg / day (400 mcg)' },
      advanced:     { male: '0.75 mg / day (750 mcg)',      female: '0.6 mg / day (600 mcg)' },
      athlete:      { male: '0.5 mg × 2 / day (500 mcg ×2)', female: '0.4 mg × 2 / day (400 mcg ×2)', notes: 'Split AM / pre-training' },
      frequency: '1–2× daily, morning ± pre-stress',
      cycleDays: '14–30 on / 14 off',
      sourceNotes: 'Kozlovskaya et al. (2003); Medvedev et al. (2015). Female column extrapolated (~80%).',
    },
  },

  semax: {
    routeGuidance:
      'Semax works both intranasally (primary clinical route) and subcutaneously. SC gives faster onset for acute nootropic use.',
    subcutaneous: {
      beginner:     { male: '0.1 mg / day',        female: '0.08 mg / day' },
      intermediate: { male: '0.25 mg / day',       female: '0.2 mg / day' },
      advanced:     { male: '0.4 mg / day',        female: '0.32 mg / day' },
      athlete:      { male: '0.25 mg × 2 / day',   female: '0.2 mg × 2 / day' },
      frequency: '1–2× daily',
      cycleDays: '30–90 on / 14 off',
      sourceNotes: 'SC route less common; dose reduced ~3× vs intranasal.',
    },
    intranasal: {
      beginner:     { male: '0.3 mg / day (300 mcg)',       female: '0.25 mg / day (250 mcg)' },
      intermediate: { male: '0.6 mg / day (600 mcg)',       female: '0.5 mg / day (500 mcg)' },
      advanced:     { male: '0.9 mg / day (900 mcg)',       female: '0.75 mg / day (750 mcg)' },
      athlete:      { male: '0.6 mg × 2 / day (600 mcg ×2)', female: '0.5 mg × 2 / day (500 mcg ×2)', notes: 'AM + pre-training' },
      frequency: '1–2× daily',
      cycleDays: '30–90 on / 14 off',
      sourceNotes: 'Ashmarin et al.; Gusev & Skvortsova (2011). Female column extrapolated.',
    },
  },

  'na-selank-amidate': {
    routeGuidance:
      'N-Acetyl Selank Amidate is stabilized — longer half-life allows lower / less frequent dosing on either route.',
    subcutaneous: {
      beginner:     { male: '0.06 mg / day',       female: '0.05 mg / day' },
      intermediate: { male: '0.12 mg / day',       female: '0.1 mg / day' },
      advanced:     { male: '0.2 mg / day',        female: '0.16 mg / day' },
      athlete:      { male: '0.12 mg × 2 / day',   female: '0.1 mg × 2 / day' },
      frequency: '1–2× daily',
      cycleDays: '21–30 on / 14 off',
    },
    intranasal: {
      beginner:     { male: '0.15 mg / day (150 mcg)',      female: '0.12 mg / day (120 mcg)' },
      intermediate: { male: '0.3 mg / day (300 mcg)',       female: '0.25 mg / day (250 mcg)' },
      advanced:     { male: '0.5 mg / day (500 mcg)',       female: '0.4 mg / day (400 mcg)' },
      athlete:      { male: '0.3 mg × 2 / day (300 mcg ×2)', female: '0.25 mg × 2 / day (250 mcg ×2)' },
      frequency: '1× daily (2× under load)',
      cycleDays: '21–30 on / 14 off',
      sourceNotes: 'Extended half-life vs Selank — approx. 0.6× dose parity.',
    },
  },

  'na-semax-amidate': {
    routeGuidance:
      'N-Acetyl Semax Amidate is stabilized — longer duration allows lower / less frequent dosing.',
    subcutaneous: {
      beginner:     { male: '0.06 mg / day',       female: '0.05 mg / day' },
      intermediate: { male: '0.12 mg / day',       female: '0.1 mg / day' },
      advanced:     { male: '0.2 mg / day',        female: '0.16 mg / day' },
      athlete:      { male: '0.12 mg × 2 / day',   female: '0.1 mg × 2 / day' },
      frequency: '1–2× daily',
      cycleDays: '30–90 on / 14 off',
    },
    intranasal: {
      beginner:     { male: '0.15 mg / day (150 mcg)',      female: '0.12 mg / day (120 mcg)' },
      intermediate: { male: '0.3 mg / day (300 mcg)',       female: '0.25 mg / day (250 mcg)' },
      advanced:     { male: '0.5 mg / day (500 mcg)',       female: '0.4 mg / day (400 mcg)' },
      athlete:      { male: '0.3 mg × 2 / day (300 mcg ×2)', female: '0.25 mg × 2 / day (250 mcg ×2)' },
      frequency: '1× daily',
      cycleDays: '30–90 on / 14 off',
    },
  },

  dsip: {
    routeGuidance:
      'DSIP is dosed subcutaneously (most common) or intranasally. SC is preferred for sleep protocols; intranasal for stress attenuation.',
    subcutaneous: {
      beginner:     { male: '0.1 mg pre-sleep',    female: '0.08 mg pre-sleep' },
      intermediate: { male: '0.2 mg pre-sleep',    female: '0.16 mg pre-sleep' },
      advanced:     { male: '0.3 mg pre-sleep',    female: '0.25 mg pre-sleep' },
      athlete:      { male: '0.2 mg pre-sleep',    female: '0.16 mg pre-sleep', notes: 'Recovery block only' },
      frequency: 'Nightly, 30–60 min before bed',
      cycleDays: '5 on / 2 off — up to 8 weeks',
    },
    intranasal: {
      beginner:     { male: '0.2 mg / day (200 mcg)',       female: '0.16 mg / day (160 mcg)' },
      intermediate: { male: '0.4 mg / day (400 mcg)',       female: '0.32 mg / day (320 mcg)' },
      advanced:     { male: '0.6 mg / day (600 mcg)',       female: '0.48 mg / day (480 mcg)' },
      athlete:      { male: '0.4 mg × 2 / day (400 mcg ×2)', female: '0.32 mg × 2 / day (320 mcg ×2)' },
      frequency: 'Evening ± acute stress',
      cycleDays: '4 weeks on / 2 off',
    },
  },

  oxytocin: {
    routeGuidance:
      'Oxytocin is short-acting — intranasal is standard for behavioral / bonding effects; SC used for milk let-down and off-label protocols.',
    subcutaneous: {
      beginner:     { male: '2 IU / day',       female: '2 IU / day' },
      intermediate: { male: '5 IU / day',       female: '5 IU / day' },
      advanced:     { male: '10 IU / day',      female: '10 IU / day' },
      athlete:      { male: '5 IU pre-event',   female: '5 IU pre-event' },
      frequency: '1× daily',
      cycleDays: 'Short cycles (≤ 2 weeks)',
      sourceNotes: 'SC bioavailability ~4× intranasal — dose reduced accordingly.',
    },
    intranasal: {
      beginner:     { male: '10 IU / day',      female: '8 IU / day' },
      intermediate: { male: '20 IU / day',      female: '16 IU / day' },
      advanced:     { male: '40 IU / day',      female: '32 IU / day' },
      athlete:      { male: '20 IU pre-event',  female: '16 IU pre-event' },
      frequency: '1–2× daily as needed',
      cycleDays: 'Acute or 2–4 weeks continuous',
      sourceNotes: 'MacDonald & MacDonald (2010) intranasal social protocols.',
    },
  },

  pt141: {
    routeGuidance:
      'PT-141 (Bremelanotide) — SC is the FDA-approved route (Vyleesi). Intranasal is the older Palatin formulation, still used off-label.',
    subcutaneous: {
      beginner:     { male: '0.5 mg pre-activity',  female: '0.5 mg pre-activity' },
      intermediate: { male: '1.0 mg pre-activity',  female: '1.0 mg pre-activity' },
      advanced:     { male: '1.75 mg pre-activity', female: '1.75 mg pre-activity', notes: 'FDA cap for HSDD indication' },
      athlete:      { male: '1.0 mg pre-activity',  female: '1.0 mg pre-activity' },
      frequency: '45 min before activity, max 1× / 24 h, ≤ 8× / month',
      cycleDays: 'PRN; assess after 8 weeks',
      sourceNotes: 'Vyleesi label; RECONNECT trial (Simon 2019).',
    },
    intranasal: {
      beginner:     { male: '5 mg pre-activity',    female: '4 mg pre-activity' },
      intermediate: { male: '10 mg pre-activity',   female: '7.5 mg pre-activity' },
      advanced:     { male: '15 mg pre-activity',   female: '10 mg pre-activity' },
      athlete:      { male: '10 mg pre-activity',   female: '7.5 mg pre-activity' },
      frequency: '30–60 min before activity, PRN',
      cycleDays: 'PRN',
      sourceNotes: 'Legacy Palatin intranasal formulation — ~10× SC due to low nasal bioavailability.',
    },
  },

  kisspeptin: {
    routeGuidance:
      'Kisspeptin-10 is dosed subcutaneously in research; intranasal is used experimentally for HPG-axis stimulation.',
    subcutaneous: {
      beginner:     { male: '0.05 mg / day',       female: '0.04 mg / day' },
      intermediate: { male: '0.1 mg / day',        female: '0.08 mg / day' },
      advanced:     { male: '0.2 mg / day',        female: '0.15 mg / day' },
      athlete:      { male: '0.1 mg × 2 / day',    female: '0.08 mg × 2 / day' },
      frequency: '1–2× daily',
      cycleDays: '4 weeks on / 4 off',
      sourceNotes: 'Dhillo et al. (Imperial College) clinical studies.',
    },
    intranasal: {
      beginner:     { male: '0.2 mg / day (200 mcg)',       female: '0.16 mg / day (160 mcg)' },
      intermediate: { male: '0.4 mg / day (400 mcg)',       female: '0.32 mg / day (320 mcg)' },
      advanced:     { male: '0.6 mg / day (600 mcg)',       female: '0.48 mg / day (480 mcg)' },
      athlete:      { male: '0.4 mg × 2 / day (400 mcg ×2)', female: '0.32 mg × 2 / day (320 mcg ×2)' },
      frequency: '1–2× daily',
      cycleDays: '4 weeks on / 4 off',
      sourceNotes: 'Experimental; low intranasal bioavailability — dose ~4× SC.',
    },
  },

  vip: {
    routeGuidance:
      'VIP has short plasma half-life — intranasal preferred for CNS effects, SC for systemic anti-inflammatory protocols.',
    subcutaneous: {
      beginner:     { male: '0.05 mg / day',    female: '0.05 mg / day' },
      intermediate: { male: '0.1 mg / day',     female: '0.1 mg / day' },
      advanced:     { male: '0.2 mg / day',     female: '0.2 mg / day' },
      athlete:      { male: '0.1 mg / day',     female: '0.1 mg / day' },
      frequency: '1× daily',
      cycleDays: '4–8 weeks',
    },
    intranasal: {
      beginner:     { male: '0.025 mg / spray, 1× day (25 mcg)', female: '0.025 mg / spray, 1× day (25 mcg)' },
      intermediate: { male: '0.05 mg × 4 / day (50 mcg ×4)',      female: '0.05 mg × 4 / day (50 mcg ×4)' },
      advanced:     { male: '0.05 mg × 6 / day (50 mcg ×6)',      female: '0.05 mg × 6 / day (50 mcg ×6)' },
      athlete:      { male: '0.05 mg × 4 / day (50 mcg ×4)',      female: '0.05 mg × 4 / day (50 mcg ×4)' },
      frequency: '4× daily titration (Shoemaker protocol)',
      cycleDays: 'Titrate over weeks; long-term maintenance',
      sourceNotes: 'Shoemaker CIRS intranasal titration protocol.',
    },
  },

  p21: {
    routeGuidance:
      'P21 (Cerebrolysin-derived) — intranasal for cognitive/neuroprotective use; SC for systemic BDNF elevation.',
    subcutaneous: {
      beginner:     { male: '0.5 mg / day',     female: '0.4 mg / day' },
      intermediate: { male: '1 mg / day',       female: '0.8 mg / day' },
      advanced:     { male: '1.5 mg / day',     female: '1.2 mg / day' },
      athlete:      { male: '1 mg × 2 / day',   female: '0.8 mg × 2 / day' },
      frequency: '1–2× daily',
      cycleDays: '30 on / 14 off',
    },
    intranasal: {
      beginner:     { male: '1 mg / day',       female: '0.8 mg / day' },
      intermediate: { male: '2 mg / day',       female: '1.6 mg / day' },
      advanced:     { male: '3 mg / day',       female: '2.5 mg / day' },
      athlete:      { male: '2 mg × 2 / day',   female: '1.6 mg × 2 / day' },
      frequency: '1–2× daily',
      cycleDays: '30 on / 14 off',
    },
  },
};

export function getRouteDosing(peptideId: string): RouteDosing | undefined {
  return ROUTE_DOSING[peptideId];
}

export function getAvailableRoutes(peptideId: string): DoseRoute[] {
  const rd = ROUTE_DOSING[peptideId];
  if (!rd) return [];
  const out: DoseRoute[] = [];
  // SubQ first — it's the dominant route in this catalog and users expect
  // mg/units dosing by default. Intranasal remains one tap away.
  if (rd.subcutaneous) out.push('subcutaneous');
  if (rd.intranasal) out.push('intranasal');
  return out;
}

export function getDoseCell(
  peptideId: string,
  route: DoseRoute,
  tier: ExperienceTier,
  sex: Sex,
): DoseCell | undefined {
  const table = ROUTE_DOSING[peptideId]?.[route];
  if (!table) return undefined;
  return table[tier];
}
