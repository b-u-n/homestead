---
schema_version: 2
id: component/MapSpritesStall
type: component
title: MapSpritesStall
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/MapSpritesStall.js
belongs_to:
  - concept/bazaar
uses:
  - component/FlowEngine.frontend
source_doc:
  - doc/bazaar
---

## Purpose

FlowEngine wrapper for the map-sprites stall — the only currently-active bazaar stall (Phase 1). Shop listing of approved `map-sprite` ShopItems with item-detail view (purchase, comment). Other stalls (`toy`, `emoji`, `decoration`, `avvie`, `spell`) are placeholders pending future implementation.

## Notes

The stall reads only mod-approved revisions — never displays in-flight content (the "Key Safety Rule" from `md/BAZAAR.md`). Pricing is computed server-side via `bazaarPricing.js`; see [[spec/bazaar-pricing]] R1.
