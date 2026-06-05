---
schema_version: 2
id: component/ColorWheel
type: component
title: ColorWheel
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/ColorWheel.js
belongs_to:
  - concept/pixelpals
uses:
  - component/MinkyPanel
source_doc:
  - doc/pixelpals
---

## Purpose

Reusable color-picker wheel. Twelve preset wheels (Creams, Vibrants Light, Vibrants, Coral, Rust, Gold, Sage, Sky Blue, Purple, Pink, Vibrants Dark, Darks) rendered as circular `MinkyPanel`s in a 4x3 grid on the left panel; a popup-overlay variant opens on left-click in Draw mode and clamps to screen edges.

## Notes

Indicator state is shared between popup and panel wheels via `externalPickPos`/`onExternalPickPos` props. Popup auto-fades after 12 seconds. Used by [[component/PixelPalsCanvas]] and [[component/PixelEditor]].
