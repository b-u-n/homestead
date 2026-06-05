---
schema_version: 2
id: component/CustomizationTable
type: component
title: CustomizationTable
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/CustomizationTable.js
belongs_to:
  - concept/bazaar
  - concept/user-customization
uses:
  - component/FlowEngine.frontend
source_doc:
  - doc/bazaar
  - doc/customization
---

## Purpose

FlowEngine wrapper for the customization workflow: pick a platform asset → pick a purchased item that customizes it → pick which approved revision to apply. Writes to `Account.assetCustomizations` (upsert per `platformAssetId`).

## Notes

Backed by `CustomizationStore` (frontend MobX) and `bazaar:customization:*` websocket events. See `md/CUSTOMIZATION.md` for the full per-asset semantics.
