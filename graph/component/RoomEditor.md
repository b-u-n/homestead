---
schema_version: 2
id: component/RoomEditor
type: component
title: RoomEditor
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/RoomEditor.js
belongs_to:
  - concept/room-editor
uses:
  - component/MinkyPanel
emits:
  - room-editor:place-tile
  - room-editor:move-tile
  - room-editor:delete-tile
  - room-editor:set-entity-override
  - room-editor:hide-entity
  - room-editor:unhide-entity
  - room-editor:set-overlay
handles:
  - room-editor:get-overlay
source_doc:
  - doc/room-editor
---

## Purpose

Edit-mode UI for map locations: toggle pill (top-left), toolbar (`+ Add`, `Delete`, status, "Recent" thumbnails), MinkyPanel-styled picker modal listing every entry in `platformAssets.js`, and a keyboard handler (arrows nudge, Ctrl-Up/Down zIndex, Ctrl-Z undo). Mounted as a sibling of `<MapCanvas>` from the location route.

## Notes

All state and overlay logic lives in `RoomEditorStore` (MobX); `MapCanvas` consumes overlays through `RoomEditorStore.applyEntityEdits(locationId, baseEntities)` — the single function called from render-time entity reads, image-load loop, drawables list, and hit-tests. Dev-only — see [[spec/room-editor-canvas]] R1.
