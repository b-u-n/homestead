---
schema_version: 2
id: token/font-button-minky
type: token
title: Font — Minky Button Label
status: drifting
last_audited: 2026-05-22
source_doc:
  - doc/buttons
---

## Value

**Disputed.** `md/BUTTONS.md` (line 84): "minky: Comfortaa font". `frontend/components/ButtonBase.js` (line 25): `fontFamily: Typography.fonts.superStitch` for the minky textStyle as well.

See [[drift/fonts-button-label-divergence]].

## Usage

The font auto-applied (via context) to text inside a `MinkyButton` when imported as `import MinkyButton, { Text } from '../components/MinkyButton'`.

## Notes

Code reality (SuperStitch) and doc claim (Comfortaa) diverge. Resolution pending.
