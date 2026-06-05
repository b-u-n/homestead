---
schema_version: 2
id: component/CustomizationStore
type: component
title: CustomizationStore
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/stores/CustomizationStore.js
belongs_to:
  - concept/user-customization
source_doc:
  - doc/customization
---

## Purpose

MobX singleton store of the user's active asset customizations. Holds a `Map<platformAssetId, { shopItemId, revisionIndex, contentUrl, itemTitle }>` plus a `version` counter that increments on every change. Exposes `getOverrideUrl(platformAssetId)`, `hasCustomization(platformAssetId)`, and `getCustomization(platformAssetId)`. Loaded on WebSocket connect via `loadFromServer()`, mutated by `updateFromServer()`, `set()`, and `clear()`.

## Notes

The `version` field is consumed by `MapCanvas`'s image-loading `useEffect` as a dependency, per `spec/avatar-customization-flow` R5. Without it, the effect would not re-run on customization changes.

Mirrored on the backend by `Account.assetCustomizations` (the array of upsert entries keyed by `platformAssetId`).
