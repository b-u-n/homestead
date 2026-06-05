---
schema_version: 2
id: component/ButtonBase
type: component
title: ButtonBase
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/ButtonBase.js
belongs_to:
  - concept/vaporwave-aesthetic
follows:
  - pattern/auto-styled-text
  - pattern/emboss-border-overlay
uses:
  - component/StitchedBorder
source_doc:
  - doc/buttons
  - doc/emboss
---

## Purpose

The shared core for every textured button in the app. Handles texture rendering (`wool` / `minky`), variant overlay color, stitched border, emboss border overlay, drop shadow, disabled opacity, accessibility attributes, and the `ButtonTextureContext` that auto-styles child `Text` components. Not used directly — consumers import `WoolButton` or `MinkyButton`.

## Notes

Exports a `Text` component that reads the texture context and applies the texture-specific font + the white emboss text shadow automatically. Variant theme colors come from a `useWoolColors(variant)` hook (flow-context aware). The `focused` prop only changes the stitched border color, not the overlay — per `pattern/focused-stitched-border`.
