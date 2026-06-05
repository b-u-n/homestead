---
schema_version: 2
id: concept/items-inventory
type: concept
title: Unified Item System (Inventory + Knapsack)
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/items
---

## Overview

All user items live in `Account.userItems` regardless of source (Bazaar purchases, player-created sketches, game rewards). The `storeType` field (`map-sprite`, `toy`, `emoji`, `decoration`, `avvie`, `spell`, `sketch`) determines portability: portable items (`sketch`, `toy`, `emoji`, `spell`) show in the knapsack; non-portable items show in the Customization Table. Portability is computed from `storeType`, not stored.

## Notes

Anchor for `component/InventoryStore`, `component/KnapsackIcon`, the knapsack backend flow, and the Sketch → Shop pipeline. This concept overlaps with `concept/user-customization` (non-portable items end up there) and `concept/games` (Pixel Pals boards auto-submit through the same shop pipeline). Full schema and pipeline detail lives in `md/items.md` per R6.
