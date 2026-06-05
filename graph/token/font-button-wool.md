---
schema_version: 2
id: token/font-button-wool
type: token
title: Font — Wool Button Label
status: drifting
last_audited: 2026-05-22
source_doc:
  - doc/buttons
  - doc/art-style
---

## Value

**Disputed.** Three source authorities give three answers:

- `md/BUTTONS.md` (lines 82–84): "wool: NeedleworkGood font"
- `md/ART_STYLE.md` (line 53): "SuperStitch — Headers, button labels"
- `frontend/components/ButtonBase.js` (line 14, 25): `fontFamily: Typography.fonts.superStitch` for both wool and minky textStyles

See [[drift/fonts-button-label-divergence]].

## Usage

The font auto-applied (via context) to text inside a `WoolButton` (and the deprecated `VaporwaveButton` alias) when imported as `import WoolButton, { Text } from '../components/WoolButton'`.

## Notes

Code currently renders SuperStitch despite BUTTONS.md naming NeedleworkGood. Resolution pending in drift node.
