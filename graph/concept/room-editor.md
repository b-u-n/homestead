---
schema_version: 2
id: concept/room-editor
type: concept
title: Room Editor
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/room-editor
---

## Overview

Dev-only in-app tile placement and entity-position editor for map locations. Two edit lanes coexist on each location: `tiles[]` (additive overlay decorations) and `entityOverrides[]` + `hiddenEntityIds[]` (position-only patches and hides applied to hardcoded entities). State persists to `RoomLayoutOverlay` in MongoDB; CLI scripts round-trip the data back to source files.

## Notes

Anchors [[spec/room-editor-canvas]] and [[spec/room-editor-overlay-model]]. Central component is [[component/RoomEditor]]; `MapCanvas` consumes overlays via `RoomEditorStore.applyEntityEdits()`. Full keyboard map, CLI script behavior, and asset-sizing precedence live in `md/ROOM_EDITOR.md` per R6.
