---
schema_version: 2
id: token/color-emboss-content-text
type: token
title: Color — Content Text Emboss (subtle white shadow)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/art-style
  - doc/checkboxes
---

## Value

`rgba(255, 255, 255, 0.35)`

Applied as:
```
textShadowColor: 'rgba(255, 255, 255, 0.35)'
textShadowOffset: { width: 0, height: 1 }
textShadowRadius: 1
```

## Usage

The subtler emboss for body text, titles, and labels on content panels (not inside buttons). Per `md/ART_STYLE.md`: "Content text emboss should be on all Comfortaa body text in StyleSheet definitions." Also used on `Checkbox` title text.

## Notes

Pairs with `token/color-emboss-button-text` (stronger, used inside buttons). Two-level emboss system: 0.35 for content, 0.62 for buttons.
