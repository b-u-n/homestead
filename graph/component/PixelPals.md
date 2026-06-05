---
schema_version: 2
id: component/PixelPals
type: component
title: PixelPals
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/PixelPals.js
belongs_to:
  - concept/games
uses:
  - component/FlowEngine.frontend
  - component/MinkyPanel
source_doc:
  - doc/games
  - doc/pixelpals
---

## Purpose

Wrapper component for the Pixel Pals game. Wraps `FlowEngine` with the Pixel Pals flow definition, which opts into `size: 'fullscreen'` for an edge-to-edge canvas. The game has four modes (Free, Chain, Daily Drop, Live Canvas), shared or personal boards, and a Bazaar-submission pipeline for completed boards.

## Notes

Color wheels in the UI use `MinkyPanel` with `shape="circular"` for a circular stitched-textile backing (per `spec/games-flow-fullscreen` R4). Completed shared boards auto-submit to the Bazaar shop with `participantIds` recorded so contributors get a 3-heart discount (`spec/item-portability-and-inventory` R6).
