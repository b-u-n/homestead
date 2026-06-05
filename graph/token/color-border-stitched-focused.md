---
schema_version: 2
id: token/color-border-stitched-focused
type: token
title: Color — Stitched Border (focused/selected white)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/buttons
  - doc/woolbuttons
  - doc/checkboxes
---

## Value

`rgba(255, 255, 255, 0.55)`

## Usage

White stitched border applied when a `WoolButton`/`MinkyButton` has `focused={true}` (selected state) or when a `Checkbox` indicator is checked. Replaces the default `token/color-border-dashed` to signal "this one is on".

## Notes

The single visual signal that distinguishes selected from unselected across button-toggle and checkbox surfaces.
