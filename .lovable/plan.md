# Visual Syringe Guide for Dosing

Add a drawn insulin syringe to the dosing section so users can see exactly how far to draw up for their dose — e.g. 1 mg = 8 units, 4 mg = 32 units on a U-40 syringe.

## What the user sees

A horizontal insulin syringe illustration (barrel, plunger, needle) with:
- Printed graduation marks and numbers along the barrel (0–40 for U-40, 0–100 for U-100)
- The liquid fill animating to the exact unit mark for the current dose
- A marker line and label at the draw point: "8 units"
- A caption underneath: "1 mg = 8 units (U-40) · 0.20 mL @ 5 mg/mL"
- A U-40 / U-100 toggle that redraws the barrel scale and recalculates units
- A small strip of quick presets (e.g. 0.25 / 0.5 / 1 / 2 / 4 mg) — tapping one animates the plunger to that dose
- A warning state when the dose exceeds the syringe capacity ("Exceeds 40 units — split into 2 injections")

Mobile first: full-width SVG that scales down to 360 px, tap targets at least 44 px, no horizontal scroll.

## Where it appears

1. Dosage screen — inside the expanded peptide's dosing panel, directly under the Dosing Schedule.
2. Insulin Needle Guide (used in My Stack / Daily Log) — replaces the current numbers-only quick-reference strip header with the syringe visual on top, keeping the existing table below.

## Technical notes

- New component `src/components/dosage/SyringeVisual.tsx`: props `doseMg`, `mgPerMl`, `syringe` ('U-40' | 'U-100'), optional `onSyringeChange`. Pure presentational SVG, no data fetching.
- Unit math reuses `resolveConcentration` and `convertDose` from `src/lib/doseMath.ts` — no new math logic, no mcg anywhere.
- Colors use existing semantic tokens (`--primary`, `--muted`, `--border`); no hardcoded color classes.
- Plunger fill animated with Framer Motion (`width`/`x` spring), matching the app's existing motion style.
- Wired into `src/screens/DosageScreen.tsx` (below `DosingSchedule`) and `src/components/doses/InsulinNeedleGuide.tsx`.
- Concentration defaults to the stored vial size where available, otherwise the existing 10 mg + 2 mL = 5 mg/mL fallback, and the assumption is stated in the caption.
