---
schema_version: 2
id: drift/fonts-button-label-divergence
type: drift
title: Button label font diverges three ways (BUTTONS vs ART_STYLE vs code)
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/ButtonBase
  - component/WoolButton
  - component/MinkyButton
  - token/font-button-wool
  - token/font-button-minky
source_doc:
  - doc/buttons
  - doc/art-style
---

## Symptom

Three authorities give three different answers for which font auto-applies to text inside a button:

| Source | Wool button text | Minky button text |
|--------|------------------|-------------------|
| `md/BUTTONS.md` (lines 82–84) | `NeedleworkGood` | `Comfortaa` |
| `md/ART_STYLE.md` (line 53) | `SuperStitch` (for "Headers, button labels") | (not specified) |
| `frontend/components/ButtonBase.js` (lines 14, 25) | `Typography.fonts.superStitch` | `Typography.fonts.superStitch` |

Code reality: both wool and minky textStyles use `superStitch`. The docs disagree with code AND with each other.

Compounded by `spec/design-tokens` R2 already noting that the broader font list disagrees between `CLAUDE.md` (`ChubbyTrail / PWDottedFont / Comfortaa`) and `md/ART_STYLE.md` (`SuperStitch / Comfortaa / NeedleworkGood / ChubbyTrail`). See [[drift/fonts-canonical-list-divergence]] (likely the parent of this drift).

## Resolution

**Investigation needed.** Code is currently winning by default — `SuperStitch` is what renders. Three options:

1. Adopt code reality: edit `md/BUTTONS.md` to say both wool and minky use SuperStitch. Lose the wool-vs-minky font distinction that `md/BUTTONS.md` paints as a feature.
2. Adopt `md/BUTTONS.md`: change `ButtonBase.js` to use `Typography.fonts.needleworkGood` for wool and `Typography.fonts.comfortaa` for minky. Restores the visual distinction; requires verifying both fonts are loaded.
3. Adopt `md/ART_STYLE.md`: keep code as-is (SuperStitch everywhere); update `md/BUTTONS.md` to remove the wool/minky font distinction.

Whichever is chosen, `token/font-button-wool` and `token/font-button-minky` then carry the canonical value and the docs converge.

## Audit log

| Date       | Agent                | Note                                                                 |
|------------|----------------------|----------------------------------------------------------------------|
| 2026-05-22 | claude (button cluster) | Drift discovered during /md/ → /graph/ migration for button cluster. Tied to existing [[drift/fonts-canonical-list-divergence]]. |
