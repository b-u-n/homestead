---
schema_version: 2
id: concept/bazaar
type: concept
title: Bazaar
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/bazaar
  - doc/customization
---

## Overview

Multi-stall shop and contributor submission system. Contributors submit art via the Drawing Board; moderators review revisions; approved items list in a stall and sell for hearts. Admins can additionally promote items to platform-asset status. Customization Table lets buyers apply purchased art onto platform assets.

## Notes

Anchors [[spec/bazaar-submission-flow]], [[spec/bazaar-moderation-pipeline]], [[spec/bazaar-pricing]] and the central component nodes (`DrawingBoard`, `MapSpritesStall`, `CustomizationTable`). Full prose — stall types, media types, GCS file layout, every websocket event row — stays in `md/BAZAAR.md` per R6.
