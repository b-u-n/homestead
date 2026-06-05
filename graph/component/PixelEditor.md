---
schema_version: 2
id: component/PixelEditor
type: component
title: PixelEditor
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/PixelEditor.js
belongs_to:
  - concept/pixelpals
source_doc:
  - doc/pixelpals
---

## Purpose

Reusable pixel-grid editor primitive. Used inside `PixelPalsCanvas` but extracted as its own component so it can be embedded in other surfaces (small previews, in-activity editors). Owns the pixel array, tool state, undo, and draw-event emission contract.

## Notes

The symmetry-phantom render (10% opacity ghost of horizontal mirror) lives here, as does the touched-pixels bookkeeping that powers the credit system. See [[spec/pixelpals-credit-system]] R1–R3 for the per-stroke accounting rules.
