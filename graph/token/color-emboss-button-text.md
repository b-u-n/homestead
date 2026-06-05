---
schema_version: 2
id: token/color-emboss-button-text
type: token
title: Color — Button Text Emboss (white text shadow)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/emboss
  - doc/buttons
  - doc/art-style
  - doc/colors
---

## Value

`rgba(255, 255, 255, 0.62)`

Applied as:
```
textShadowColor: 'rgba(255, 255, 255, 0.62)'
textShadowOffset: { width: 0, height: 1 }
textShadowRadius: 1
```

## Usage

White text shadow applied to text inside `WoolButton` / `MinkyButton` for the raised/embossed look. Handled automatically by `ButtonBase` — do not apply manually on button labels. Also used by `MinkyPanel` description text on colored ground (per `md/EMBOSS.md` "Text on Colored Panels").

## Notes

Four source docs all agree on this value verbatim — the most-corroborated emboss value in the system. No drift.
