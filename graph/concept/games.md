---
schema_version: 2
id: concept/games
type: concept
title: Games Parlor
status: stable
last_audited: 2026-05-22
kind: surface
source_doc:
  - doc/games
  - doc/pixelpals
---

## Overview

A room on the town square (left side, above the Bazaar) where players find collaborative and creative games. Games follow the standard flow pattern (room entity → wrapper component → FlowEngine → drop components → backend flow) but can opt into `size: 'fullscreen'` on the flow definition for an edge-to-edge canvas. The first inhabitant is Pixel Pals (collaborative pixel art with four game modes and a Bazaar submission pipeline).

## Notes

Anchor for `component/PixelPals` and future game wrappers. Game-completed boards and player sketches flow into the Bazaar shop pipeline (`concept/items-inventory` → `Sketch → Shop`); contributors get a 3-heart discount on purchase, tying this concept to `concept/heart-economy`. Full game-mode catalog lives in `md/pixelpals.md` per R6.
