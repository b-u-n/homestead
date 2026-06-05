---
schema_version: 2
id: token/color-primary-text
type: token
title: Color — Primary Text
status: drifting
last_audited: 2026-05-22
source_doc:
  - doc/colors
  - doc/art-style
---

## Value

`#403F3E` (per `md/COLORS.md`).

**Disputed.** `md/ART_STYLE.md` gives `#2D2C2B` for the same role. See [[drift/colors-primary-text-conflict]] — the value above is what most components currently render with; the disputed value is the more recent / aesthetic-led suggestion. Resolution pending.

## Usage

The default text color for any non-button, non-muted text rendered on a `MinkyPanel` or other content surface. Components apply this via direct hex literal today (see drift node for instances). Once R1 of `spec/design-tokens` is enforced everywhere, components reference this token rather than inlining the hex.

## Notes

`status: drifting` is the conventional indicator that this token's value is currently in conflict between two source documents. Do not pick one and move on — open [[drift/colors-primary-text-conflict]], resolve there, then update this token's value if the resolution chose `#2D2C2B`.
