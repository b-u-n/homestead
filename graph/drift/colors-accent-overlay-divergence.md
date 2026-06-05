---
schema_version: 2
id: drift/colors-accent-overlay-divergence
type: drift
title: Accent overlay colors diverge (green & coral)
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/MinkyPanel
  - component/ButtonBase
source_doc:
  - doc/colors
  - doc/art-style
  - doc/buttons
---

## Symptom

Two docs give different rgba values for the green and coral overlay tints:

| Variant | md/COLORS.md (line 22-23)            | md/ART_STYLE.md (line 19-20)     |
|---------|--------------------------------------|----------------------------------|
| Green   | `rgba(110, 200, 130, 0.32)`          | `rgba(76, 175, 80, 0.3)`         |
| Coral   | `rgba(255, 160, 130, 0.35)`          | `rgba(255, 111, 97, 0.3)`        |

`COLORS.md` lists these under "Button Overlay Colors (ButtonBase variants)" — i.e. the button system canonical values. `ART_STYLE.md` lists them in the broader palette section without specifying context. Possible that they're *intentionally* different (button-overlay vs panel-overlay) and the docs just don't make that explicit — but if so, the distinction needs to be in the docs as a structural note, not implicit.

## Resolution

**Investigation needed.** Before resolving, check whether `MinkyPanel` actually renders green/coral overlays anywhere in the app. If not, the values in `ART_STYLE.md` are an aesthetic suggestion never adopted in code — delete them from the doc, keep the button variants in `COLORS.md`. If both contexts exist, split into two named tokens (`token/color-overlay-green-panel` and `token/color-overlay-green-button`) and update both docs to make the distinction explicit.

## Audit log

| Date       | Agent          | Note                                                            |
|------------|----------------|-----------------------------------------------------------------|
| 2026-05-22 | claude (init)  | Drift recorded during graph bootstrap. Resolution needs code grep before deciding. |
| 2026-05-22 | claude (button cluster) | Code reality (ButtonBase variant overlays) matches `md/COLORS.md` verbatim: green `rgba(110, 200, 130, 0.32)`, coral `rgba(255, 160, 130, 0.35)`. `md/ART_STYLE.md` values are not rendered anywhere. Recommendation: adopt `COLORS.md`, edit `ART_STYLE.md` to match. Captured as `token/color-overlay-green-button` and `token/color-overlay-coral-button` (status: drifting). |
