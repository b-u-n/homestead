---
schema_version: 2
id: token/color-overlay-blue-scrollbar-selected
type: token
title: Color — Scrollbar Blue (selected/checked state)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/art-style
  - doc/checkboxes
---

## Value

`rgba(135, 180, 210, 0.55)`

## Usage

Selected/checked-state panel overlay for `Checkbox` (when `checked === true`) and the original scrollbar selected state in `md/ART_STYLE.md`. The deeper, more saturated blue of a "yes, this one" affordance.

## Notes

Same value used in two surfaces — checkbox and scrollbar — by design. Pairs with `token/color-overlay-blue-scrollbar-unselected`.
