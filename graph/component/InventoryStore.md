---
schema_version: 2
id: component/InventoryStore
type: component
title: InventoryStore
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/stores/InventoryStore.js
belongs_to:
  - concept/items-inventory
source_doc:
  - doc/items
---

## Purpose

MobX singleton store for the user's items (`Account.userItems`). Mirrors the backend `isPortable(storeType)` helper so it can split items into portable (knapsack) vs non-portable (Customization Table) without round-tripping the server. Loaded via `knapsack:items:list` / `knapsack:items:all` on demand and refreshed after `knapsack:items:create`, `update`, `remove`, `submitToShop`.

## Notes

The `PORTABLE_TYPES` array (`sketch`, `toy`, `emoji`, `spell`) is duplicated here from `backend/src/utils/itemHelpers.js`. Drift between the two surfaces is a known risk — see `drift/portable-types-list-duplication` if/when it surfaces.
