---
schema_version: 2
id: concept/pixelpals
type: concept
title: Pixel Pals
status: stable
last_audited: 2026-05-22
kind: feature
feeds_into:
  - concept/bazaar
source_doc:
  - doc/pixelpals
---

## Overview

Collaborative pixel-art game in the Games Parlor. Players create boards (shared or personal) and contribute pixels according to one of four game modes (Free, Chain, Daily Drop, Live Canvas). Completed boards auto-generate a PNG, become a `ShopItem` revision, and enter the Bazaar moderation queue.

## Notes

Anchors [[spec/pixelpals-game-modes]] and [[spec/pixelpals-credit-system]]. Central component is [[component/PixelPalsCanvas]]; `PixelEditor` and `ColorWheel` are reusable sub-components. Cross-references [[concept/bazaar]] via the auto-completion → moderation pipeline. Full layout-mode details and tool/shortcut reference live in `md/pixelpals.md` per R6.
