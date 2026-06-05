---
schema_version: 2
id: component/InventoryScreen
type: component
title: InventoryScreen
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/screens/InventoryScreen.js
belongs_to:
  - concept/items-inventory
  - concept/badge-system
follows:
  - pattern/badge-positioning-overlay
uses:
  - component/InventoryStore
source_doc:
  - doc/items
  - doc/badges
---

## Purpose

The user-facing inventory screen. Renders all portable items (from `InventoryStore`) as a grid of tiles, each with a Quantity Badge in the top-right corner showing the held count. Tapping a tile opens the relevant detail / editor (e.g., `PixelSketchEditor` for sketches).

## Notes

Canonical instance of the Quantity Badge variant in `spec/badge-styling-pattern`.
