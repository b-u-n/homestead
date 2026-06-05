---
schema_version: 2
id: component/WeepingWillowLanding
type: component
title: WeepingWillowLanding
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/WeepingWillowLanding.js
belongs_to:
  - concept/weeping-willow
source_doc:
  - doc/weeping-willow
---

## Purpose

Landing drop for the Weeping Willow flow. Two buttons: "Ask for help" (→ `weepingWillow:create`) and "Help others" (→ `weepingWillow:list`).

## Notes

Intentionally minimal — branch point only. See `md/WEEPING_WILLOW.md` "Frontend Navigation Flow" for the full drop graph.
