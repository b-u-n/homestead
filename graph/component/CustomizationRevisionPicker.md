---
schema_version: 2
id: component/CustomizationRevisionPicker
type: component
title: CustomizationRevisionPicker
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/CustomizationRevisionPicker.js
belongs_to:
  - concept/user-customization
source_doc:
  - doc/customization
---

## Purpose

Third drop (depth 1) of the Customization Table flow. Fetches `bazaar:purchases:revisions` for the selected item and renders a grid of approved revision thumbnails. Each tile may show a "Latest" badge (when its index === `currentApprovedRevisionIndex`) and/or an "Active" badge (when it matches the user's current `revisionIndex`). Tapping a revision selects it; the confirm button calls `bazaar:customization:set`, updates `CustomizationStore`, and navigates back to the asset picker.

## Notes

The "Latest" + "Active" cues are mandated by `spec/avatar-customization-flow` R4 — they are the discoverability mechanism that makes revision-locking (R3) acceptable UX.
