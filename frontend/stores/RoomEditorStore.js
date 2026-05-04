import { makeAutoObservable, runInAction } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

// Editor grid: every placement and every default-arrow nudge snaps to this many
// baseline pixels. Shift+arrow bypasses the snap for sub-tile fine-tuning.
export const TILE_SIZE = 32;
const snap = (v) => Math.round(v / TILE_SIZE) * TILE_SIZE;

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
  // Most-recently-placed platformAssetIds, newest first, capped at 8.
  recentAssetIds = [];
  // 'idle' | 'picking' | 'placing' | 'selected'
  mode = 'idle';
  // When true, MapCanvas suppresses its own click/move handlers so the editor owns the canvas.
  editModeActive = false;
  currentLocation = null;
  // Tile being placed (not yet committed): { platformAssetId, x, y, width, height, zIndex }
  draftTile = null;
  // Selection: either an overlay tile (by _id) or a hardcoded entity (by id).
  selectedKind = null; // 'tile' | 'entity' | null
  selectedTileId = null;
  selectedEntityId = null;
  // Cached dimensions of the currently-selected hardcoded entity. Needed because
  // overrides include width/height and the entity object is owned by MapCanvas.
  selectedEntityDims = null; // { x, y, width, height, zIndex }
  // Once the dev has touched an arrow key on the current selection, clicking the
  // canvas should drop the selection rather than re-move the tile. Reset on
  // any new selection.
  _keyboardMoveActive = false;

  constructor() {
    makeAutoObservable(this);
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

  toggleEditMode() {
    this.editModeActive = !this.editModeActive;
    if (!this.editModeActive) {
      this.mode = 'idle';
      this.draftTile = null;
      this.selectedTileId = null;
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
    this.draftTile = {
      platformAssetId: asset.id,
      x: BASELINE_WIDTH / 2 - w / 2,
      y: BASELINE_HEIGHT / 2 - h / 2,
      width: w,
      height: h,
      zIndex: 50
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
    this.selectedKind = 'tile';
    this.selectedTileId = tileId;
    this.selectedEntityId = null;
    this._keyboardMoveActive = false;
    this.mode = 'selected';
    this.draftTile = null;
  }

  // entity here is the merged entity (with override applied) so we capture current size.
  selectEntity(entity) {
    this.selectedKind = 'entity';
    this.selectedEntityId = entity.id;
    this.selectedEntityDims = {
      x: entity.x, y: entity.y, width: entity.width, height: entity.height,
      zIndex: entity.zIndex || 0
    };
    this.selectedTileId = null;
    this._keyboardMoveActive = false;
    this.mode = 'selected';
    this.draftTile = null;
  }

  deselect() {
    this.selectedKind = null;
    this.selectedTileId = null;
    this.selectedEntityId = null;
    this.selectedEntityDims = null;
    this._keyboardMoveActive = false;
    if (this.mode === 'selected') this.mode = 'idle';
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

  async undo(locationId) {
    const stack = this._undoStacks.get(locationId);
    if (!stack || stack.length === 0) return;
    const snapshot = stack.pop();
    this._undoStacks.set(locationId, stack);
    try {
      const data = await WebSocketService.emit('room-editor:set-overlay', {
        sessionId: SessionStore.sessionId,
        locationId,
        tiles: snapshot.tiles.map(t => ({
          platformAssetId: t.platformAssetId,
          x: t.x, y: t.y, width: t.width, height: t.height, zIndex: t.zIndex || 0
        })),
        entityOverrides: snapshot.overrides.map(o => ({
          entityId: o.entityId, x: o.x, y: o.y, width: o.width, height: o.height, zIndex: o.zIndex || 0
        })),
        hiddenEntityIds: snapshot.hidden.slice()
      });
      runInAction(() => {
        this.tilesByLocation.set(locationId, data?.tiles || []);
        this.entityOverridesByLocation.set(locationId, data?.entityOverrides || []);
        this.hiddenEntityIdsByLocation.set(locationId, data?.hiddenEntityIds || []);
        // Drop selection — _ids are reissued; entity ids may now be hidden/unhidden.
        this.selectedKind = null;
        this.selectedTileId = null;
        this.selectedEntityId = null;
        if (this.mode === 'selected') this.mode = 'idle';
      });
    } catch (err) {
      console.error('Undo failed:', err);
    }
  }

  // --- Server interactions ---

  async fetchOverlay(locationId) {
    try {
      const data = await WebSocketService.emit('room-editor:get-overlay', { locationId });
      runInAction(() => {
        this.tilesByLocation.set(locationId, data?.tiles || []);
        this.entityOverridesByLocation.set(locationId, data?.entityOverrides || []);
        this.hiddenEntityIdsByLocation.set(locationId, data?.hiddenEntityIds || []);
      });
    } catch (err) {
      console.error('Failed to fetch room overlay:', err);
    }
  }

  async commitPlacement(locationId, x, y) {
    if (!this.draftTile) return;
    this._pushSnapshot(locationId);
    const draft = this.draftTile;
    // Center the tile on the click, then snap top-left to the grid.
    const placed = {
      ...draft,
      x: snap(x - draft.width / 2),
      y: snap(y - draft.height / 2)
    };
    try {
      const data = await WebSocketService.emit('room-editor:place-tile', {
        sessionId: SessionStore.sessionId,
        locationId,
        platformAssetId: placed.platformAssetId,
        x: placed.x,
        y: placed.y,
        width: placed.width,
        height: placed.height,
        zIndex: placed.zIndex
      });
      runInAction(() => {
        const existing = this.tilesByLocation.get(locationId) || [];
        this.tilesByLocation.set(locationId, [...existing, data.tile]);
        this.draftTile = null;
        this.mode = 'idle';
      });
    } catch (err) {
      console.error('Failed to place tile:', err);
    }
  }

  // Move the current selection (tile or entity) so its center sits at (x, y).
  // Routes to the appropriate backend handler.
  async commitMove(locationId, x, y) {
    if (this.selectedKind === 'entity') {
      return this._commitEntityMove(locationId, x, y);
    }
    if (!this.selectedTileId) return;
    const tiles = this.tilesByLocation.get(locationId) || [];
    const tile = tiles.find(t => t._id === this.selectedTileId);
    if (!tile) return;
    this._pushSnapshot(locationId);
    const newX = snap(x - tile.width / 2);
    const newY = snap(y - tile.height / 2);
    try {
      const data = await WebSocketService.emit('room-editor:move-tile', {
        sessionId: SessionStore.sessionId,
        locationId,
        tileId: this.selectedTileId,
        x: newX,
        y: newY
      });
      runInAction(() => {
        const next = tiles.map(t => t._id === this.selectedTileId ? data.tile : t);
        this.tilesByLocation.set(locationId, next);
        this.selectedTileId = null;
        this.mode = 'idle';
      });
    } catch (err) {
      console.error('Failed to move tile:', err);
    }
  }

  // Routed from MapCanvas's handleCanvasClick when editModeActive.
  // Coords are already in 1080-baseline canvas space (portrait/mobile transform handled upstream).
  // baseEntities is the post-applyEntityEdits hardcoded list (overrides applied, hidden filtered)
  // so hit-tests find entities at their currently-rendered position.
  onCanvasClick(locationId, x, y, baseEntities = []) {
    // Top-down hit-test: overlay tiles win first (they render above hardcoded entities
    // by convention since dev places them on top). Then hardcoded entities with platformAssetId.
    const tiles = this.tilesByLocation.get(locationId) || [];
    const tileHit = (() => {
      for (let i = tiles.length - 1; i >= 0; i--) {
        const t = tiles[i];
        if (x >= t.x && x <= t.x + t.width && y >= t.y && y <= t.y + t.height) return t;
      }
      return null;
    })();
    const entityHit = !tileHit ? (() => {
      // Iterate in reverse so later-defined entities (visually on top) win.
      // We only exclude obviously mass-generated tiles (grass) — anything else with
      // an id is fair game, even if it lacks a platformAssetId. Codegen will note
      // unresolved ids in its output but the dev can still iterate visually.
      for (let i = baseEntities.length - 1; i >= 0; i--) {
        const e = baseEntities[i];
        if (!e || !e.id) continue;
        if (e.id.startsWith('grass-')) continue;
        if (x >= e.x && x <= e.x + e.width && y >= e.y && y <= e.y + e.height) return e;
      }
      return null;
    })() : null;

    if (this.mode === 'placing') {
      if (tileHit) { this.selectTile(tileHit._id); return; }
      if (entityHit) { this.selectEntity(entityHit); return; }
      this.commitPlacement(locationId, x, y);
    } else if (this.mode === 'selected') {
      // Once the dev has used arrow keys to position the selection, clicks should
      // drop the selection instead of jumping the tile to the cursor.
      if (this._keyboardMoveActive) {
        this.deselect();
        return;
      }
      // Click on a different tile/entity → switch selection rather than move.
      if (tileHit && tileHit._id !== this.selectedTileId) { this.selectTile(tileHit._id); return; }
      if (entityHit && entityHit.id !== this.selectedEntityId) { this.selectEntity(entityHit); return; }
      this.commitMove(locationId, x, y);
    } else {
      if (tileHit) { this.selectTile(tileHit._id); return; }
      if (entityHit) { this.selectEntity(entityHit); return; }
      this.deselect();
    }
  }

  // ---- Entity-side mutations (work via entity overrides + hide list) ----

  async _commitEntityMove(locationId, x, y) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    const dims = this.selectedEntityDims;
    const newX = snap(x - dims.width / 2);
    const newY = snap(y - dims.height / 2);
    this._pushSnapshot(locationId);
    const next = { entityId: this.selectedEntityId, x: newX, y: newY, width: dims.width, height: dims.height, zIndex: dims.zIndex };
    this._applyOverrideLocal(locationId, next);
    runInAction(() => { this.selectedEntityDims = { x: newX, y: newY, width: dims.width, height: dims.height, zIndex: dims.zIndex }; });
    this._sendOverride(locationId, next);
    runInAction(() => { if (this.mode === 'selected') this.mode = 'idle'; this.selectedKind = null; this.selectedEntityId = null; this.selectedEntityDims = null; });
  }

  _nudgeEntity(locationId, dx, dy, opts = {}) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    this._keyboardMoveActive = true;
    this._pushSnapshot(locationId);
    const dims = this.selectedEntityDims;
    const useSnap = opts.snap !== false;
    const baseX = useSnap ? snap(dims.x) : dims.x;
    const baseY = useSnap ? snap(dims.y) : dims.y;
    const step = useSnap ? TILE_SIZE : 1;
    const next = { entityId: this.selectedEntityId, x: baseX + dx * step, y: baseY + dy * step, width: dims.width, height: dims.height, zIndex: dims.zIndex };
    this._applyOverrideLocal(locationId, next);
    runInAction(() => { this.selectedEntityDims = { x: next.x, y: next.y, width: next.width, height: next.height, zIndex: next.zIndex }; });
    this._sendOverride(locationId, next);
  }

  _bumpEntityZIndex(locationId, delta) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    this._pushSnapshot(locationId);
    const dims = this.selectedEntityDims;
    const next = { entityId: this.selectedEntityId, x: dims.x, y: dims.y, width: dims.width, height: dims.height, zIndex: (dims.zIndex || 0) + delta };
    this._applyOverrideLocal(locationId, next);
    runInAction(() => { this.selectedEntityDims = { ...dims, zIndex: next.zIndex }; });
    this._sendOverride(locationId, next);
  }

  _setEntityZIndex(locationId, value) {
    if (!this.selectedEntityId || !this.selectedEntityDims) return;
    this._pushSnapshot(locationId);
    const dims = this.selectedEntityDims;
    const next = { entityId: this.selectedEntityId, x: dims.x, y: dims.y, width: dims.width, height: dims.height, zIndex: value };
    this._applyOverrideLocal(locationId, next);
    runInAction(() => { this.selectedEntityDims = { ...dims, zIndex: value }; });
    this._sendOverride(locationId, next);
  }

  _applyOverrideLocal(locationId, override) {
    const overrides = this.entityOverridesByLocation.get(locationId) || [];
    const idx = overrides.findIndex(o => o.entityId === override.entityId);
    const next = overrides.slice();
    if (idx >= 0) next[idx] = override; else next.push(override);
    runInAction(() => { this.entityOverridesByLocation.set(locationId, next); });
  }

  _sendOverride(locationId, override) {
    WebSocketService.emit('room-editor:set-entity-override', {
      sessionId: SessionStore.sessionId,
      locationId,
      ...override
    }).catch(err => console.error('set-entity-override failed:', err));
  }

  async _hideSelectedEntity(locationId) {
    if (!this.selectedEntityId) return;
    const entityId = this.selectedEntityId;
    this._pushSnapshot(locationId);
    const hidden = (this.hiddenEntityIdsByLocation.get(locationId) || []).slice();
    if (!hidden.includes(entityId)) hidden.push(entityId);
    runInAction(() => {
      this.hiddenEntityIdsByLocation.set(locationId, hidden);
      this.selectedKind = null;
      this.selectedEntityId = null;
      this.selectedEntityDims = null;
      if (this.mode === 'selected') this.mode = 'idle';
    });
    try {
      await WebSocketService.emit('room-editor:hide-entity', {
        sessionId: SessionStore.sessionId, locationId, entityId
      });
    } catch (err) { console.error('hide-entity failed:', err); }
  }

  // Optimistic z-index bump of the selected tile (delta usually ±1).
  bumpSelectedZIndex(locationId, delta) {
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
    runInAction(() => {
      this.tilesByLocation.set(locationId, newTiles);
    });
    // move-tile handler accepts an optional zIndex; reuse it for zIndex-only updates.
    WebSocketService.emit('room-editor:move-tile', {
      sessionId: SessionStore.sessionId,
      locationId,
      tileId: this.selectedTileId,
      x: next.x,
      y: next.y,
      zIndex: next.zIndex
    }).catch(err => console.error('zIndex save failed:', err));
  }

  // Send selected (tile or entity) to front/back relative to all known z-indexes.
  sendSelectedToFront(locationId) {
    const tiles = this.tilesByLocation.get(locationId) || [];
    const overrides = this.entityOverridesByLocation.get(locationId) || [];
    const max = Math.max(0,
      ...tiles.map(t => t.zIndex || 0),
      ...overrides.map(o => o.zIndex || 0)
    );
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
    runInAction(() => {
      this.tilesByLocation.set(locationId, newTiles);
    });
    WebSocketService.emit('room-editor:move-tile', {
      sessionId: SessionStore.sessionId,
      locationId,
      tileId: this.selectedTileId,
      x: next.x,
      y: next.y,
      zIndex: next.zIndex
    }).catch(err => console.error('zIndex save failed:', err));
  }

  // Optimistic 1px nudge of the selected tile. Updates local state immediately
  // and fires a fire-and-forget move-tile WebSocket call.
  // dx/dy are integer steps. When opts.snap is true (default) each step is one TILE_SIZE
  // and the tile's current position snaps to the grid before stepping. When false, each
  // step is a single baseline pixel — Shift+arrow's "fine adjustment" path.
  nudgeSelected(locationId, dx, dy, opts = {}) {
    const useSnap = opts.snap !== false;
    if (this.selectedKind === 'entity') return this._nudgeEntity(locationId, dx, dy, opts);
    if (!this.selectedTileId) return;
    const tiles = this.tilesByLocation.get(locationId) || [];
    const idx = tiles.findIndex(t => t._id === this.selectedTileId);
    if (idx < 0) return;
    this._keyboardMoveActive = true;
    this._pushSnapshot(locationId);
    const tile = tiles[idx];
    const baseX = useSnap ? snap(tile.x) : tile.x;
    const baseY = useSnap ? snap(tile.y) : tile.y;
    const step = useSnap ? TILE_SIZE : 1;
    const next = { ...tile, x: baseX + dx * step, y: baseY + dy * step };
    const newTiles = tiles.slice();
    newTiles[idx] = next;
    runInAction(() => {
      this.tilesByLocation.set(locationId, newTiles);
    });
    WebSocketService.emit('room-editor:move-tile', {
      sessionId: SessionStore.sessionId,
      locationId,
      tileId: this.selectedTileId,
      x: next.x,
      y: next.y
    }).catch(err => console.error('nudge save failed:', err));
  }

  async deleteSelected(locationId) {
    if (this.selectedKind === 'entity') return this._hideSelectedEntity(locationId);
    if (!this.selectedTileId) return;
    this._pushSnapshot(locationId);
    const tileId = this.selectedTileId;
    try {
      await WebSocketService.emit('room-editor:delete-tile', {
        sessionId: SessionStore.sessionId,
        locationId,
        tileId
      });
      runInAction(() => {
        const existing = this.tilesByLocation.get(locationId) || [];
        this.tilesByLocation.set(locationId, existing.filter(t => t._id !== tileId));
        this.selectedTileId = null;
        this.mode = 'idle';
      });
    } catch (err) {
      console.error('Failed to delete tile:', err);
    }
  }
}

export default new RoomEditorStore();
