# Fix Semax/Selank dosing display + mobile tap targets

## Problem
1. Peptide entity + Dosage screen show Semax/Selank only in **mcg** and users can't tell the SubQ dose in **mg/units** — even though `ROUTE_DOSING` already contains a `subcutaneous` table, its values are also in mcg, so the SubQ tab looks like "just more intranasal numbers".
2. Project standard (Core memory) is: **mg, IU, or units only — never mcg.**
3. Mobile users report unclickable CTAs on the dosing card: the route toggle (36px), sex toggle (32px), and tier chips are below the 44px minimum, and the whole card is narrow on 360px screens.

## Changes

### 1. `src/data/dosingRoutes.ts` — mg-first for SubQ, mg + mcg reference for intranasal
Rewrite the Semax, Selank, NA-Selank-Amidate, NA-Semax-Amidate (and any other mcg-only entries: DSIP, Oxytocin, PT-141, Kisspeptin, VIP, P21 where applicable) so every `DoseCell.male/female` string is expressed in **mg** as the primary unit, with the mcg equivalent appended in parentheses for intranasal micro-doses only.

Examples:
- Selank SubQ intermediate male: `0.2 mg / day` (was `200 mcg / day`)
- Selank intranasal intermediate male: `0.5 mg / day (500 mcg)`
- Semax SubQ athlete male: `0.25 mg × 2 / day`
- Semax intranasal beginner: `0.3 mg / day (300 mcg)`

Update the file header comment to reflect the mg-first rule and remove the "mcg allowed" carve-out. Update `sourceNotes` where they reference mcg. Keep frequencies/cycle strings untouched.

### 2. `src/components/dosage/DosingSchedule.tsx` — SubQ-first default + mg/units helper + bigger touch targets
- When both routes exist, default the selected route to **subcutaneous** (users complained SubQ was hidden). Intranasal remains one tap away.
- Under each active tier cell, render a small "≈ X units (U-40)" line by feeding the parsed dose through the existing `parseDose` + `convertDose` helpers from `src/lib/doseMath.ts` (same pattern as `RecommendedDoseDisplay`). Skip the units line for intranasal (no syringe).
- Raise minimum tap sizes to meet the 44px rule from Core memory:
  - Route tabs: `min-h-[44px]`, `px-3`, larger icon + label
  - Sex tabs: `min-h-[44px]`, `px-3`
  - Tier cards: `min-h-[80px]` and full-width tap area (already button, just enlarge)
- Add `touch-manipulation` class to all interactive elements to remove the 300ms tap delay on iOS.
- Ensure the card lays out cleanly at 360px: switch tier grid to `grid-cols-2` on mobile (already), but reduce inner padding on `<sm` so nothing overflows.

### 3. Peptide entity + Dosage screen — no logic changes
`PeptideEntityPage` and `DosageScreen` already mount `<DosingSchedule>` when routes exist. They pick up the SubQ-first default automatically. No changes required beyond a quick visual verification.

### 4. Verify with typecheck
Run `tsgo` after edits — nothing else to test since this is a pure data + presentation change.

## Files touched
- `src/data/dosingRoutes.ts` (data rewrite, mcg → mg)
- `src/components/dosage/DosingSchedule.tsx` (default route, units line, 44px targets)

## Out of scope (not requested)
- No changes to intranasal-only peptides that legitimately have no SubQ route
- No changes to Daily Log, cycle scheduler, or reminder logic
- No broader mobile audit beyond the dosing card the user pointed to
