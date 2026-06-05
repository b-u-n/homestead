---
schema_version: 2
id: spec/room-editor-overlay-model
type: spec
title: Room Layout Overlay Model
status: stable
last_audited: 2026-05-22
tags: [room-editor, persistence]
source_doc:
  - doc/room-editor
references:
  - spec/room-editor-canvas
---

## Rules

### R1: One `RoomLayoutOverlay` document per `locationId`

`RoomLayoutOverlay = { locationId, tiles[], entityOverrides[], hiddenEntityIds[] }`. The collection is keyed by `locationId` — one document per map location. Edits to any of the three arrays update the same document.

**Why:** Atomic per-location overlay. Round-tripping (export script) operates on one location at a time and one document is the natural granularity.
**Evidence:** `md/ROOM_EDITOR.md` "Backend → Model" section.
**Test:** Place two tiles in `town-square` and one in `bazaar`; the collection should contain two documents.

### R2: `room-editor:set-overlay` is the wholesale-replace handler used by undo

Undo restores prior state by calling `set-overlay` with the entire snapshot of tiles + overrides + hidden. The per-edit handlers (`place-tile`, `move-tile`, etc.) are surgical; `set-overlay` is the bulk path.

**Why:** Undo state is captured as snapshots in `_undoStacks` (infinite stack per location). Replaying a snapshot requires a single atomic replace, not N inverse operations.
**Evidence:** `md/ROOM_EDITOR.md` "Backend → Handlers" section ("used by undo").
**Test:** Place tile A, place tile B, undo; only `set-overlay` is called on undo, not `delete-tile`.

### R3: Export script is read-only — paste workflow, never auto-edit

`exportLayoutOverlay.js` dumps three labeled stdout sections (overlay tiles as `entities` array literals; entity overrides as comments; hidden entities as comments). The dev pastes the output into source files by hand.

**Why:** Source files contain hand-curated logic (flow callbacks, navigateTo, descriptions) that a code-generator could clobber. Paste-by-hand keeps the developer in the loop on every change.
**Evidence:** `md/ROOM_EDITOR.md` "exportLayoutOverlay.js" section ("No file mutation — paste workflow").
**Test:** Run the script; confirm no files under `frontend/locations/` change.

### R4: `resizeOverlayTiles.js` updates only matching tiles, leaves other lanes alone

Bulk-resize is scoped to one `(locationId, platformAssetId)` pair and only touches matching entries in `tiles[]`. `entityOverrides[]` and `hiddenEntityIds[]` are not modified. Reads dimensions via regex of the `platformAssets.js` source so the script doesn't need to require frontend image modules.

**Why:** When `editorWidth/editorHeight` change on an asset definition, existing placed tiles keep their old saved dimensions — this script reconciles them. Touching the other lanes would have unintended side effects.
**Evidence:** `md/ROOM_EDITOR.md` "resizeOverlayTiles.js" section.
**Test:** Place tiles of asset A and asset B; run the script for asset A; only A's tiles change dimensions.

## Notes

Pairs with [[spec/room-editor-canvas]] (which governs the editor UI and edit semantics). This spec is specifically the persistence boundary — the model fields, the handler set, and the CLI surface that round-trips state back to source files.
