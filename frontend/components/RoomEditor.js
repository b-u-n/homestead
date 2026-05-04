import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import RoomEditorStore from '../stores/RoomEditorStore';
import FontSettingsStore from '../stores/FontSettingsStore';
import MinkyPanel from './MinkyPanel';
import WoolButton from './WoolButton';
import { PLATFORM_ASSETS, ASSET_CATEGORIES } from '../constants/platformAssets';

const BASELINE_WIDTH = 1080;
const BASELINE_HEIGHT = 1080;

// Cache natural image dimensions per platformAssetId so we know how big to draw a placed tile.
const _imageDimsCache = new Map();
function loadImageDims(asset) {
  return new Promise((resolve) => {
    if (_imageDimsCache.has(asset.id)) {
      resolve(_imageDimsCache.get(asset.id));
      return;
    }
    if (Platform.OS !== 'web' || !asset.image) {
      resolve({ w: 64, h: 64 });
      return;
    }
    const src = typeof asset.image === 'string'
      ? asset.image
      : asset.image.default || asset.image.uri || asset.image;
    const img = new window.Image();
    img.onload = () => {
      const dims = { w: img.naturalWidth, h: img.naturalHeight };
      _imageDimsCache.set(asset.id, dims);
      resolve(dims);
    };
    img.onerror = () => {
      const dims = { w: 64, h: 64 };
      _imageDimsCache.set(asset.id, dims);
      resolve(dims);
    };
    img.src = src;
  });
}

// Convert baseline coords to viewport (left, top, width, height) for absolute overlays.
function baselineToViewport(bx, by, bw, bh) {
  if (Platform.OS !== 'web') return null;
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / BASELINE_WIDTH;
  const scaleY = rect.height / BASELINE_HEIGHT;
  return {
    left: rect.left + bx * scaleX,
    top: rect.top + by * scaleY,
    width: bw * scaleX,
    height: bh * scaleY
  };
}

const RoomEditor = observer(({ location }) => {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!location) return;
    RoomEditorStore.setCurrentLocation(location);
    RoomEditorStore.fetchOverlay(location);
  }, [location]);

  // Re-render on resize so absolute overlays track the canvas position.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onResize = () => forceTick(t => t + 1);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, []);

  // Keyboard handler for editor shortcuts.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e) => {
      const m = RoomEditorStore.mode;
      // Ctrl/Cmd+Z → undo last mutation.
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        RoomEditorStore.undo(location);
        return;
      }
      // Esc cancels in placing/picking, deselects in selected.
      if (e.key === 'Escape') {
        if (m === 'placing') RoomEditorStore.cancelPlacing();
        else if (m === 'picking') RoomEditorStore.closePicker();
        else if (m === 'selected') RoomEditorStore.deselect();
        return;
      }
      // Enter also deselects.
      if (e.key === 'Enter' && m === 'selected') {
        RoomEditorStore.deselect();
        return;
      }
      // Delete with confirmation.
      if ((e.key === 'Delete' || e.key === 'Backspace') && m === 'selected') {
        if (window.confirm('Delete this tile?')) {
          RoomEditorStore.deleteSelected(location);
        }
        return;
      }
      // Arrow-key actions while a tile is selected.
      //   plain → nudge 1 tile, Shift → nudge 1 px, Ctrl/Cmd → zIndex ±1, Ctrl+Shift → front/back.
      if (m === 'selected') {
        const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
                     || e.key === 'ArrowUp'   || e.key === 'ArrowDown';
        if (!isArrow) return;
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
          if (e.shiftKey) {
            if (e.key === 'ArrowUp') RoomEditorStore.sendSelectedToFront(location);
            else if (e.key === 'ArrowDown') RoomEditorStore.sendSelectedToBack(location);
          } else {
            if (e.key === 'ArrowUp') RoomEditorStore.bumpSelectedZIndex(location, 1);
            else if (e.key === 'ArrowDown') RoomEditorStore.bumpSelectedZIndex(location, -1);
          }
          return;
        }

        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -1;
        else if (e.key === 'ArrowRight') dx = 1;
        else if (e.key === 'ArrowUp') dy = -1;
        else if (e.key === 'ArrowDown') dy = 1;
        RoomEditorStore.nudgeSelected(location, dx, dy, { snap: !e.shiftKey });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location]);

  if (!RoomEditorStore.isDeveloper()) return null;
  if (Platform.OS !== 'web') return null;

  const mode = RoomEditorStore.mode;
  const editModeActive = RoomEditorStore.editModeActive;
  const tiles = RoomEditorStore.getTiles(location);
  const selectedTile = tiles.find(t => t._id === RoomEditorStore.selectedTileId);

  // Click handling lives in MapCanvas.handleCanvasClick → RoomEditorStore.onCanvasClick.
  // That path reuses the existing canvas coord transform (which already handles
  // portrait/mobile rotation), so the editor never has to recompute it.

  // The capture layer is mounted in 'placing'/'selected' for click-to-commit,
  // and always in 'idle' for double-click selection (but with pointer-events:none
  // on the inner div... actually we want clicks to pass through normally in idle —
  // we attach a window-level dblclick listener instead).
  return (
    <>
      {/* Draft preview and selection highlight are drawn on the canvas itself
          (see MapCanvas drawCanvas → editor overlay block) so they stay pixel-aligned. */}

      {/* Toolbar shown while edit mode is on */}
      {editModeActive && (
        <div data-room-editor-ui="1">
          <Toolbar mode={mode} selectedTile={selectedTile} location={location} />
        </div>
      )}

      {/* Asset picker modal */}
      {editModeActive && mode === 'picking' && (
        <div data-room-editor-ui="1">
          <PickerOverlay location={location} />
        </div>
      )}

      {/* Persistent edit-mode toggle — highest z-index so it's always reachable */}
      <div data-room-editor-ui="1">
        <Pressable
          onPress={() => RoomEditorStore.toggleEditMode()}
          style={[styles.toggleButton, editModeActive && styles.toggleButtonActive]}
        >
          <Text style={styles.toggleIcon}>🛠</Text>
          <Text style={styles.toggleLabel}>{editModeActive ? 'Editing' : 'Edit'}</Text>
        </Pressable>
      </div>
    </>
  );
});

const Toolbar = observer(({ mode, selectedTile, location }) => {
  const status = mode === 'placing'
    ? 'Click to place — Esc to cancel'
    : mode === 'selected'
      ? 'Click, arrows, or Ctrl±arrow — Del to delete — Esc to deselect'
      : 'Click + to add a tile, click a tile to select — Ctrl+Z to undo';

  const handleRecentClick = async (asset) => {
    const dims = await loadImageDims(asset);
    RoomEditorStore.startPlacing(asset, dims.w, dims.h);
  };

  const recents = RoomEditorStore.recentAssetIds
    .map(id => PLATFORM_ASSETS.find(a => a.id === id))
    .filter(Boolean);

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9200,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      alignItems: 'stretch',
      background: 'rgba(45, 44, 43, 0.92)',
      borderRadius: 10,
      padding: '6px 10px',
      fontFamily: 'Comfortaa',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => RoomEditorStore.openPicker()}
          style={{
            background: '#7044C7',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 10px',
            fontFamily: 'Comfortaa',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >+ Add</button>
      {mode === 'selected' && (
        <button
          onClick={() => {
            if (window.confirm('Delete this tile?')) RoomEditorStore.deleteSelected(location);
          }}
          style={{
            background: '#c0392b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 10px',
            fontFamily: 'Comfortaa',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >Delete</button>
      )}
      <span style={{ fontSize: 12, opacity: 0.85, paddingLeft: 4 }}>{status}</span>
      </div>

      {recents.length > 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 2 }}>
          <span style={{ fontSize: 11, opacity: 0.7, paddingRight: 4 }}>Recent:</span>
          {recents.map(asset => {
            const src = typeof asset.image === 'string'
              ? asset.image
              : asset.image?.default || asset.image?.uri || asset.image;
            return (
              <button
                key={asset.id}
                onClick={() => handleRecentClick(asset)}
                title={asset.name}
                style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  padding: 0,
                  cursor: 'pointer',
                  backgroundImage: src ? `url("${src}")` : undefined,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  imageRendering: 'pixelated'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

function findAsset(id) {
  return PLATFORM_ASSETS.find(a => a.id === id);
}

const DraftPreview = observer(({ asset }) => {
  if (!asset) return null;
  const draft = RoomEditorStore.draftTile;
  if (!draft) return null;
  const vp = baselineToViewport(draft.x, draft.y, draft.width, draft.height);
  if (!vp) return null;
  const src = typeof asset.image === 'string'
    ? asset.image
    : asset.image?.default || asset.image?.uri || asset.image;
  return (
    <div style={{
      position: 'fixed',
      left: vp.left,
      top: vp.top,
      width: vp.width,
      height: vp.height,
      pointerEvents: 'none',
      zIndex: 9100,
      border: '3px dashed #7044C7',
      boxShadow: '0 0 18px rgba(112,68,199,0.55)',
      backgroundImage: src ? `url("${src}")` : undefined,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      opacity: 0.85,
      imageRendering: 'pixelated'
    }} />
  );
});

const SelectedHighlight = observer(({ tile }) => {
  const vp = baselineToViewport(tile.x, tile.y, tile.width, tile.height);
  if (!vp) return null;
  return (
    <div style={{
      position: 'fixed',
      left: vp.left,
      top: vp.top,
      width: vp.width,
      height: vp.height,
      pointerEvents: 'none',
      zIndex: 9100,
      border: '3px solid #7044C7',
      boxShadow: '0 0 14px rgba(112,68,199,0.7)'
    }} />
  );
});

const PickerOverlay = observer(({ location }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const filtered = selectedCategory
    ? PLATFORM_ASSETS.filter(a => a.category === selectedCategory)
    : PLATFORM_ASSETS;

  const handleAssetPress = async (asset) => {
    const dims = await loadImageDims(asset);
    RoomEditorStore.startPlacing(asset, dims.w, dims.h);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9300,
      background: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
      onClick={() => RoomEditorStore.closePicker()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(820px, 90vw)',
          height: 'min(620px, 85vh)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <MinkyPanel borderRadius={12} padding={16} overlayColor="rgba(112, 68, 199, 0.2)">
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, {
              fontSize: FontSettingsStore.getScaledFontSize(20),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]}>Place Asset</Text>
            <Pressable onPress={() => RoomEditorStore.closePicker()} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.categoryRow}>
            <WoolButton variant="secondary" focused={selectedCategory === null} size="small" onPress={() => setSelectedCategory(null)}>All</WoolButton>
            {ASSET_CATEGORIES.map(cat => (
              <WoolButton key={cat} variant="secondary" focused={selectedCategory === cat} size="small" onPress={() => setSelectedCategory(cat)}>
                {cat}
              </WoolButton>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={styles.assetGrid}>
            {filtered.map(asset => (
              <Pressable key={asset.id} onPress={() => handleAssetPress(asset)}>
                <MinkyPanel borderRadius={8} padding={10} overlayColor="rgba(112, 68, 199, 0.2)">
                  <View style={styles.assetCardContent}>
                    {asset.image ? (
                      <Image source={asset.image} style={styles.assetImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.assetIcon}><Text>{asset.name.charAt(0)}</Text></View>
                    )}
                    <Text style={[styles.assetName, {
                      fontSize: FontSettingsStore.getScaledFontSize(11),
                      color: FontSettingsStore.getFontColor('#2D2C2B')
                    }]} numberOfLines={2}>{asset.name}</Text>
                    <Text style={[styles.assetCategory, {
                      fontSize: FontSettingsStore.getScaledFontSize(9),
                      color: FontSettingsStore.getFontColor('#454342')
                    }]}>{asset.category}</Text>
                  </View>
                </MinkyPanel>
              </Pressable>
            ))}
          </ScrollView>
        </MinkyPanel>
      </div>
    </div>
  );
});

const styles = StyleSheet.create({
  toggleButton: {
    position: 'fixed',
    top: 12,
    left: 12,
    minWidth: 80,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 44, 43, 0.85)',
    zIndex: 9400,
    borderWidth: 2,
    borderColor: '#7044C7',
  },
  toggleButtonActive: {
    backgroundColor: '#7044C7',
  },
  toggleIcon: {
    fontSize: 18,
    color: '#fff',
  },
  toggleLabel: {
    color: '#fff',
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 13,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(112, 68, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    lineHeight: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  assetCardContent: {
    width: 96,
    alignItems: 'center',
    gap: 6,
  },
  assetImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  assetCategory: {
    fontFamily: 'Comfortaa',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default RoomEditor;
