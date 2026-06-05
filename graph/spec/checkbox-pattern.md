---
schema_version: 2
id: spec/checkbox-pattern
type: spec
title: Checkbox Pattern (selectable-with-examples)
status: stable
last_audited: 2026-05-22
tags: [activities, ui]
source_doc:
  - doc/checkboxes
governs:
  - component/Checkbox
references:
  - spec/design-tokens
  - spec/emboss-effect
  - token/color-overlay-blue-scrollbar-selected
  - token/color-overlay-blue-scrollbar-unselected
  - token/color-border-dashed
  - token/color-border-stitched-focused
  - token/color-emboss-content-text
  - token/color-emboss-button-text
  - pattern/stitched-checkbox-indicator
---

## Rules

### R1: A checkbox row has two independent tap zones — indicator (toggles check) and panel (toggles expand)

The 22×22 stitched indicator on the left is its own `Pressable` with `stopPropagation`; tapping it toggles `checked`. The surrounding blue `MinkyPanel` is a separate `Pressable`; tapping anywhere on it toggles the expand/collapse of the examples block.

**Why:** Users want to read examples before committing to a check. Combining both into one tap forces premature commitment or premature collapse.
**Evidence:** `md/CHECKBOXES.md` "Tap zones (important)" — the explicit design rationale.
**Test:** Tap the indicator — examples should NOT toggle. Tap the panel body — check should NOT toggle.

### R2: Selected state is signaled by overlay color shift + stitched border + indicator fill (all three)

Unchecked panel: `token/color-overlay-blue-scrollbar-unselected` (`rgba(100, 130, 195, 0.25)`). Checked panel: `token/color-overlay-blue-scrollbar-selected` (`rgba(135, 180, 210, 0.55)`) + a stitched border via `borderColor: rgba(92, 90, 88, 0.55)`. Indicator: white-filled with `✓` glyph when checked.

**Why:** Three reinforcing signals because the muted-blue ground is subtle on textured surfaces — single-signal selection is hard to read.
**Evidence:** `md/CHECKBOXES.md` "Anatomy" table.
**Test:** Visual diff between checked and unchecked rows.

### R3: 3 examples is the sweet spot — fewer feels thin, more crowds

Authoring rule for activity JSON authors: when supplying an `examples` array, target 3 first-person quote-style lines, each under ~70 characters. Omit `examples` entirely if the concept is self-evident (e.g. "Sleep worse") — the chevron auto-hides.

**Why:** Empirical authoring guideline from `md/CHECKBOXES.md`. The expanded panel renders cleanest with 3.
**Evidence:** `md/CHECKBOXES.md` "Examples (the voice block)" guidance.
**Test:** Manual content review at activity-authoring time.

### R4: Examples block uses a 2px purple left border, indent 14px, distinct from description prose

Per the anatomy table: `borderLeftColor: rgba(112, 68, 199, 0.45)`, 2px wide, 14px indent, 12px paddingLeft. Each example wrapped in curly quotes by the renderer (do not pre-quote in source JSON).

**Why:** Visually separates the abstract definition (description line) from the concrete instances (examples) so the user can scan one then drill into the other.
**Evidence:** `md/CHECKBOXES.md` "Anatomy" — Examples block row.
**Test:** Manual visual review.

### R5: Title is Comfortaa 700; description is Comfortaa 600 not-italic; examples are Comfortaa 600 not-italic, 15px scaled

Specifically NOT italic for description or examples — italics on textured ground reads as decorative rather than informational. Description gets `#1A1A19` near-black + stronger 0.62 white emboss because it must read on the muted-blue panel.

**Why:** Light grays disappear on the muted-blue ground; italics suggest "voice" but here voice is conveyed by quotation marks, not slant.
**Evidence:** `md/CHECKBOXES.md` "Anatomy" — Title, Description, Example line rows.
**Test:** Manual visual review.

### R6: Use the Checkbox primitive — do NOT roll a `WoolButton` with a checkmark glyph

The older "WoolButton with `✓` prefix in the label" pattern (`md/BUTTONS.md` Multi-Select example) reads as a tappable button, not a form control. `frontend/components/primitives/Checkbox.js` is the canonical primitive for new code.

**Why:** Per `md/CHECKBOXES.md` opening paragraph — the primitive was introduced specifically to replace the WoolButton-with-checkmark pattern.
**Evidence:** `md/CHECKBOXES.md` paragraph 2: "It replaces the older 'WoolButton with a checkbox glyph inside' pattern."
**Test:** Grep for `WoolButton` usages with a `✓` (`✓`) in the children — each is a candidate for migration to the `Checkbox` primitive.

## Notes

The legacy `WoolButton + ✓` multi-select pattern is still documented in `md/BUTTONS.md` "Multi-Select (Checkbox-Style)" — this is intentional for backwards compat with existing activities. New activities should use the `Checkbox` primitive (or `ChipMultiSelectTagGroup` with `rendering: "checkbox-list-vertical"`).
