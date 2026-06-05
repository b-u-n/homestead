---
schema_version: 2
id: pattern/stitched-checkbox-indicator
type: pattern
title: Stitched Checkbox Indicator (22×22 dashed box)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/buttons
  - doc/checkboxes
references:
  - token/color-border-dashed
  - token/color-border-stitched-focused
---

## Pattern

A 22×22 square with `borderRadius: 4`, 2px **dashed** border using `token/color-border-dashed` (unchecked) or `token/color-border-stitched-focused` (checked). Fill: `rgba(255, 255, 255, 0.3)` unchecked, `rgba(255, 255, 255, 0.65)` checked. When checked, contains a `✓` glyph (`✓`) in dark text. Has its own `Pressable` with `stopPropagation` when it sits inside a larger expand-toggle panel (the `Checkbox` primitive case).

## When to use

Any checklist-style item that needs a visual checkbox affordance. Used directly in `frontend/components/primitives/Checkbox.js`, in `ChecklistAssessmentStep.js`, and in `WorkbookLanding.js`. Prefer this over a literal native checkbox glyph — keeps the textile aesthetic consistent.

## Notes

Distinct from `pattern/focused-stitched-border`, which swaps a *whole-button* border. This pattern is the small leftmost indicator. The two coexist: a `Checkbox` primitive row has both — a stitched indicator (this pattern) on the left, and the surrounding `MinkyPanel` whose overlay color swaps between selected/unselected blues.
