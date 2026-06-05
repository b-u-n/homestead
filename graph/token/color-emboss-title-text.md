---
schema_version: 2
id: token/color-emboss-title-text
type: token
title: Color — Title Text Emboss (strong white shadow)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/colors
---

## Value

`rgba(255, 255, 255, 1)`

Applied as:
```
textShadowColor: 'rgba(255, 255, 255, 1)'
textShadowOffset: { width: 0, height: 2 }
textShadowRadius: 2
```

## Usage

The strongest emboss tier, used for titles only. Larger offset and radius than the content/button tiers produce a more pronounced letterpress effect.

## Notes

Only `md/COLORS.md` documents this third tier; `md/ART_STYLE.md` describes only two tiers (content + button). Possible doc drift but the value is concrete and used in practice — flagged for Phase 2 reconciliation.
