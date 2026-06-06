# Room Editor (Dev Only)

In-app, dev-only tile placement and entity-position editor for the map. Visible whenever a developer-permission account is signed in (or in any non-production build via `__DEV__`). All state persists to MongoDB so layout work survives reloads, and a pair of CLI scripts round-trip the data back to source files.

## Surface

- **Toggle pill** — top-left of the map screen. Pill turns purple when active. Click to enter / leave Edit Mode.
- **Toolbar** — appears at the top while Edit Mode is on. Contains `+ Add` (opens the picker), a `Delete` button (visible when something is selected, prompts `confirm`), a status line, and a "Recent" strip with the last 8 placed asset thumbnails.
- **Picker modal** — MinkyPanel-styled grid of every entry in `frontend/constants/platformAssets.js`, filtered by category.

## Two kinds of edits

### Overlay tiles
Pure dev-placed decorations. Stored as documents in `RoomLayoutOverlay.tiles[]`. They render *additively* on top of the hardcoded location and have no `flow` / `navigateTo` / sounds.

### Entity overrides
A position-only patch applied to a hardcoded entity by `id`. Stored in `RoomLayoutOverlay.entityOverrides[]`. At render time MapCanvas merges the override's `{x, y, width, height, zIndex}` onto the matching entity from `roomData.entities` (or `roomData.doors`). Everything else — `flow`, `navigateTo`, `description`, `sounds`, etc. — stays attached to the source entity, so clicking it in normal mode still triggers its action. Used for "I want the wishing well 100px to the left."

Hardcoded entities are also hideable: `RoomLayoutOverlay.hiddenEntityIds[]`. Hidden ids are filtered out at render time and removed from hit-tests.

## Interaction (in Edit Mode)

| Action | Result |
|---|---|
| Click empty space | Deselect (or commit a placement if a draft is active) |
| Click on a placed overlay tile | Select it |
| Click on a hardcoded entity (with `id`, not a grass tile) | Select it as an override |
| Click a different tile/entity while one is selected | Switches selection |
| Click empty space while selected | Commit a move (only if no arrow key has been pressed yet for this selection) |
| Arrow keys | Nudge selection by 1 tile (32 baseline px), grid-snapped |
| Shift+Arrow | Nudge by 1 baseline pixel (escape hatch, no snap) |
| Ctrl+Up/Down | zIndex ±1 |
| Ctrl+Shift+Up/Down | Send to front / send to back |
| Enter or Esc while selected | Deselect |
| Delete / Backspace | Confirm-prompt then delete (overlay tile removed; entity added to hiddenEntityIds) |
| Ctrl+Z | Undo (snapshots cover tiles + overrides + hidden, infinite stack per location) |

After any arrow keypress on the current selection, clicking deselects instead of committing a move — prevents accidental jumps after fine-tuning. The flag resets when a new selection starts.

## Tile size and the grid

Global tile constant in `frontend/stores/RoomEditorStore.js`:

```js
export const TILE_SIZE = 32; // baseline pixels
```

Placements snap to this grid. A faint purple grid overlay is drawn on the canvas while Edit Mode is on so you can see where tiles will land.

### Sizing on placement

Default: natural PNG dimensions × 4 (matches the project's typical render scale). If a `platformAssets.js` entry overrides this, the override wins. Precedence:

1. `editorWidth` + `editorHeight` (explicit pixel dimensions) — used by pre-scaled assets like `path-midpoint` (`576×344` source) which need a smaller, fixed display size (`128×80`).
2. `editorScale` (multiplier) — overrides the default `4`.
3. Default — `(natural × 4)`.

Examples in `frontend/constants/platformAssets.js`:

```js
{ id: 'path-midpoint', ..., editorWidth: 128, editorHeight: 80 }
```

## CLI scripts

### `backend/scripts/resizeOverlayTiles.js`

Bulk-resize overlay tiles of one asset type to its current `editorWidth/editorHeight`. Useful when you add or change those fields in `platformAssets.js` after tiles have already been placed — existing tiles keep their old saved dimensions otherwise.

```
node backend/scripts/resizeOverlayTiles.js <locationId> <platformAssetId>
```

Example:

```
node backend/scripts/resizeOverlayTiles.js town-square path-midpoint
```

Reads dimensions directly from the `platformAssets.js` source (regex — no `require()` of frontend image modules), touches only matching tiles, leaves `entityOverrides` and `hiddenEntityIds` alone. Reports the count and exits.

Errors with status 2 if the asset has no `editorWidth/editorHeight` declared.

### `backend/scripts/exportLayoutOverlay.js`

Dump a location's overlay back to JS/notes you can paste into source. Prints three labeled sections to stdout:

1. **Overlay tiles** — `{ id, type, x, y, width, height, zIndex, image: require(...), showTitle: false }` literals; paste into the location's `entities` array.
2. **Entity position overrides** — comments listing each `entityId` with new `x, y, width, height, zIndex`. Apply by hand to the matching hardcoded entity.
3. **Hidden entities** — comments listing the `entityId`s the dev deleted; remove those entries from the source.

```
node backend/scripts/exportLayoutOverlay.js <locationId>
```

No file mutation — paste workflow.

## Server / client surface

### Backend

- Model: `backend/src/models/RoomLayoutOverlay.js` — `{ locationId, tiles[], entityOverrides[], hiddenEntityIds[] }`.
- Flow: `backend/src/flows/roomEditor.js` (registered in `backend/src/server.js` as `roomEditor`).
- Handlers (all mutations re-check `isDeveloper`):
  - `room-editor:get-overlay` — returns `{ tiles, entityOverrides, hiddenEntityIds }`.
  - `room-editor:get-all-overlays` — every location's overlay in one round trip; used by the startup prefetch.
  - `room-editor:set-overlay` — wholesale replace of all three lanes. **This is the editor's only write path**: edits are local-first and a dirty location is flushed wholesale (~every 60s, on edit-mode off, and on page hide/unmount).
  - `room-editor:place-tile`, `room-editor:move-tile`, `room-editor:delete-tile`, `room-editor:set-entity-override`, `room-editor:hide-entity`, `room-editor:unhide-entity` — legacy per-op handlers; no longer called by the editor.
- Rendering gate: MapCanvas holds its first draw until the location's overlay is loaded (`RoomEditorStore.isOverlayLoaded`), so the hardcoded source layout never flashes at stale positions. Overlays are prefetched in the background on websocket connect (`prefetchAllOverlays`).

### Frontend

- Store: `frontend/stores/RoomEditorStore.js` — MobX store. Holds `tilesByLocation`, `entityOverridesByLocation`, `hiddenEntityIdsByLocation`, mode/selection state, recents, and the per-location undo stack (`_undoStacks`).
- Helper: `RoomEditorStore.applyEntityEdits(locationId, baseEntities)` — single function MapCanvas calls in render-time entity reads, image-load loop, drawables list, and click/hover hit-tests. Filters hidden, merges override deltas. Idempotent and observable.
- Component: `frontend/components/RoomEditor.js` — toggle pill, toolbar, picker modal, keyboard handler. Mounted as a sibling of `<MapCanvas>` from `frontend/app/homestead/explore/map/[location].tsx`.
- Selection dot drawn directly on the canvas in MapCanvas (cottagecore blue + dashed stitched border, modeled on `NumericRatingSlider`'s thumb).

## Gates

- **Frontend visibility**: `RoomEditorStore.isDeveloper()` — returns `true` if `__DEV__` (any non-production build), else checks `SessionStore.accountData.permissions` for `'developer'` or `'admin'`.
- **Backend mutations**: every `set/place/move/delete/hide/unhide` handler re-runs `isDeveloper(account)` after looking up the session. The standard `requirePermission` socket-level middleware is bypassed in dev (`hasPermission` returns `true` when `NODE_ENV !== 'production'`).

## What is *not* selectable

By design, mass-generated tiles are excluded from the editor's hit-test:

- **Grass tiles** (`grass-${r}-${c}`) — auto-generated isometric field. There are too many to manage manually, and they have no `platformAssetId` for codegen round-tripping.

Anything else with an `id` is fair game, including the procedurally-generated weeping willow grove (`weeping-willow-${i}`). Codegen will note "unresolved platformAssetId" for those overrides since the willow grove uses `Tree.png` which isn't in the catalog — paste them as a per-index exception map next to the `Array.from(...)` block.
