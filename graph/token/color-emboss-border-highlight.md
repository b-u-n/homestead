---
schema_version: 2
id: token/color-emboss-border-highlight
type: token
title: Color — Emboss Border Highlight (top-left)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/emboss
---

## Value

`rgba(255, 255, 255, 0.5)`

## Usage

Top and left border color on the inner emboss-border overlay View used by `MinkyPanel`, `ButtonBase`, `AvatarStamp`, and `Modal` close/back buttons. Simulates light hitting the element from the top-left, paired with `token/color-emboss-border-shadow` on the bottom-right.

## Notes

Only `md/EMBOSS.md` carries this value canonically. Increasing to `0.7` produces a stronger emboss.
