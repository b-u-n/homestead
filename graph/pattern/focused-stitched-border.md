---
schema_version: 2
id: pattern/focused-stitched-border
type: pattern
title: Focused State via Stitched Border Color Swap
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/buttons
  - doc/woolbuttons
references:
  - token/color-border-dashed
  - token/color-border-stitched-focused
---

## Pattern

A togglable surface uses the **same dashed stitched border** in two colors to signal selection:

- Unfocused / unselected: `token/color-border-dashed` (dark gray)
- Focused / selected: `token/color-border-stitched-focused` (white)

The overlay tint may also shift but the canonical signal is the border color. Driven by a `focused` (or `checked`) boolean prop on the component.

## When to use

Whenever a button doubles as a toggle option — radio scales, single-select choice lists, multi-select checklists implemented on top of `WoolButton`. Also used by `Checkbox` indicator to mark the checked state.

## Notes

The pattern is what enables `WoolButton focused={...}` to do double duty as a single-select option button (radio style) and a checkbox-style multi-select. See `md/BUTTONS.md` "Select & Option Patterns".
