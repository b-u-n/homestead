---
schema_version: 2
id: component/PixelSketchEditor
type: component
title: PixelSketchEditor
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/PixelSketchEditor.js
belongs_to:
  - concept/items-inventory
source_doc:
  - doc/items
---

## Purpose

The pixel-art editor drop used by the knapsack sketch flow (and the Pixel Pals game flow's personal-board mode). Lets the user paint a pixel grid stored as `data: { width, height, pixels }` on the item. Saves through `knapsack:items:update`, which triggers server-side PNG generation via `pixelImageService` (per `spec/item-portability-and-inventory` R4).

## Notes

The editor is responsible for the pixel-data side; the PNG side is entirely backend. The frontend never generates the PNG locally.
