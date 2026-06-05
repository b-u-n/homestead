---
schema_version: 2
id: component/StitchedBorder
type: component
title: StitchedBorder
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/StitchedBorder.js
belongs_to:
  - concept/vaporwave-aesthetic
source_doc:
  - doc/art-style
  - doc/buttons
  - doc/emboss
---

## Purpose

The dashed-border component that produces the hand-stitched line treatment used by `MinkyPanel`, `ButtonBase` (and through it `WoolButton`/`MinkyButton`), and the `Checkbox` indicator. Default color: `token/color-border-dashed`. Switches to `token/color-border-stitched-focused` (white) when the parent indicates a focused/selected state.

## Notes

`md/ART_STYLE.md` rule on dashed borders: "always dashed, never solid." This component is the single implementation of that rule. Other clusters (panel-modal-scroll) may also touch this component — owned here per `md/EMBOSS.md` and `md/BUTTONS.md` both treating it as the canonical stitched-line primitive.
