---
schema_version: 2
id: token/color-overlay-purple-button
type: token
title: Color — Purple Overlay (Button variant)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/colors
  - doc/buttons
---

## Value

`rgba(78, 78, 188, 0.27)`

## Usage

Overlay tint for `ButtonBase` variant `purple` — applied to `WoolButton`/`MinkyButton` when `variant="purple"`. Distinct from the **panel** purple overlay `rgba(112, 68, 199, 0.2)` used by `MinkyPanel`; the button purple is bluer and slightly more opaque so it reads on the wool/minky texture.

## Notes

Two separate purples coexist on purpose: panel purple is decorative tint; button purple is the saturated tap target. Do not unify without an explicit design decision — see `md/COLORS.md` "Button Overlay Colors" table.
