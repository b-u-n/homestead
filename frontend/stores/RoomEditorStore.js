import { makeAutoObservable, runInAction } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';
import { PLATFORM_ASSETS } from '../constants/platformAssets';

// Editor grid: every placement and every default-arrow nudge snaps to this many
// baseline pixels. Shift+arrow bypasses the snap for sub-tile fine-tuning.
export const TILE_SIZE = 32;
const snap = (v) => Math.round(v / TILE_SIZE) * TILE_SIZE;

// Edits are local-first; dirty overlays are flushed wholesale to Mongo at most
// this often (plus on edit-mode off and page hide). Keeps the editor instant and
// the remote-Atlas write rate to ~one per minute instead of one per keystroke.
const FLUSH_INTERVAL_MS = 60000;

/**
 * Holds overlay tiles per location and editor mode state.
 * MapCanvas observes this store and merges getTiles(location) into entity rendering.
 * RoomEditor (the dev UI) drives mutations.
 */
class RoomEditorStore {
  // Map<locationId, tile[]>
  tilesByLocation = new Map();
  // Map<locationId, override[]> — positional overrides for hardcoded entities.
  entityOverridesByLocation = new Map();
  // Map<locationId, string[]> — hardcoded entity ids the dev has hidden.
  hiddenEntityIdsByLocation = new Map();
  // Map<locationId, snapshots[]> — snapshots are { tiles, entityOverrides, hiddenEntityIds }.
  _undoStacks = new Map();
  // Overlay readiness: locations whose DB overlay has been loaded this session,
  // plus a flag set once the startup prefetch has run (locations with no DB doc
  // are implicitly empty after that). MapCanvas gates its first draw on this so
  // the hardcoded source layout never flashes before DB positions arrive.
  overlayLoadedLocations = new Set();
  overlayPrefetchDone = false;
  // Most-recently-placed platformAssetIds, newest first, capped at 8.
  recentAssetIds = [];
  // 'idle' | 'picking' | 'placing' | 'selected'
  mode = 'idle';
  // When true, all map UI chrome is hidden (editor UI, user status box, menus,
  // knapsack, etc.) for clean screenshots. Toggled with the H key (dev only).
  uiHidden = false;
  // When true, every sprite on the map gets a pink outline showing its bounds.
  // Toggled with the O key (dev only).
  outlinesVisible = false;
  // A-key align mode: when armed (requires a selection), the next canvas click on a
  // tile/entity moves the selection to the target's exact x/y instead of the normal
  // click behavior. Cleared on align, Esc, or any selection change.
  alignArmed = false;
  // True while the current selection is a just-created copy (C). The canvas draws
  // the selection circle white instead of blue so the dev can see the copy landed.
  // Cleared on any selection change or deselect.
  selectionIsFreshCopy = false;
  // When true, MapCanvas suppresses its own click/move handlers so the editor owns the canvas.
  editModeActive = false;
  currentLocation = null;
  // Tile being placed (not yet committed): { platformAssetId, x, y, width, height, zIndex }
  draftTile = null;
  // Selection: either an overlay tile (by _id) or a hardcoded entity (by id).
  selectedKind = null; // 'tile' | 'entity' | null
  selectedTileId = null;
  selectedEntityId = null;
  // Multi-selection (Shift+click). Entries: { kind: 'tile', tileId } or
  // { kind: 'entity', entityId, dims }. The single-selection fields above always
  // mirror the *primary* (most recently added) entry. Group operations (nudge,
  // zIndex, copy, delete) apply to every entry when there are 2+.
  multiSelected = [];
  // Cached dimensions of the currently-selected hardcoded entity. Needed because
  // overrides include width/height and the entity object is owned by MapCanvas.
  selectedEntityDims = null; // { x, y, width, height, zIndex }
  // Last known pointer position in 1080-baseline canvas coords, recorded by
  // MapCanvas.handleCanvasMouseMove while edit mode is on. Non-observable —
  // it updates on every mousemove and nothing renders from it.
  _pointer = null;
  // Map<locationId, entity[]> — merged hardcoded entities + doors (overrides applied,
  // hidden filtered), kept in sync by MapCanvas for Tab-cycling selection. Non-observable —
  // it's an input to keyboard actions, nothing renders from it.
  _selectableEntitiesByLocation = new Map();
  // True when there are local edits not yet flushed to the server. Drives the
  // toolbar's "unsaved" indicator. (Observable; the plumbing below is not.)
  dirty = false;
  // --- Batched sync plumbing (local-first editing) ---
  // All edits mutate local state only; dirty locations are flushed WHOLESALE via
  // room-editor:set-overlay on a timer (FLUSH_INTERVAL_MS), on edit-mode off, and
  // on page hide. Locally-created tiles carry `local-<n>` ids — nothing server-
  // side needs tile ids anymore, so they only have to be locally unique (real
  // ids arrive whenever the overlay is next fetched on mount).
  _dirtyLocations = new Set();
  _flushTimer = null;
  _flushBusy = false;
  _localIdCounter = 0;
  // Click-through cycling state: { x, y, index } of the last plain selection
  // click. Repeated clicks within CLICK_CYCLE_TOLERANCE px advance through the
  // stack of items under the cursor. Non-observable — nothing renders from it.
  _clickCycle = null;

  constructor() {
    makeAutoObservable(this, {
      _pointer: false,
      _selectableEntitiesByLocation: false,
      _dirtyLocations: false,
      _flushTimer: false,
      _flushBusy: false,
      _localIdCounter: false,
      _clickCycle: false
    });
  }

  _nextLocalId() {
    return `local-${++this._localIdCounter}`;
  }

  _markDirty(locationId) {
    this._dirtyLocations.add(locationId);
    this.dirty = true;
    this._scheduleFlush();
  }

  _scheduleFlush() {
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      this.flushDirty();
    }, FLUSH_INTERVAL_MS);
  }

  // Flush every dirty location's full overlay (tiles + overrides + hidden) in one
  // set-overlay write each. Locations re-dirtied while a flush is in flight wait
  // for the next scheduled flush — this is what batches a burst of edits into a
  // single Atlas write instead of one per keystroke.
  async flushDirty() {
    if (this._flushBusy) {
      this._scheduleFlush();
      return;
    }
    this._flushBusy = true;
    const toFlush = [...this._dirtyLocations];
    this._dirtyLocations.clear();
    try {
      for (const locationId of toFlush) {
        try {
          await WebSocketService.emit('room-editor:set-overlay', {
            sessionId: SessionStore.sessionId,
            locationId,
            tiles: (this.tilesByLocation.get(locationId) || []).map(t => ({
              platformAssetId: t.platformAssetId,
              x: t.x, y: t.y, width: t.width, height: t.height, zIndex: t.zIndex || 0
            })),
            entityOverrides: (this.entityOverridesByLocation.get(locationId) || []).map(o => ({
              entityId: o.entityId, x: o.x, y: o.y, width: o.width, height: o.height, zIndex: o.zIndex || 0
            })),
            hiddenEntityIds: (this.hiddenEntityIdsByLocation.get(locationId) || []).slice()
          });
          // Local state stays the source of truth — server-issued tile ids are
          // NOT adopted here (that would invalidate the current selection); they
          // arrive via fetchOverlay on the next mount.
        } catch (err) {
          console.error('Overlay flush failed:', err);
          this._dirtyLocations.add(locationId); // retry on the next cycle
        }
      }
    } finally {
      this._flushBusy = false;
      runInAction(() => { this.dirty = this._dirtyLocations.size > 0; });
      if (this._dirtyLocations.size > 0) this._scheduleFlush();
    }
  }

  // Immediate flush (edit-mode off, page hide/unload).
  flushNow() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
    return this.flushDirty();
  }

  setPointer(x, y) {
    this._pointer = { x, y };
  }

  setSelectableEntities(locationId, entities) {
    this._selectableEntitiesByLocation.set(locationId, entities);
  }

  // Tab / Shift+Tab: cycle the selection through everything selectable on this map —
  // overlay tiles (in placement order), then hardcoded entities/doors (in definition
  // order). dir is +1 (next) or -1 (previous); wraps around at the ends.
  selectNext(locationId, dir = 1) {
    const tiles = this.tilesByLocation.get(locationId) || [];
    const entities = (this._selectableEntitiesByLocation.get(locationId) || [])
      .filter(e => e && e.id && !e.id.startsWith('grass-'));
    const ring = [
      ...tiles.map(t => ({ kind: 'tile', tile: t })),
      ...entities.map(e => ({ kind: 'entity', entity: e }))
    ];
    if (ring.length === 0) return;
    let idx = -1;
    if (this.selectedKind === 'tile' && this.selectedTileId) {
      idx = ring.findIndex(r => r.kind === 'tile' && r.tile._id === this.selectedTileId);
    } else if (this.selectedKind === 'entity' && this.selectedEntityId) {
      idx = ring.findIndex(r => r.kind === 'entity' && r.entity.id === this.selectedEntityId);
    }
    const next = ring[(idx + dir + ring.length) % ring.length];
    if (next.kind === 'tile') this.selectTile(next.tile._id);
    else this.selectEntity(next.entity);
  }

  setCurrentLocation(locationId) {
    this.currentLocation = locationId;
  }

  getTiles(locationId) {
    return this.tilesByLocation.get(locationId) || [];
  }

  getOverrides(locationId) {
    return this.entityOverridesByLocation.get(locationId) || [];
  }

  getHidden(locationId) {
    return this.hiddenEntityIdsByLocation.get(locationId) || [];
  }

  // Render-time helper: filter hardcoded entities by hidden list and merge any
  // positional override onto matching entities. Behavior fields (flow, navigateTo,
  // sounds, etc.) stay attached to the original entity.
  applyEntityEdits(locationId, baseEntities) {
    const overrides = this.entityOverridesByLocation.get(locationId) || [];
    const hidden = this.hiddenEntityIdsByLocation.get(locationId) || [];
    if (overrides.length === 0 && hidden.length === 0) return baseEntities;
    const overrideById = new Map(overrides.map(o => [o.entityId, o]));
    const hiddenSet = new Set(hidden);
    return baseEntities
      .filter(e => !hiddenSet.has(e.id))
      .map(e => {
        const o = overrideById.get(e.id);
        return o ? { ...e, x: o.x, y: o.y, width: o.width, height: o.height, zIndex: o.zIndex } : e;
      });
  }

  setTiles(locationId, tiles) {
    this.tilesByLocation.set(locationId, tiles);
  }

  isDeveloper() {
    // Dev builds: always show editor (matches backend hasPermission() bypass in non-production).
    if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
    const perms = SessionStore.accountData?.permissions || [];
    return perms.includes('developer') || perms.includes('admin');
  }

  // --- Editor mode transitions ---

  toggleUiHidden() {
    this.uiHidden = !this.uiHidden;
  }

  toggleOutlines() {
    this.outlinesVisible = !this.outlinesVisible;
  }

  toggleAlignArmed() {
    if (this.mode !== 'selected') return;
    if (this.multiSelected.length > 1) return; // align is a single-item operation
    this.alignArmed = !this.alignArmed;
  }

  // Move the current selection so its top-left sits at exactly (x, y) — no grid
  // snap, no centering. Used by align mode to match a target's position 1:1.
  // Keeps the selection active so the dev can keep adjusting.
  alignSelectedTo(locationId, x, y) {
    if (this.selectedKind === 'entity') {
      if (!this.selectedEntityId || !this.selectedEntityDims) return;
      const dims = this.selectedEntityDims;
      this._pushSnapshot(locationId);
      const next = { entityId: this.selectedEntityId, x, y, width: dims.width, height: dims.height, zIndex: dims.zIndex };
      this._applyOverrideLocal(locationId, next);
      this.selectedEntityDims = { ...dims, x, y };
      this._markDirty(locationId);
      return;
    }
    if (!this.selectedTileId) return;
    const tiles = this.tilesByLocation.get(locationId) || [];
    const idx = tiles.findIndex(t => t._id === this.selectedTileId);
    if (idx < 0) return;
    this._pushSnapshot(locationId);
    const next = { ...tiles[idx], x, y };
    const newTiles = tiles.slice();
    newTiles[idx] = next;
    this.tilesByLocation.set(locationId, newTiles);
    this._markDirty(locationId);
  }

  toggleEditMode() {
    this.editModeActive = !this.editModeActive;
    if (!this.editModeActive) {
      this.mode = 'idle';
      this.draftTile = null;
      this.selectedTileId = null;
      // Leaving edit mode is a natural "I'm done" point — persist immediately.
      this.flushNow();
    }
  }

  openPicker() {
    this.mode = 'picking';
    this.draftTile = null;
    this.selectedTileId = null;
  }

  closePicker() {
    if (this.mode === 'picking') this.mode = 'idle';
  }

  _bumpRecent(assetId) {
    const without = this.recentAssetIds.filter(id => id !== assetId);
    this.recentAssetIds = [assetId, ...without].slice(0, 8);
  }

  // Assets that declare `sizeJitter` (e.g. trees) get independent per-axis size
  // multipliers in [1-j, 1+j] at creation time. The result is stored in the
  // tile's width/height, so each tree's size is permanent. Returns base dims
  // unchanged for assets without jitter.
  _jitterDims(asset, baseW, baseH) {
    const j = asset && typeof asset.sizeJitter === 'number' ? asset.sizeJitter : 0;
    if (!j) return { width: baseW, height: baseH };
    const rw = 1 + (Math.random() * 2 - 1) * j;
    const rh = 1 + (Math.random() * 2 - 1) * j;
    return { width: Math.round(baseW * rw), height: Math.round(baseH * rh) };
  }

  // Called when an asset is picked. Initializes a draft tile centered on canvas.
  // Uses a 4x scale on natural pixels to match the project's typical render scale —
  // a 32-px sprite would be invisible at native size in 1080-baseline coords.
  // Some assets ship pre-scaled (e.g. path_midpoint.png at 576x344) — those declare
  // `editorScale` in PLATFORM_ASSETS and we honor that instead.
  startPlacing(asset, naturalWidth, naturalHeight) {
    const BASELINE_WIDTH = 1080;
    const BASELINE_HEIGHT = 1080;
    // Per-asset overrides win. Falls back to natural × editorScale (default 4×).
    const hasExplicit = typeof asset.editorWidth === 'number' && typeof asset.editorHeight === 'number';
    const SCALE = typeof asset.editorScale === 'number' ? asset.editorScale : 4;
    const w = hasExplicit ? asset.editorWidth : (naturalWidth || 64) * SCALE;
    const h = hasExplicit ? asset.editorHeight : (naturalHeight || 64) * SCALE;
    // Per-asset size jitter (e.g. trees ±15% per axis), permanent for this tile.
    const dims = this._jitterDims(asset, w, h);
    // New placements go ON TOP of everything at this location — a fixed default
    // (the old zIndex 50) buried new tiles invisibly under the z-2100+ ground
    // tiles, and clicks couldn't reach them (highest z wins the hit-test).
    const tiles = this.tilesByLocation.get(this.currentLocation) || [];
    const overrides = this.entityOverridesByLocation.get(this.currentLocation) || [];
    const maxZ = Math.max(0, ...tiles.map(t => t.zIndex || 0), ...overrides.map(o => o.zIndex || 0));
    this.draftTile = {
      platformAssetId: asset.id,
      x: BASELINE_WIDTH / 2 - dims.width / 2,
      y: BASELINE_HEIGHT / 2 - dims.height / 2,
      width: dims.width,
      height: dims.height,
      zIndex: maxZ + 1
    };
    this.mode = 'placing';
    this.selectedTileId = null;
    this._bumpRecent(asset.id);
  }

  cancelPlacing() {
    this.draftTile = null;
    if (this.mode === 'placing') this.mode = 'idle';
  }

  selectTile(tileId) {
    this.multiSelected = [];
    this._setPrimaryTile(tileId);
  }

  _setPrimaryTile(tileId) {
    this.selectedKind = 'tile';
    this.selectedTileId = tileId;
    this.selectedEntityId = null;
    this.selectedEntityDims = null;
    this.alignArmed = false;
    this.selectionIsFreshCopy = false;
    this.mode = 'selected';
    this.draftTile = null;
  }

  // entity here is the merged entity (with override applied) so we capture current size.
  selectEntity(entity) {
    this.multiSelected = [];
    this._setPrimaryEntity({
      entityId: entity.id,
      dims: {
        x: entity.x, y: entity.y, width: entity.width, height: entity.height,
        zIndex: entity.zIndex || 0
      }
    });
  }

  _setPrimaryEntity(entry) {
    this.selectedKind = 'entity';
    this.selectedEntityId = entry.entityId;
    this.selectedEntityDims = { ...entry.dims };
    this.selectedTileId = null;
    this.alignArmed = false;
    this.selectionIsFreshCopy = false;
    this.mode = 'selected';
    this.draftTile = null;
  }

  deselect() {
    this.selectedKind = null;
    this.selectedTileId = null;
    this.selectedEntityId = null;
    this.selectedEntityDims = null;
    this.multiSelected = [];
    this.alignArmed = false;
    this.selectionIsFreshCopy = false;
    this._clickCycle = null;
    if (this.mode === 'selected') this.mode = 'idle';
  }

  // Shift+click: toggle a tile/entity in or out of the multi-selection set.
  // Starting set is seeded from the current single selection. The toggled-in item
  // becomes the primary; removing the primary promotes the last remaining entry.
  toggleMultiSelect(locationId, tileHit, entityHit) {
    if (!tileHit && !entityHit) return; // shift-click on empty space: no-op
    // Seed from the current single selection so shift-clicking a second item
    // naturally forms a pair.
    if (this.multiSelected.length === 0 && this.mode === 'selected') {
      if (this.selectedKind === 'tile' && this.selectedTileId) {
        this.multiSelected = [{ kind: 'tile', tileId: this.selectedTileId }];
      } else if (this.selectedKind === 'entity' && this.selectedEntityId && this.selectedEntityDims) {
        this.multiSelected = [{ kind: 'entity', entityId: this.selectedEntityId, dims: { ...this.selectedEntityDims } }];
      }
    }
    const hit = tileHit
      ? { kind: 'tile', tileId: tileHit._id }
      : {
          kind: 'entity',
          entityId: entityHit.id,
          dims: {
            x: entityHit.x, y: entityHit.y, width: entityHit.width, height: entityHit.height,
            zIndex: entityHit.zIndex || 0
          }
        };
    const idx = this.multiSelected.findIndex(s => hit.kind === 'tile'
      ? (s.kind === 'tile' && s.tileId === hit.tileId)
      : (s.kind === 'entity' && s.entityId === hit.entityId));
    if (idx >= 0) {
      const next = this.multiSelected.slice();
      next.splice(idx, 1);
      this.multiSelected = next;
      if (next.length === 0) { this.deselect(); return; }
      const wasPrimary = hit.kind === 'tile'
        ? this.selectedTileId === hit.tileId
        : this.selectedEntityId === hit.entityId;
      if (wasPrimary) this._promote(next[next.length - 1]);
    } else {
      this.multiSelected = [...this.multiSelected, hit];
      this._promote(hit);
    }
  }

  _promote(entry) {
    if (entry.kind === 'tile') this._setPrimaryTile(entry.tileId);
    else this._setPrimaryEntity(entry);
  }

  // --- Undo stack ---

  // Push a deep-copy snapshot of all editable state for `locationId` onto the undo stack.
  _pushSnapshot(locationId) {
    const stack = this._undoStacks.get(locationId) || [];
    const tiles = (this.tilesByLocation.get(locationId) || []).map(t => ({ ...t }));
    const overrides = (this.entityOverridesByLocation.get(locationId) || []).map(o => ({ ...o }));
    const hidden = (this.hiddenEntityIdsByLocation.get(locationId) || []).slice();
    stack.push({ tiles, overrides, hidden });
    this._undoStacks.set(locationId, stack);
  }

  // Undo is pure-local now: restore the snapshot into the local maps and let the
  // batched flush persist it. Snapshot tiles keep their (possibly local-) ids.
  undo(locationId) {
    const stack = this._undoStacks.get(locationId);
    if (!stack || stack.length === 0) return;
    const snapshot = stack.pop();
    this._undoStacks.set(locationId, stack);
    this.tilesByLocation.set(locationId, snapshot.tiles.map(t => ({ ...t })));
    this.entityOverridesByLocation.set(locationId, snapshot.overrides.map(o => ({ ...o })));
    this.hiddenEntityIdsByLocation.set(locationId, snapshot.hidden.slice());
    this.deselect();
    this._markDirty(locationId);
  }

  // --- Server interactions ---

  isOverlayLoaded(locationId) {
    return this.overlayPrefetchDone || this.overlayLoadedLocations.has(locationId);
  }

  // Startup prefetch: pull every location's overlay in one round trip while the
  // rest of the app is still loading, so map pages render DB content on their
  // very first paint. Fired (without await) from the websocket connect handler.
  async prefetchAllOverlays() {
    try {
      const data = await WebSocketService.emit('room-editor:get-all-overlays', {});
      runInAction(() => {
        for (const o of (data?.overlays || [])) {
          this.overlayLoadedLocations.add(o.locationId);
          // Never clobber unsaved local edits (e.g. on reconnect mid-session).
          if (this._dirtyLocations.has(o.locationId)) continue;
          this.tilesByLocation.set(o.locationId, o.tiles || []);
          this.entityOverridesByLocation.set(o.locationId, o.entityOverrides || []);
          this.hiddenEntityIdsByLocation.set(o.locationId, o.hiddenEntityIds || []);
        }
        this.overlayPrefetchDone = true;
      });
    } catch (err) {
      // Non-fatal: per-location fetchOverlay (RoomEditor mount) still gates each map.
      console.error('Overlay prefetch failed:', err);
    }
  }

  async fetchOverlay(locationId) {
    try {
      const data = await WebSocketService.emit('room-editor:get-overlay', { locationId });
      runInAction(() => {
        this.overlayLoadedLocations.add(locationId);
        // Never clobber unsaved local edits — local state is newer than the
        // server while dirty; the flush will reconcile, not the fetch.
        if (this._dirtyLocations.has(locationId)) return;
        this.tilesByLocation.set(locationId, data?.tiles || []);
        this.entityOverridesByLocation.set(locationId, data?.entityOverrides || []);
        this.hiddenEntityIdsByLocation.set(locationId, data?.hiddenEntityIds || []);
      });
    } catch (err) {
      console.error('Failed to fetch room overlay:', err);
    }
  }

  commitPlacement(locationId, x, y) {
    if (!this.draftTile) return;
    this._pushSnapshot(locationId);
    const draft = this.draftTile;
    // Center the tile on the click, then snap top-left to the grid.
    const placed = {
      _id: this._nextLocalId(),
      platformAssetId: draft.platformAssetId,
      x: snap(x - draft.width / 2),
      y: snap(y - draft.height / 2),
      width: draft.width,
      height: draft.height,
      zIndex: draft.zIndex || 0
    };
    const existing = this.tilesByLocation.get(locationId) || [];
    this.tilesByLocation.set(locationId, [...existing, placed]);
    this.draftTile = null;
    // Select the freshly placed tile so it can be nudged/re-layered immediately.
    this.selectTile(placed._id);
    this._markDirty(locationId);
  }

  // R shortcut: place a copy of the most recently created overlay tile centered
  // under the pointer. Tiles are appended on placement, so the last element is the
  // most recently created. Copies the source tile's asset, size, and zIndex;
  // snaps to the grid like commitPlacement. Instant — pure local + batched flush.
  placeCopyOfLastTile(locationId) {
    const pointer = this._pointer;
    if (!pointer) return;
    const tiles = this.tilesByLocation.get(locationId) || [];
    if (tiles.length === 0) return;
    const src = tiles[tiles.length - 1];
    this._pushSnapshot(locationId);
    // Jittered assets re-roll a fresh size per stamp, anchored to the asset's
    // BASE dims (not the source tile's) so chained stamps don't drift. Other
    // assets copy the source's size exactly.
    const asset = PLATFORM_ASSETS.find(a => a.id === src.platformAssetId);
    const dims = asset && typeof asset.sizeJitter === 'number'
      ? this._jitterDims(asset, asset.editorWidth ?? src.width, asset.editorHeight ?? src.height)
      : { width: src.width, height: src.height };
    const placed = {
      _id: this._nextLocalId(),
      platformAssetId: src.platformAssetId,
      x: snap(pointer.x - dims.width / 2),
      y: snap(pointer.y - dims.height / 2),
      width: dims.width,
      height: dims.height,
      zIndex: src.zIndex || 0
    };
    this.tilesByLocation.set(locationId, [...tiles, placed]);
    // Select the copy so it can be nudged with arrows right away.
    this.selectTile(placed._id);
    this._bumpRecent(src.platformAssetId);
    this._markDirty(locationId);
  }

  _markSelectionAsFreshCopy() {
    this.selectionIsFreshCopy = true;
  }

  // C shortcut: duplicate the selection in place (same x/y/size/zIndex) and select
  // the copy so it can be nudged off the original right away. Overlay tiles clone
  // 1:1; hardcoded entities clone *visually* as an overlay tile, which requires a
  // platformAssetId to know what image to draw (no-op without one).
  // Instant and race-free: pure local append + batched flush — the selection
  // switches to the copy synchronously, so immediate arrow/z input always hits it.
  copySelectedInPlace(locationId) {
    if (this.multiSelected.length > 1) return this._copyMulti(locationId);
    let payload = null;
    if (this.selectedKind === 'tile' && this.selectedTileId) {
      const tiles = this.tilesByLocation.get(locationId) || [];
      const src = tiles.find(t => t._id === this.selectedTileId);
      if (!src) return;
      payload = {
        platformAssetId: src.platformAssetId,
        x: src.x, y: src.y, width: src.width, height: src.height,
        zIndex: src.zIndex || 0
      };
    } else if (this.selectedKind === 'entity' && this.selectedEntityId && this.selectedEntityDims) {
      const entities = this._selectableEntitiesByLocation.get(locationId) || [];
      const src = entities.find(e => e.id === this.selectedEntityId);
      if (!src || !src.platformAssetId) return;
      const dims = this.selectedEntityDims;
      payload = {
        platformAssetId: src.platformAssetId,
        x: dims.x, y: dims.y, width: dims.width, height: dims.height,
        zIndex: dims.zIndex || 0
      };
    }
    if (!payload) return;
    this._pushSnapshot(locationId);
    const placed = { _id: this._nextLocalId(), ...payload };
    const existing = this.tilesByLocation.get(locationId) || [];
    this.tilesByLocation.set(locationId, [...existing, placed]);
    this.selectTile(placed._id);
    // White selection circle until deselected — visual confirmation the copy
    // landed (it sits exactly on the original, so color is the only tell).
    this._markSelectionAsFreshCopy();
    this._bumpRecent(payload.platformAssetId);
    this._markDirty(locationId);
  }

  // Routed from MapCanvas's handleCanvasClick when editModeActive.
  // Coords are already in 1080-baseline canvas space (portrait/mobile transform handled upstream).
  // baseEntities is the post-applyEntityEdits hardcoded list (overrides applied, hidden filtered)
  // so hit-tests find entities at their currently-rendered position.
  onCanvasClick(locationId, x, y, baseEntities = [], opts = {}) {
    // All hits under the cursor, sorted to match canvas render order top-first:
    // MapCanvas sorts drawables by zIndex ascending (stable) with overlay tiles
    // appended after hardcoded entities — so highest zIndex (ties → later-drawn)
    // is what the dev actually sees on top. Grass is excluded (mass-generated);
    // anything else with an id is fair game, even without a platformAssetId —
    // codegen notes unresolved ids but the dev can still iterate.
    const tiles = this.tilesByLocation.get(locationId) || [];
    const candidates = [
      ...baseEntities
        .filter(e => e && e.id && !e.id.startsWith('grass-'))
        .map((e, i) => ({ kind: 'entity', obj: e, rank: i })),
      ...tiles.map((t, i) => ({ kind: 'tile', obj: t, rank: baseEntities.length + i }))
    ];
    const hits = [];
    for (const c of candidates) {
      const o = c.obj;
      if (x < o.x || x > o.x + o.width || y < o.y || y > o.y + o.height) continue;
      hits.push({ ...c, z: o.zIndex ?? 0 });
    }
    hits.sort((a, b) => (b.z - a.z) || (b.rank - a.rank));
    const top = hits[0] || null;
    const tileHit = top && top.kind === 'tile' ? top.obj : null;
    const entityHit = top && top.kind === 'entity' ? top.obj : null;

    // Shift+click: build up / trim down the multi-selection (not while placing or
    // align-armed — those own the click).
    if (opts.shift && (this.mode === 'idle' || this.mode === 'selected') && !this.alignArmed) {
      this.toggleMultiSelect(locationId, tileHit, entityHit);
      return;
    }

    if (this.mode === 'placing') {
      // A click while placing ALWAYS commits the placement. (This used to select
      // any tile under the cursor instead — fine on an empty map, but once the
      // ground is fully tiled every click hit grass, silently discarding the
      // draft. Esc is the way to cancel a placement.)
      this.commitPlacement(locationId, x, y);
      return;
    }

    // Align mode: this click picks the target — move the selection to its exact
    // x/y. Clicking empty space (or the selection itself) just disarms.
    if (this.mode === 'selected' && this.alignArmed) {
      this.alignArmed = false;
      const target = tileHit || entityHit;
      const isSelf = (tileHit && tileHit._id === this.selectedTileId)
                  || (entityHit && entityHit.id === this.selectedEntityId);
      if (target && !isSelf) {
        this.alignSelectedTo(locationId, target.x, target.y);
      }
      return;
    }

    // Plain click (idle, selected, or group): select what's under the cursor.
    // Clicks never move things. Repeated clicks in (nearly) the same spot cycle
    // down through the stack of overlapping items, wrapping back to the top.
    this._selectFromClick(locationId, x, y, hits);
  }

  // Click-to-select with click-through cycling. `hits` is the stack under the
  // cursor, top-first. A click within CLICK_CYCLE_TOLERANCE px of the previous
  // selection click — while the item it selected is still selected — advances to
  // the next item down (wrapping). Anywhere else starts fresh at the top.
  _selectFromClick(locationId, x, y, hits) {
    if (hits.length === 0) {
      this._clickCycle = null;
      this.deselect();
      return;
    }
    const TOL = 5;
    const cycle = this._clickCycle;
    const near = cycle && Math.abs(x - cycle.x) <= TOL && Math.abs(y - cycle.y) <= TOL;
    let index = 0;
    if (near && this.mode === 'selected') {
      // Only continue the cycle if our previous pick is still the selection —
      // if the dev Tab-cycled or selected elsewhere in between, start at the top.
      const prev = hits[cycle.index % hits.length];
      const prevStillSelected = prev && (prev.kind === 'tile'
        ? (this.selectedKind === 'tile' && prev.obj._id === this.selectedTileId)
        : (this.selectedKind === 'entity' && prev.obj.id === this.selectedEntityId));
      if (prevStillSelected) index = (cycle.index + 1) % hits.length;
    }
    // Anchor on the first click's position so micro-jitter doesn't drift the window.
    this._clickCycle = near
      ? { x: cycle.x, y: cycle.y, index }
      : { x, y, index };
    const target = hits[index];
    if (target.kind === 'tile') this.selectTile(target.obj._id);
    else this.selectEntity(target.obj);
  }

  // ---- Entity-side mutations (work via entity overrides + hide list) ----

  _nudgeEntity(locationId, dx, dy, opts = {}) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    this._pushSnapshot(locationId);
    const dims = this.selectedEntityDims;
    const useSnap = opts.snap !== false;
    const baseX = useSnap ? snap(dims.x) : dims.x;
    const baseY = useSnap ? snap(dims.y) : dims.y;
    const step = useSnap ? TILE_SIZE : 1;
    const next = { entityId: this.selectedEntityId, x: baseX + dx * step, y: baseY + dy * step, width: dims.width, height: dims.height, zIndex: dims.zIndex };
    this._applyOverrideLocal(locationId, next);
    this.selectedEntityDims = { x: next.x, y: next.y, width: next.width, height: next.height, zIndex: next.zIndex };
    this._markDirty(locationId);
  }

  _bumpEntityZIndex(locationId, delta) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    this._pushSnapshot(locationId);
    const dims = this.selectedEntityDims;
    const next = { entityId: this.selectedEntityId, x: dims.x, y: dims.y, width: dims.width, height: dims.height, zIndex: (dims.zIndex || 0) + delta };
    this._applyOverrideLocal(locationId, next);
    this.selectedEntityDims = { ...dims, zIndex: next.zIndex };
    this._markDirty(locationId);
  }

  _setEntityZIndex(locationId, value) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    this._pushSnapshot(locationId);
    const dims = this.selectedEntityDims;
    const next = { entityId: this.selectedEntityId, x: dims.x, y: dims.y, width: dims.width, height: dims.height, zIndex: value };
    this._applyOverrideLocal(locationId, next);
    this.selectedEntityDims = { ...dims, zIndex: value };
    this._markDirty(locationId);
  }

  _applyOverrideLocal(locationId, override) {
    const overrides = this.entityOverridesByLocation.get(locationId) || [];
    // Filter-all-then-push (not replace-first) so local state can never hold
    // duplicate entries for one entity — mirrors the backend handler.
    const next = overrides.filter(o => o.entityId !== override.entityId);
    next.push(override);
    runInAction(() => { this.entityOverridesByLocation.set(locationId, next); });
  }

  _hideSelectedEntity(locationId) {
    if (!this.selectedEntityId) return;
    const entityId = this.selectedEntityId;
    this._pushSnapshot(locationId);
    const hidden = (this.hiddenEntityIdsByLocation.get(locationId) || []).slice();
    if (!hidden.includes(entityId)) hidden.push(entityId);
    this.hiddenEntityIdsByLocation.set(locationId, hidden);
    this.selectedKind = null;
    this.selectedEntityId = null;
    this.selectedEntityDims = null;
    if (this.mode === 'selected') this.mode = 'idle';
    this._markDirty(locationId);
  }

  // Optimistic z-index bump of the selected tile (delta usually ±1).
  bumpSelectedZIndex(locationId, delta) {
    if (this.multiSelected.length > 1) return this._multiZIndex(locationId, z => z + delta);
    if (this.selectedKind === 'entity') return this._bumpEntityZIndex(locationId, delta);
    if (!this.selectedTileId) return;
    const tiles = this.tilesByLocation.get(locationId) || [];
    const idx = tiles.findIndex(t => t._id === this.selectedTileId);
    if (idx < 0) return;
    this._pushSnapshot(locationId);
    const tile = tiles[idx];
    const next = { ...tile, zIndex: (tile.zIndex || 0) + delta };
    const newTiles = tiles.slice();
    newTiles[idx] = next;
    this.tilesByLocation.set(locationId, newTiles);
    this._markDirty(locationId);
  }

  // Send selected (tile or entity) to front/back relative to all known z-indexes.
  sendSelectedToFront(locationId) {
    const tiles = this.tilesByLocation.get(locationId) || [];
    const overrides = this.entityOverridesByLocation.get(locationId) || [];
    const max = Math.max(0,
      ...tiles.map(t => t.zIndex || 0),
      ...overrides.map(o => o.zIndex || 0)
    );
    if (this.multiSelected.length > 1) return this._multiZIndex(locationId, () => max + 1);
    if (this.selectedKind === 'tile' && this.selectedTileId) this._setSelectedZIndex(locationId, max + 1);
    else if (this.selectedKind === 'entity' && this.selectedEntityId) this._setEntityZIndex(locationId, max + 1);
  }

  sendSelectedToBack(locationId) {
    const tiles = this.tilesByLocation.get(locationId) || [];
    const overrides = this.entityOverridesByLocation.get(locationId) || [];
    const min = Math.min(0,
      ...tiles.map(t => t.zIndex || 0),
      ...overrides.map(o => o.zIndex || 0)
    );
    if (this.multiSelected.length > 1) return this._multiZIndex(locationId, () => min - 1);
    if (this.selectedKind === 'tile' && this.selectedTileId) this._setSelectedZIndex(locationId, min - 1);
    else if (this.selectedKind === 'entity' && this.selectedEntityId) this._setEntityZIndex(locationId, min - 1);
  }

  _setSelectedZIndex(locationId, value) {
    const tiles = this.tilesByLocation.get(locationId) || [];
    const idx = tiles.findIndex(t => t._id === this.selectedTileId);
    if (idx < 0) return;
    this._pushSnapshot(locationId);
    const next = { ...tiles[idx], zIndex: value };
    const newTiles = tiles.slice();
    newTiles[idx] = next;
    this.tilesByLocation.set(locationId, newTiles);
    this._markDirty(locationId);
  }

  // Local nudge of the selected tile (persisted by the batched flush).
  // dx/dy are integer steps. When opts.snap is true (default) each step is one TILE_SIZE
  // and the tile's current position snaps to the grid before stepping. When false, each
  // step is a single baseline pixel — Shift+arrow's "fine adjustment" path.
  nudgeSelected(locationId, dx, dy, opts = {}) {
    const useSnap = opts.snap !== false;
    if (this.multiSelected.length > 1) return this._nudgeMulti(locationId, dx, dy, opts);
    if (this.selectedKind === 'entity') return this._nudgeEntity(locationId, dx, dy, opts);
    if (!this.selectedTileId) return;
    const tiles = this.tilesByLocation.get(locationId) || [];
    const idx = tiles.findIndex(t => t._id === this.selectedTileId);
    if (idx < 0) return;
    this._pushSnapshot(locationId);
    const tile = tiles[idx];
    const baseX = useSnap ? snap(tile.x) : tile.x;
    const baseY = useSnap ? snap(tile.y) : tile.y;
    const step = useSnap ? TILE_SIZE : 1;
    const next = { ...tile, x: baseX + dx * step, y: baseY + dy * step };
    const newTiles = tiles.slice();
    newTiles[idx] = next;
    this.tilesByLocation.set(locationId, newTiles);
    this._markDirty(locationId);
  }

  // Group nudge: move every selected item by the same delta so the group's
  // relative layout is preserved (no per-item grid re-snap — snapping each item
  // independently would distort offsets between items that weren't grid-aligned).
  _nudgeMulti(locationId, dx, dy, opts = {}) {
    const useSnap = opts.snap !== false;
    const step = useSnap ? TILE_SIZE : 1;
    this._pushSnapshot(locationId);
    const tiles = (this.tilesByLocation.get(locationId) || []).slice();
    let tilesChanged = false;
    for (const entry of this.multiSelected) {
      if (entry.kind === 'tile') {
        const idx = tiles.findIndex(t => t._id === entry.tileId);
        if (idx < 0) continue;
        const t = tiles[idx];
        const next = { ...t, x: t.x + dx * step, y: t.y + dy * step };
        tiles[idx] = next;
        tilesChanged = true;
      } else {
        const dims = entry.dims;
        const next = {
          entityId: entry.entityId,
          x: dims.x + dx * step, y: dims.y + dy * step,
          width: dims.width, height: dims.height, zIndex: dims.zIndex || 0
        };
        entry.dims = { x: next.x, y: next.y, width: next.width, height: next.height, zIndex: next.zIndex };
        this._applyOverrideLocal(locationId, next);
        if (this.selectedEntityId === entry.entityId) this.selectedEntityDims = { ...entry.dims };
      }
    }
    if (tilesChanged) this.tilesByLocation.set(locationId, tiles);
    this._markDirty(locationId);
  }

  // Group zIndex: apply compute(currentZ) to every selected item. One snapshot.
  _multiZIndex(locationId, compute) {
    this._pushSnapshot(locationId);
    const tiles = (this.tilesByLocation.get(locationId) || []).slice();
    let tilesChanged = false;
    for (const entry of this.multiSelected) {
      if (entry.kind === 'tile') {
        const idx = tiles.findIndex(t => t._id === entry.tileId);
        if (idx < 0) continue;
        const t = tiles[idx];
        const next = { ...t, zIndex: compute(t.zIndex || 0) };
        tiles[idx] = next;
        tilesChanged = true;
      } else {
        const dims = entry.dims;
        const next = {
          entityId: entry.entityId,
          x: dims.x, y: dims.y, width: dims.width, height: dims.height,
          zIndex: compute(dims.zIndex || 0)
        };
        entry.dims = { ...dims, zIndex: next.zIndex };
        this._applyOverrideLocal(locationId, next);
        if (this.selectedEntityId === entry.entityId) this.selectedEntityDims = { ...entry.dims };
      }
    }
    if (tilesChanged) this.tilesByLocation.set(locationId, tiles);
    this._markDirty(locationId);
  }

  // Group delete: overlay tiles are removed, hardcoded entities are hidden.
  _deleteMulti(locationId) {
    this._pushSnapshot(locationId);
    const entries = this.multiSelected.slice();
    this.deselect();
    const tileIds = new Set(entries.filter(e => e.kind === 'tile').map(e => e.tileId));
    const entityIds = entries.filter(e => e.kind === 'entity').map(e => e.entityId);
    const existing = this.tilesByLocation.get(locationId) || [];
    this.tilesByLocation.set(locationId, existing.filter(t => !tileIds.has(t._id)));
    if (entityIds.length > 0) {
      const hidden = (this.hiddenEntityIdsByLocation.get(locationId) || []).slice();
      for (const id of entityIds) if (!hidden.includes(id)) hidden.push(id);
      this.hiddenEntityIdsByLocation.set(locationId, hidden);
    }
    this._markDirty(locationId);
  }

  // Group copy-in-place: clone every selected item (entities clone visually as
  // overlay tiles, same caveat as the single-item path). The copies become the
  // new selection so they can be nudged off the originals as a group.
  _copyMulti(locationId) {
    const tiles = this.tilesByLocation.get(locationId) || [];
    const entities = this._selectableEntitiesByLocation.get(locationId) || [];
    const payloads = [];
    for (const entry of this.multiSelected) {
      if (entry.kind === 'tile') {
        const src = tiles.find(t => t._id === entry.tileId);
        if (src) {
          payloads.push({
            platformAssetId: src.platformAssetId,
            x: src.x, y: src.y, width: src.width, height: src.height,
            zIndex: src.zIndex || 0
          });
        }
      } else {
        const src = entities.find(e => e.id === entry.entityId);
        if (src && src.platformAssetId) {
          payloads.push({
            platformAssetId: src.platformAssetId,
            x: entry.dims.x, y: entry.dims.y, width: entry.dims.width, height: entry.dims.height,
            zIndex: entry.dims.zIndex || 0
          });
        }
      }
    }
    if (payloads.length === 0) return;
    this._pushSnapshot(locationId);
    const copies = payloads.map(payload => ({ _id: this._nextLocalId(), ...payload }));
    const existing = this.tilesByLocation.get(locationId) || [];
    this.tilesByLocation.set(locationId, [...existing, ...copies]);
    this._setPrimaryTile(copies[copies.length - 1]._id);
    this.multiSelected = copies.map(t => ({ kind: 'tile', tileId: t._id }));
    // White circles on all the copies until deselected (see copySelectedInPlace).
    this.selectionIsFreshCopy = true;
    this._bumpRecent(payloads[payloads.length - 1].platformAssetId);
    this._markDirty(locationId);
  }

  deleteSelected(locationId) {
    if (this.multiSelected.length > 1) return this._deleteMulti(locationId);
    if (this.selectedKind === 'entity') return this._hideSelectedEntity(locationId);
    if (!this.selectedTileId) return;
    this._pushSnapshot(locationId);
    const tileId = this.selectedTileId;
    const existing = this.tilesByLocation.get(locationId) || [];
    this.tilesByLocation.set(locationId, existing.filter(t => t._id !== tileId));
    this.selectedTileId = null;
    this.mode = 'idle';
    this._markDirty(locationId);
  }
}

export default new RoomEditorStore();
