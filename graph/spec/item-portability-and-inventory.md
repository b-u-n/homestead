---
schema_version: 2
id: spec/item-portability-and-inventory
type: spec
title: Item Portability & Inventory
status: stable
last_audited: 2026-05-22
tags: [items, inventory, knapsack]
source_doc:
  - doc/items
governs:
  - component/InventoryStore
  - component/KnapsackIcon
  - component/InventoryScreen
  - component/PixelSketchEditor
---

## Rules

### R1: All user items live in a SINGLE `Account.userItems` array regardless of source

Bazaar purchases, player-created sketches, and game rewards all append to the same array. There is no separate `purchases` or `inventory` collection. The `shopItemId` field is `null` for non-shop items (sketches start with `null`, then get linked after submitToShop approval).

**Why:** A single source of truth for "what does this user own" makes counts, filters, and joins trivial. Per-source arrays would require N copies of every lookup.
**Evidence:** `md/items.md` Unified Item System overview.
**Test:** Create a sketch + buy a map-sprite; both appear in `Account.userItems` with different `storeType` values.

### R2: Portability is COMPUTED from `storeType`, never stored

The function `isPortable(storeType)` returns `true` iff `storeType` is one of `sketch`, `toy`, `emoji`, `spell`. Backend lives in `backend/src/utils/itemHelpers.js`; frontend mirrors the list in `InventoryStore`.

**Why:** Storing `portable: true` on every item would drift the moment a `storeType`'s portability decision changed. Computing from `storeType` makes it always correct.
**Evidence:** `md/items.md` Portability section.
**Test:** Change the `PORTABLE_TYPES` list and rerun queries; existing items behave correctly without a migration.

### R3: Portable items show in the knapsack; non-portable items show in the Customization Table

`knapsack:items:list` filters by `isPortable()`. The Customization Table picks from the complement (`!isPortable()`, i.e., shop-purchased map sprites, decorations, avvies). Each surface owns its filter.

**Why:** Two surfaces with overlapping filters would let the user see the same item twice. The bisection by portability is the agreed-on split.
**Evidence:** `md/items.md` Portability section ("Portable items show in the knapsack").
**Test:** Own one sketch and one map-sprite; knapsack shows only the sketch, Customization Table shows only the map-sprite.

### R4: Sketches auto-generate a lossless PNG server-side via `pixelImageService`

When `knapsack:items:update` saves a sketch (`storeType: 'sketch'`), the backend reads `data: { width, height, pixels }` and writes a lossless PNG to `contentUrl` using `sharp`. The frontend never generates the PNG.

**Why:** Server-side rendering is the only way to keep the canonical image consistent across clients and survive client-side rendering bugs. Per `CLAUDE.md`, AI/asset URLs from third-party services would also be illegal to expose to the frontend — this rule mirrors that abstraction.
**Evidence:** `md/items.md` Pixel Sketches section.
**Test:** Save a sketch from the frontend; the resulting `contentUrl` is a backend-hosted PNG, not a data URL or third-party URL.

### R5: Private items go through moderation and are visible only to the owner

`ShopItem.visibility: 'private'` items enter the moderation queue (content safety) and then surface only on the owner's personal gallery — they cannot be purchased by other users.

**Why:** Users want a place to upload personal sketches that aren't for sale without a separate "drafts" surface. Private visibility is that mode.
**Evidence:** `md/items.md` Private Items section.
**Test:** Submit a private sketch; another user cannot see it in the shop listing.

### R6: Pixel Pals contributors get a 3-heart discount on the resulting board's shop item

When a board auto-completes and becomes a `ShopItem`, the participants listed in `participantIds` purchase at a flat 3 hearts; everyone else pays the normal `getPrice()` price.

**Why:** Rewards collaboration without giving the contributors the board for free (still spends some currency, preserves the economy).
**Evidence:** `md/items.md` Game Board → Shop Pipeline.
**Test:** Be a participant on a completed board; the shop UI shows a 3-heart price; switch user; price reverts to `getPrice()`.

## Notes

`InventoryStore` (frontend) mirrors the backend's `PORTABLE_TYPES` list. Drift between the two surfaces is a known risk — if a new portable `storeType` is added on the backend without updating the frontend, knapsack/customization-table filters disagree. Audit at PR time.

The Sketch → Shop pipeline and Game Board → Shop pipeline both terminate in `ShopItem` creation with moderation; they share `pixelImageService` for PNG generation.
