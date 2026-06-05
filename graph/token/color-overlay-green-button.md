---
schema_version: 2
id: token/color-overlay-green-button
type: token
title: Color — Green Overlay (Button variant)
status: drifting
last_audited: 2026-05-22
source_doc:
  - doc/colors
  - doc/art-style
  - doc/buttons
---

## Value

`rgba(110, 200, 130, 0.32)` (per `md/COLORS.md` button-variant table; matches what `ButtonBase.js` renders).

**Disputed.** `md/ART_STYLE.md` gives `rgba(76, 175, 80, 0.3)` under the generic overlay palette. See [[drift/colors-accent-overlay-divergence]].

## Usage

Overlay tint for `ButtonBase` variant `green` — success / positive actions on `WoolButton`/`MinkyButton`.

## Notes

`md/BUTTONS.md` is silent on the literal hex, only naming "green" as a variant. The button-system context confirms `COLORS.md` is canonical for code; `ART_STYLE.md` value is an aesthetic suggestion never adopted.
