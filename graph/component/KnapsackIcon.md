---
schema_version: 2
id: component/KnapsackIcon
type: component
title: KnapsackIcon
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/KnapsackIcon.js
belongs_to:
  - concept/items-inventory
  - concept/badge-system
follows:
  - pattern/badge-positioning-overlay
uses:
  - component/InventoryStore
source_doc:
  - doc/items
  - doc/badges
---

## Purpose

The knapsack-icon entry point on the chrome. Displays the knapsack art with a Quantity Badge in the top-right showing the total portable-item count. Tapping opens the knapsack surface (typically `InventoryScreen` or its modal equivalent).

## Notes

The badge reads from `InventoryStore` and follows the standard badge positioning overlay (`top: -8, right: -8`, `overflow: 'visible'` on the wrapper).
