# Dosing CTAs: bigger touch targets, clear feedback, accessibility

Make every tappable control in the syringe visual and the insulin needle guide easy to hit on a phone, obviously responsive when tapped, and usable with a keyboard or screen reader.

## Files

- `src/components/dosage/SyringeVisual.tsx` — U-40/U-100 toggle, mg preset chips, Reset button
- `src/components/doses/InsulinNeedleGuide.tsx` — expand/collapse header button, `SyringeTypeToggle` segmented control, calculator number inputs

## Changes

### Touch targets and spacing
- Raise all buttons from `min-h-[36px]` to `min-h-11` (44px) with wider horizontal padding and `min-w-11` where icon-sized.
- Preset chips and toggle segments get slightly larger gaps so neighbouring targets don't overlap.
- The needle guide's collapse header becomes a full-width 48px row; calculator inputs go from `h-8` to `h-11` so they're tappable and readable.

### Pressed / active / focus feedback
- Add `active:scale-[0.97]` plus a stronger background/border shift on press to every CTA, with `transition-transform`.
- Selected states get a bolder treatment: filled primary background on the active syringe segment, primary border + tinted fill + ring on the selected mg chip.
- Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to all buttons and inputs so keyboard focus is always visible.
- Keep `touch-manipulation` on all of them to remove the 300ms tap delay.

### Accessibility
- Syringe type toggles: wrap in `role="group"` with an `aria-label`, keep `aria-pressed`, and give each button a descriptive `aria-label` ("Use U-40 syringe scale").
- mg preset chips: `aria-pressed` for the selected dose plus `aria-label` such as "Set dose to 1 mg".
- Reset button: `aria-label="Reset to recommended dose"`.
- Needle guide header: `aria-expanded` and `aria-controls` pointing at the collapsible panel id.
- Calculator inputs: keep visible labels wired via `htmlFor`/`id` so the label is programmatically associated.
- Announce the computed draw-up result with an `aria-live="polite"` region so screen readers hear the units update when a preset or syringe type changes.
- All controls are native `<button>`/`<input>` elements, so Enter/Space keyboard activation works without extra handlers.

## Out of scope

No changes to dose math, concentration resolution, or the data those components read.
