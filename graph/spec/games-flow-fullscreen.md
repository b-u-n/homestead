---
schema_version: 2
id: spec/games-flow-fullscreen
type: spec
title: Games Parlor Flow & Fullscreen Mode
status: stable
last_audited: 2026-05-22
tags: [games, flows]
source_doc:
  - doc/games
  - doc/pixelpals
governs:
  - component/PixelPals
---

## Rules

### R1: Games are room entities with `flow: 'gameName'` that trigger their wrapper component

Each game in the Games Parlor is a room entity in `frontend/locations/rooms/games-parlor.js` with a `flow` string. Clicking the entity sets `setIsGameOpen(true)` for that game, which renders the wrapper component (e.g. `PixelPals`) that itself wraps `FlowEngine` with the game's flow definition.

**Why:** Same composition pattern as every other modal-flow surface (Wishing Well, Customization Table). Reusing the pattern keeps the door/entity wiring cheap.
**Evidence:** `md/games.md` Architecture; the same `flow:` string convention used in `md/CUSTOMIZATION.md`.
**Test:** Clicking the Pixel Pals entity opens the modal with the Pixel Pals flow.

### R2: Fullscreen flows opt in via `size: 'fullscreen'` on the flow definition

A flow definition may include a top-level `size: 'fullscreen'` field. `FlowEngine` falls back to this when a drop doesn't specify its own size. Fullscreen removes the modal title bar, sets 100% dimensions, no border radius, and shows only a small close button in the top-right corner.

**Why:** Some games (Pixel Pals' canvas, Live Canvas) need an edge-to-edge canvas. Putting the opt-in on the flow rather than each drop lets the entire game inherit the mode while still allowing per-drop overrides (e.g., the "create board" dialog uses `size: 'medium'`).
**Evidence:** `md/games.md` Fullscreen Flows section.
**Test:** Open Pixel Pals; modal fills the viewport with no title bar.

### R3: Individual drops MAY override flow-level size

If a drop sets its own `size`, that wins over `flowDefinition.size`. The Pixel Pals "create board" dialog uses `size: 'medium'` while the parent flow is `'fullscreen'`.

**Why:** Some sub-screens (config dialogs, confirmations) read better at modal size even inside a fullscreen game. Per-drop override is the escape hatch.
**Evidence:** `md/games.md` Fullscreen Flows section.
**Test:** Inside Pixel Pals (fullscreen), open the create-board dialog; it renders at medium size.

### R4: `MinkyPanel` supports a `shape="circular"` mode used by Pixel Pals color wheels

When `shape="circular"` is passed, `MinkyPanel` sets `borderRadius: 9999` and equal padding, giving a stitched textile backing for circular widgets like color wheels.

**Why:** Color wheels are circular; wrapping them in a square panel looks wrong. Adding the shape mode to `MinkyPanel` keeps the stitched-textile aesthetic consistent with the rest of the app.
**Evidence:** `md/games.md` MinkyPanel Circular Mode.
**Test:** Pixel Pals color wheel renders inside a circular stitched panel.

## Notes

This spec is small — Games Parlor is mostly a thin door + wrapper layer. The interesting per-game rules (Pixel Pals modes, board completion, Bazaar submission) live in `md/pixelpals.md` and would justify a dedicated `spec/pixel-pals` when that surface gets a graph cluster.
