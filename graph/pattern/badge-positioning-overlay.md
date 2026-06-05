---
schema_version: 2
id: pattern/badge-positioning-overlay
type: pattern
title: Badge Positioning Overlay
status: stable
last_audited: 2026-05-22
tags: [ui-pattern, badges]
source_doc:
  - doc/badges
references:
  - spec/badge-styling-pattern
---

## Pattern

A small `MinkyPanel`-styled element positioned absolutely on a parent's top-right corner. Three structural pieces:

1. **Wrapper view** — `position: 'relative'`, `overflow: 'visible'`, `marginTop: 8`, `marginRight: 8`.
2. **Badge container** — `position: 'absolute'`, `top: -8`, `right: -8`, `zIndex: 10`.
3. **Badge body** — `MinkyPanel` with `borderRadius: 6`, `padding: 4`, `paddingTop: 4`, variant-specific `overlayColor`, containing a row-flow `View` with `gap: 4` and `alignItems: 'center'`.

The negative-offset positioning is what gives the badge its "pinned-on overlay" feel; the wrapper margins are what keep the protruding badge from being clipped or overlapping siblings.

## When to use

- Display a count/status/indicator that augments a card without changing its layout
- Five concrete variants: Hearts, First Response, Bounty, Notification, Quantity (see `spec/badge-styling-pattern`)
- Whenever a component needs to surface a "+N" or "active state" cue at the corner of a tile

## Notes

Not a shared component (yet) — each owning component (`RespondToPost`, `ViewPost`, `NotificationHeart`, `InventoryScreen`, `KnapsackIcon`) renders its own badge inline using this pattern. A future refactor could extract a `<Badge variant="..." />` wrapper. Until then, this pattern node is the canonical reference.
