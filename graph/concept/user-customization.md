---
schema_version: 2
id: concept/user-customization
type: concept
title: User Customization (Asset Replacement)
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/customization
---

## Overview

The Bazaar Customization Table surface. Users purchase community-created art from shop stalls, then assign their purchases to replace specific platform assets (sprites, textures, bookshelves) on their own map. Customizations are per-user and per-asset — each platform asset can have one active customization at a time, locked to a chosen revision.

## Notes

Anchor for `component/CustomizationTable`, `component/CustomizationStore`, the three asset/item/revision picker drops, and `spec/avatar-customization-flow`. The full asset catalog, schema, and edge-case behavior live in `md/CUSTOMIZATION.md` per R6.
