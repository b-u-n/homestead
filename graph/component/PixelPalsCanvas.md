---
schema_version: 2
id: component/PixelPalsCanvas
type: component
title: PixelPalsCanvas
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/PixelPalsCanvas.js
belongs_to:
  - concept/pixelpals
uses:
  - component/PixelEditor
  - component/ColorWheel
  - component/MinkyPanel
emits:
  - pixelPals:board:draw
  - pixelPals:player:status
handles:
  - pixelPals:board:pixelsUpdated
  - pixelPals:board:completed
source_doc:
  - doc/pixelpals
---

## Purpose

The main pixel-painting drop. Three responsive layout modes (Desktop, Mobile Landscape, Mobile Portrait) detected via `uxStore.isPortrait` and `containerSize` (from `onLayout`). Hosts the pixel grid, tools (Draw/Paint/Pick/Erase/Undo), 12-wheel color palette, color-wheel popup overlay, mini bitmap preview, and (on mobile) the navigable minimap with viewport indicator.

## Notes

Orientation-change handling: `containerSize` resets to `null` on `isPortrait` flip so the next render measures fresh dimensions before laying out. Mobile portrait/landscape use a global `touchmove` listener that handles wheel picking, dismissal, and manual scroll-through after `preventDefault`. See [[spec/pixelpals-game-modes]] for per-mode draw eligibility rules.
