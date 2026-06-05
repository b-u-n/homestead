---
schema_version: 2
id: pattern/emboss-text-shadow
type: pattern
title: Emboss Text Shadow (white letterpress)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/emboss
  - doc/art-style
  - doc/colors
references:
  - token/color-emboss-button-text
  - token/color-emboss-content-text
  - token/color-emboss-title-text
---

## Pattern

A 1px-offset white `textShadow` produces a soft letterpress look on dark text over textured/colored ground. Three tiers by intensity:

- **Content** (`token/color-emboss-content-text`, 0.35): default for Comfortaa body text on content panels.
- **Button** (`token/color-emboss-button-text`, 0.62): inside `WoolButton`/`MinkyButton`, applied automatically.
- **Title** (`token/color-emboss-title-text`, 1.0, 2px offset/radius): pronounced letterpress for titles.

## When to use

Any time text sits on a colored or textured ground (not flat-white surfaces). On flat backgrounds the shadow makes text look fuzzy; use only where there is texture or overlay to contrast against.

## Notes

Button emboss is applied automatically by `ButtonBase` (don't apply manually on button labels). Content emboss must be added explicitly to each StyleSheet body-text style per `md/ART_STYLE.md`.
