---
schema_version: 2
id: component/CustomizationItemPicker
type: component
title: CustomizationItemPicker
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/CustomizationItemPicker.js
belongs_to:
  - concept/user-customization
source_doc:
  - doc/customization
---

## Purpose

Second drop (depth 1) of the Customization Table flow. Fetches `bazaar:purchases:mine` and filters the results to items whose `platformAssetId` matches the selected target asset (per `spec/avatar-customization-flow` R2). Renders each match as thumbnail + title + purchase date; tapping proceeds to the revision picker. Empty state directs users to the shop stalls.

## Notes

Filtering happens client-side on the result of `bazaar:purchases:mine` (which already enriches each purchase with `platformAssetId` from a batched ShopItem query).
