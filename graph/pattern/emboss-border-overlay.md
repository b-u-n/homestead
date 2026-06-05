---
schema_version: 2
id: pattern/emboss-border-overlay
type: pattern
title: Emboss Border Overlay (raised highlight + shadow)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/emboss
references:
  - token/color-emboss-border-highlight
  - token/color-emboss-border-shadow
---

## Pattern

An absolutely-positioned overlay `View` placed as the last child of a container, with `pointerEvents="none"`. The overlay has different border colors on its top-left vs bottom-right sides — light on top-left, dark on bottom-right — simulating directional light. Combined with an external `shadowColor: '#000'` drop shadow on the parent, the element reads as raised from the surface.

## When to use

Any reusable container that should feel physically raised: `MinkyPanel`, `ButtonBase` (via Wool/Minky), `AvatarStamp`, the close/back buttons inside `Modal`. NOT for flat informational chips or text — the effect needs a panel-sized surface to make sense.

## Notes

Parent must be `position: relative` and must not clip with `overflow: hidden` if the external drop shadow needs to show. Border radius on the overlay must match the parent's radius. Inverting the two border-color tokens produces an *inset* (sunken) effect — used for pressed states.
