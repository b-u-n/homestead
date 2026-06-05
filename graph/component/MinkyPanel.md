---
schema_version: 2
id: component/MinkyPanel
type: component
title: MinkyPanel
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/MinkyPanel.js
belongs_to:
  - concept/vaporwave-aesthetic
source_doc:
  - doc/minkypanel
  - doc/art-style
---

## Purpose

Textured content panel with stitched border and pink/purple color overlay. The standard container for any content surface that should read as a "soft handmade panel" in the Homestead aesthetic. Most drops and modal interiors render inside one.

## Notes

This is a seed node created during graph bootstrap as the `affects` target of [[drift/colors-primary-text-conflict]]. The full set of components that render with `token/color-primary-text` will be added during the Phase 2 audit pass — this node exists right now primarily so the seed drift case has a typed endpoint.

Props, variants, and usage examples are documented in `md/MINKYPANEL.md` — those don't need to be duplicated here per R6.
