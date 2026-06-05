---
schema_version: 2
id: concept/vaporwave-aesthetic
type: concept
title: Vaporwave / Cottagecore Aesthetic
status: stable
last_audited: 2026-05-22
kind: aesthetic
source_doc:
  - doc/art-style
---

## Overview

The unified visual language across Homestead: handmade textile feel — embroidery, wool, minky textures, stitched borders, pastel overlays. The aesthetic is what makes the app feel like a cozy blanket rather than a clinical tool, and it is the source of truth that every design token serves.

## Notes

This concept is the anchor for [[spec/design-tokens]] and for every textile-style component (`MinkyPanel`, `MinkyButton`, `WoolButton`, `StitchedBorder`, etc.). When those components get graph nodes during Phase 2, they `belongs_to` this concept.

The full descriptive prose — philosophy, on-brand checklist, off-brand list, asset specs — lives in `md/ART_STYLE.md` per R6. This node is the structural anchor, not the prose.
