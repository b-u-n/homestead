---
schema_version: 2
id: spec/room-editor-canvas
type: spec
title: Room Editor Canvas
status: stable
last_audited: 2026-05-22
tags: [room-editor, dev-tools]
source_doc:
  - doc/room-editor
governs:
  - component/RoomEditor
---

## Rules

### R1: Dev-only — both client visibility AND every mutation re-check `isDeveloper`

Frontend: `RoomEditorStore.isDeveloper()` returns `true` if `__DEV__` (non-production build) OR the session account has `'developer'` / `'admin'` permission. Backend: every `set/place/move/delete/hide/unhide` handler re-runs `isDeveloper(account)` after the session lookup. The standard `requirePermission` socket-level middleware is bypassed in dev — re-checking in the handler is what closes the gap.

**Why:** Layer-defense. The toggle pill being hidden is UX, not security. A malicious client could emit any websocket event; the in-handler check is the actual gate.
**Evidence:** `md/ROOM_EDITOR.md` "Gates" section; `backend/src/flows/roomEditor.js`.
**Test:** Authenticate as a non-developer in production and emit `room-editor:place-tile` directly → expect permission rejection.

### R2: Two parallel edit lanes — overlay tiles vs entity overrides — never merge

`RoomLayoutOverlay` has three top-level arrays: `tiles[]` (additive pure-decoration tiles), `entityOverrides[]` (position-only patches keyed by entity `id`), and `hiddenEntityIds[]`. Overlay tiles have no `flow` / `navigateTo` / sounds. Entity overrides keep all behavior on the source entity and only patch `{x, y, width, height, zIndex}`.

**Why:** Mixing the two would make round-tripping back to source impossible. Overlay tiles are "things the dev placed"; overrides are "edits to existing hardcoded entities." Each lane has its own codegen target.
**Evidence:** `md/ROOM_EDITOR.md` "Two kinds of edits" section.
**Test:** `exportLayoutOverlay.js` outputs three labeled sections (overlay tiles, entity overrides, hidden entities) — never combined.

### R3: Delete on an entity adds to `hiddenEntityIds` — never removes the source entity

Pressing Delete/Backspace on a selected hardcoded entity prompts `confirm()` then adds its `id` to `hiddenEntityIds`. At render time MapCanvas filters hidden ids out of the entity list and out of hit-tests. The source entity in `roomData.entities` is untouched.

**Why:** Edits to source code happen via the CLI export → paste workflow, not by the editor mutating source. Hiding is reversible (undo or `room-editor:unhide-entity`); deleting source code from a websocket handler would be irreversible and dangerous.
**Evidence:** `md/ROOM_EDITOR.md` "Two kinds of edits" + "Interaction" tables.
**Test:** Delete a hardcoded entity in the editor; inspect the location source file — entity should still be present. Confirm the entity does not render and is removed from hit-tests.

### R4: All entity reads route through `RoomEditorStore.applyEntityEdits()`

`MapCanvas` calls `applyEntityEdits(locationId, baseEntities)` in: render-time entity reads, the image-load loop, the drawables list build, and click/hover hit-tests. Idempotent and observable. Components MUST NOT iterate `roomData.entities` directly.

**Why:** Single funnel for "merge overlays onto base." Skipping it in one of the four call-sites would cause invisible-but-hittable entities, or visible-but-not-clickable ones — the exact bug class this rule prevents.
**Evidence:** `md/ROOM_EDITOR.md` "Frontend → Helper" section.
**Test:** Grep `MapCanvas.js` for direct iteration of `roomData.entities` not preceded by `applyEntityEdits` — every read should be filtered.

### R5: Tile sizing precedence — `editorWidth/Height` > `editorScale` > `natural × 4`

When a tile is placed, the size is computed as: (1) `editorWidth` + `editorHeight` if both are set on the `platformAssets.js` entry; (2) `natural × editorScale` if `editorScale` is set; (3) default `natural × 4`.

**Why:** Pre-scaled assets like `path-midpoint` ship at 576×344 source but should render at 128×80. Without explicit dimensions they'd render 4× too large. The precedence chain lets one asset opt in to fixed dimensions without forcing every other to.
**Evidence:** `md/ROOM_EDITOR.md` "Sizing on placement" section.
**Test:** Place `path-midpoint`; saved tile should have `width: 128, height: 80`.

### R6: Grass tiles are NOT selectable — but everything else with an `id` is

The editor's hit-test excludes entities whose id matches `grass-{r}-{c}` (auto-generated isometric field). Any other id, including the procedurally-generated weeping-willow grove (`weeping-willow-{i}`), is selectable.

**Why:** Mass-generated tiles are too numerous to manage manually and have no `platformAssetId` to codegen back. The grove entries can be hidden / repositioned but on export they get a "unresolved platformAssetId" comment because `Tree.png` isn't in the catalog.

**Evidence:** `md/ROOM_EDITOR.md` "What is *not* selectable" section.
**Test:** Click any grass tile in edit mode → nothing selects. Click a tree in the grove → it becomes selected.

### R7: Arrow-key fine-tune disables click-to-commit until reselection

After any arrow key press on the current selection, clicking empty space deselects instead of committing a move. Flag resets when a new selection starts. Shift+Arrow nudges by 1 baseline pixel (escape hatch, no grid snap).

**Why:** Users who nudge with arrow keys are doing precision work; a stray click would un-do the precision and snap to grid. The flag inverts the default click behavior so precision is preserved.
**Evidence:** `md/ROOM_EDITOR.md` "Interaction" section ("only if no arrow key has been pressed yet for this selection").
**Test:** Select a tile, press Right arrow once, then click empty space — selection should clear (not move).

## Notes

`RoomLayoutOverlay` is a separate model from the location source files, intentionally — see [[spec/room-editor-overlay-model]] for the persistence boundary. Full CLI script contract (`resizeOverlayTiles.js`, `exportLayoutOverlay.js`) lives in `md/ROOM_EDITOR.md`.
