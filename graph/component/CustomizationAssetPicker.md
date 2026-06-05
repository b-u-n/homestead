---
schema_version: 2
id: component/CustomizationAssetPicker
type: component
title: CustomizationAssetPicker
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/CustomizationAssetPicker.js
belongs_to:
  - concept/user-customization
source_doc:
  - doc/customization
---

## Purpose

The first drop of the Customization Table flow (depth 0). Renders a grid of all platform assets from `frontend/constants/platformAssets.js`, with category filter buttons across the top. Customized assets show a "Customized" badge and the custom thumbnail alongside the original; tapping a customized asset expands inline options (Change, Reset to Default, Cancel). Tapping an uncustomized asset proceeds to the item picker.

## Notes

"Reset to Default" calls `bazaar:customization:clear` directly without entering deeper drops — the cleanup operation is shallow enough to handle in place.
