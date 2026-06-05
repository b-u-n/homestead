---
schema_version: 2
id: drift/portable-types-list-duplication
type: drift
title: PORTABLE_TYPES list duplicated on frontend and backend
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/item-portability-and-inventory
affects:
  - component/InventoryStore
source_doc:
  - doc/items
---

## Symptom

The list of portable `storeType` values (`['sketch', 'toy', 'emoji', 'spell']`) is defined in TWO places:

- `backend/src/utils/itemHelpers.js` → `PORTABLE_TYPES` (used by `knapsack:items:list` filter)
- `frontend/stores/InventoryStore.js` → mirrored array (used to split items into knapsack vs Customization Table)

`md/items.md` explicitly calls this out ("Frontend mirrors this in `frontend/stores/InventoryStore.js`."). Adding a new portable `storeType` on the backend without updating the frontend (or vice versa) silently puts a class of items in the wrong surface — they'd appear in the Customization Table while the knapsack filter excludes them, or vice versa.

This violates the spirit of `spec/item-portability-and-inventory` R2 (portability computed, not stored) — the COMPUTATION itself is duplicated, which is the same drift surface in a different shape.

## Resolution

Options:

1. **Backend-served list.** Backend exposes `PORTABLE_TYPES` via a one-time `meta:portableTypes` WebSocket event at session start; frontend caches and uses it. Single source of truth.
2. **Shared package.** Move the list into a `shared/` module imported by both surfaces. Higher infra cost.
3. **Accept and lint.** Add a PR-check script that compares the two files and fails CI on mismatch.

Option 1 is the cleanest; option 3 is the cheapest. Either way, the divergence-risk is the load-bearing issue, and the list should drift to one location.

`cause: parallel_authoring` because the duplication is by-design today; the drift node exists to flag the latent risk rather than an active inconsistency.

## Audit log

| Date       | Agent                  | Note                                                                 |
|------------|------------------------|----------------------------------------------------------------------|
| 2026-05-22 | claude (user-currency) | Drift recorded from md/items.md Portability section.                 |
