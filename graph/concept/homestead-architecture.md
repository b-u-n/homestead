---
schema_version: 2
id: concept/homestead-architecture
type: concept
title: Homestead Architecture
status: stable
last_audited: 2026-05-22
kind: surface
governs:
  - concept/wire-protocol
  - concept/activity-system
  - concept/bazaar
  - concept/heart-economy
  - concept/wishing-well
source_doc:
  - doc/architecture
  - doc/features
  - doc/testing
---

## Overview

The system-level surface of Homestead: a React Native (Expo Router) frontend, a Node/Express/Socket.IO backend, MongoDB via Mongoose, and a WebSocket-only transport for all stateful interaction. MobX stores hold frontend state; declarative flow definitions wire multi-step UI on both sides. This concept is the anchor every other architectural rule, pattern, and store node hangs off of — it is not a feature, it is the shape of the whole app.

## Notes

Anchors [[spec/architecture-overview]] (system-level invariants), [[spec/feature-rollout-process]] (progressive feature unlock), and [[spec/testing-conventions]] (what gets tested, how). The patterns this surface produces — MobX store, WebSocket emit-await, error-store broadcast, flow context injection — each get their own `pattern/` node and are referenced by components in other clusters.

Full prose lives in `md/ARCHITECTURE.md`, `md/FEATURES.md`, `md/TESTING.md` per R6. This node is the structural anchor for cross-cutting system-level rules — anything narrower belongs to a feature concept ([[concept/wishing-well]], [[concept/activity-system]], etc.).
