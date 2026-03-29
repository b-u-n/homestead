import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Text } from './ButtonBase';
import ColorWheel from './ColorWheel';
import MinkyPanel from './MinkyPanel';
import FontSettingsStore from '../stores/FontSettingsStore';
import uxStore from '../stores/UXStore';
import { setScrollEnabled } from '../contexts/ScrollLockContext';

/**
 * Reusable Pixel Editor component.
 * Canvas-based pixel art editor with zero game knowledge.
 * Used by Pixel Pals game and knapsack sketchpad.
 *
 * Props:
 *   pixels             - Flat array of hex color strings (null = transparent), length = width * height
 *   width              - Grid width in pixels
 *   height             - Grid height in pixels
 *   readOnly           - Disable all drawing
 *   maxPixels          - Optional: max pixels allowed per action
 *   pixelsRemaining    - Optional: display count of remaining budget
 *   onPixelsChanged    - (changedPixels: [{x, y, color}]) => void
 *   onSave             - (pixels: Array) => void
 *   currentColor       - Currently selected hex color
 *   onColorChange      - (color: string) => void
 *   savedColors        - Array of hex strings (user's saved palette)
 *   onSaveColor        - (color: string) => void
 *   onRemoveColor      - (color: string) => void
 *   showGrid           - Boolean (default true)
 *   showZoomControls   - Boolean (default true)
 *   showColorWheel     - Boolean (controls color wheel visibility)
 *   onToggleColorWheel - () => void
 *   showSaveButton     - Boolean (default true)
 *   style              - Additional container styles
 */

const TOOLS = { DRAW: 'draw', PAINT: 'paint', EYEDROPPER: 'eyedropper', ERASER: 'eraser' };

// Inline SVG tool icons (24x24, cottagecore muted purple)
const TOOL_SVGS = {
  // Pencil (Draw = click to open wheel + precise single pixel)
  [TOOLS.DRAW]: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237044C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  // Paintbrush (Paint = click+drag freehand)
  [TOOLS.PAINT]: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237044C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 10-3-3z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5L4.5 15"/></svg>`,
  // Dropper (Pick = sample color from pixel)
  [TOOLS.EYEDROPPER]: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237044C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19.7 4.3-2-2a1 1 0 00-1.4 0L13 5.6l-1.3-1.3a1 1 0 00-1.4 0l-1 1a1 1 0 000 1.4L10.6 8 4 14.6a2 2 0 00-.6 1.4V19a2 2 0 002 2h3a2 2 0 001.4-.6L16 14l1.3 1.3a1 1 0 001.4 0l1-1a1 1 0 000-1.4L18.4 11l3.3-3.3a1 1 0 000-1.4z"/></svg>`,
  // Eraser
  [TOOLS.ERASER]: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237044C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>`,
  // Undo
  undo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237044C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>`,
};

// Build cursor URLs from SVGs (32x32, hotspot at tip)
const TOOL_CURSORS = {
  [TOOLS.DRAW]: `url("data:image/svg+xml,${TOOL_SVGS[TOOLS.DRAW].replace(/"/g, "'")}") 2 22, pointer`,
  [TOOLS.PAINT]: `url("data:image/svg+xml,${TOOL_SVGS[TOOLS.PAINT].replace(/"/g, "'")}") 2 22, crosshair`,
  [TOOLS.EYEDROPPER]: `url("data:image/svg+xml,${TOOL_SVGS[TOOLS.EYEDROPPER].replace(/"/g, "'")}") 2 22, copy`,
  [TOOLS.ERASER]: `url("data:image/svg+xml,${TOOL_SVGS[TOOLS.ERASER].replace(/"/g, "'")}") 2 22, cell`,
};

// Cottagecore color gradient - warm muted tones arranged as a rainbow arc
const DIAL_COLORS = [
  '#FFFFFF', '#FFF8F0', '#F5E6D8', '#E8D4C8', '#F5C6AA',
  '#FFCBA4', '#F5A07A', '#FF6B6B', '#E85D75', '#CC6633',
  '#D4A574', '#B8860B', '#8B7355', '#A8D5BA', '#7BB894',
  '#5C9E78', '#87B4D2', '#6A9FCA', '#5B7FBF', '#7044C7',
  '#9B6FC7', '#C4A0D4', '#DE86DF', '#E8A0D0', '#DEB8C8',
  '#C8A0A0', '#9A8585', '#706060', '#4A4040', '#2D2C2B',
  '#151212', '#000000',
];

/**
 * Inline cottagecore color bar. Drag to pick a color.
 * Compact: fits in the toolbar row.
 */
const CottagecoreDial = ({ currentColor, onColorChange }) => {
  const dialRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const segmentCount = DIAL_COLORS.length;

  const currentIndex = DIAL_COLORS.reduce((best, c, i) => {
    if (c.toLowerCase() === currentColor?.toLowerCase()) return i;
    return best;
  }, -1);

  const getColorFromPosition = useCallback((clientX) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const idx = Math.round((x / rect.width) * (segmentCount - 1));
    const clamped = Math.max(0, Math.min(segmentCount - 1, idx));
    onColorChange?.(DIAL_COLORS[clamped]);
  }, [segmentCount, onColorChange]);

  if (Platform.OS !== 'web') return null;

  return (
    <div
      ref={dialRef}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '22px',
        minHeight: '22px',
        borderRadius: '11px',
        overflow: 'hidden',
        border: '1px dashed rgba(92, 90, 88, 0.35)',
        cursor: 'pointer',
        userSelect: 'none',
        flex: '1 1 80px',
        minWidth: '80px',
      }}
      onMouseDown={(e) => {
        setDragging(true);
        getColorFromPosition(e.clientX);
      }}
      onMouseMove={(e) => {
        if (dragging) getColorFromPosition(e.clientX);
      }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      {DIAL_COLORS.map((c, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '100%',
            backgroundColor: c,
            position: 'relative',
          }}
        >
          {currentIndex === i && (
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const PixelEditor = ({
  pixels: externalPixels = [],
  width = 32,
  height = 32,
  readOnly = false,
  maxPixels = null,
  pixelsRemaining = null,
  onPixelsChanged,
  onSave,
  currentColor: externalColor,
  onColorChange,
  savedColors = [],
  onSaveColor,
  onRemoveColor,
  showSaveButton = true,
  style,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const textureRef = useRef(null);
  const textureLoadedRef = useRef(false);
  const [tool, setTool] = useState(TOOLS.DRAW);
  const [isDrawing, setIsDrawing] = useState(false);
  const [localPixels, setLocalPixels] = useState(() => [...externalPixels]);
  const [pendingPixels, setPendingPixels] = useState([]);
  const [undoStack, setUndoStack] = useState([]); // Array of { pixels: [{x, y, prevColor}] }
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
  const [gridAreaSize, setGridAreaSize] = useState({ width: 300, height: 400 });
  const [internalColor, setInternalColor] = useState('#000000');
  const isMobile = uxStore.isMobile || uxStore.isPortrait;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileDragEnabled, setMobileDragEnabled] = useState(false);
  const holdTimerRef = useRef(null);
  const wheelOpenTimeRef = useRef(0);
  const wheelTouchIdRef = useRef(null);
  const mobileWheelInteractedRef = useRef(false); // did the user drag on the wheel?
  const [selectedWheelIndex, setSelectedWheelIndex] = useState(2); // which wheel the overlay uses
  const [wheelOverlay, setWheelOverlay] = useState(null); // { pixelX, pixelY, previewColor }
  const lastClickRef = useRef({ time: 0, x: -1, y: -1 });
  const [wheelFading, setWheelFading] = useState(false);
  const wheelTimerRef = useRef(null);

  const currentColor = externalColor !== undefined ? externalColor : internalColor;
  const setCurrentColor = useCallback((c) => {
    if (onColorChange) onColorChange(c);
    else setInternalColor(c);
  }, [onColorChange]);

  // Sync external pixels
  useEffect(() => {
    setLocalPixels([...externalPixels]);
  }, [externalPixels]);

  // Ensure scroll is enabled on mount and restored on unmount
  useEffect(() => {
    setScrollEnabled(true);
    return () => setScrollEnabled(true);
  }, []);

  // Load minky texture for cell rendering
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const img = new Image();
    img.onload = () => {
      textureRef.current = img;
      textureLoadedRef.current = true;
    };
    // Use the existing minky texture asset
    try {
      const src = require('../assets/images/slot-bg-2.jpeg');
      img.src = typeof src === 'string' ? src : (src?.default || src?.uri || '');
    } catch (e) {
      // Texture not available, will render without it
    }
  }, []);

  // Three modes: desktop, landscape mobile, portrait mobile
  const pixelGap = 1;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : containerSize.width;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : containerSize.height;
  const isPortraitMode = isMobile && screenH > screenW;
  const isLandscapeMobile = isMobile && !isPortraitMode;
  const leftPanelWidth = isPortraitMode ? 0 : Math.floor(containerSize.width / 6);

  // Cell size calculation per mode
  let cellSize;
  if (isPortraitMode) {
    cellSize = Math.max(1, Math.floor(Math.min(
      (containerSize.width - pixelGap * (width - 1)) / width,
      (containerSize.height - pixelGap * (height - 1)) / height
    )));
  } else if (isLandscapeMobile) {
    // Landscape mobile: minimum 32px cells for finger taps
    const fitSize = Math.floor(Math.min(
      (gridAreaSize.width - pixelGap * (width - 1)) / width,
      (gridAreaSize.height - pixelGap * (height - 1)) / height
    ));
    cellSize = Math.max(fitSize, 32);
  } else {
    // Desktop: fit to grid area
    cellSize = Math.max(1, Math.floor(Math.min(
      (gridAreaSize.width - pixelGap * (width - 1)) / width,
      (gridAreaSize.height - pixelGap * (height - 1)) / height
    )));
  }

  // Wheel overlay: auto-fade after 12 seconds
  useEffect(() => {
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    if (wheelOverlay) {
      setWheelFading(false);
      mobileWheelInteractedRef.current = false;
      wheelTimerRef.current = setTimeout(() => {
        setWheelFading(true);
        setTimeout(() => {
          const wo = latestWheelOverlayRef.current;
          if (wo?.previewColor) setCurrentColor(wo.previewColor);
          setWheelOverlay(null);
        }, 500);
      }, 12000);
    }
    return () => { if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current); };
  }, [wheelOverlay]);


  const mobileWheelRef = useRef(null);
  const latestWheelOverlayRef = useRef(null);
  const latestPickedColorRef = useRef(null);

  const closeWheelOverlay = useCallback(() => {
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    setWheelOverlay(null);
    setWheelFading(false);
    setScrollEnabled(true);
  }, []);

  // Keep ref in sync with state so touchEnd/closeWheelOverlay always has the latest
  useEffect(() => {
    latestWheelOverlayRef.current = wheelOverlay;
  }, [wheelOverlay]);

  // Mobile: global touchmove — pick colors from wheel canvas as finger drags
  useEffect(() => {
    if (!isMobile || !wheelOverlay) return;
    const handleGlobalTouchMove = (e) => {
      e.preventDefault();
      if (!mobileWheelRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const canvas = mobileWheelRef.current.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (touch.clientX - rect.left) * scaleX;
      const cy = (touch.clientY - rect.top) * scaleY;
      const r = canvas.width / 2;
      if (Math.sqrt((cx - r) ** 2 + (cy - r) ** 2) > r) return;
      const ctx = canvas.getContext('2d');
      const px = Math.round(cx);
      const py = Math.round(cy);
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return;
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      if (pixel[3] === 0) return;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      // ALWAYS store the color immediately — even before throttle would skip the UI update
      latestPickedColorRef.current = hex;
      // Update state for UI
      setWheelOverlay(prev => prev ? {
        ...prev,
        previewColor: hex,
        indicatorX: px / canvas.width,
        indicatorY: py / canvas.height,
      } : null);
      setCurrentColor(hex);
    };
    const handleGlobalTouchEnd = () => {
      if (Date.now() - wheelOpenTimeRef.current < 600) return;
      const wo = latestWheelOverlayRef.current;
      const color = latestPickedColorRef.current;
      if (wo && color) {
        // Paint pixel
        const idx = wo.pixelY * width + wo.pixelX;
        setLocalPixels(prev => {
          const next = [...prev];
          next[idx] = color;
          return next;
        });
        // Send to backend
        onPixelsChanged?.([{ x: wo.pixelX, y: wo.pixelY, color }]);
        // Set as current color
        setCurrentColor(color);
      }
      latestPickedColorRef.current = null;
      closeWheelOverlay();
    };
    const blockWheel = (e) => e.preventDefault();
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('wheel', blockWheel, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('wheel', blockWheel);
    };
  }, [isMobile, wheelOverlay, setCurrentColor, closeWheelOverlay, width, onPixelsChanged]);

  const overlayWheelSize = cellSize * 10 + pixelGap * 9;

  // Grid cells are now rendered as individual styled divs (no canvas).
  // getCellFromEvent is no longer needed - each cell handles its own events.

  const handlePixelAction = useCallback((cell) => {
    if (!cell || readOnly) return;

    if (tool === TOOLS.EYEDROPPER) {
      const color = localPixels[cell.y * width + cell.x];
      if (color) setCurrentColor(color);
      setTool(TOOLS.DRAW);
      return;
    }

    // Check budget
    if (maxPixels !== null) {
      const totalPending = pendingPixels.length;
      if (totalPending >= maxPixels) return;
    }

    const color = tool === TOOLS.ERASER ? null : currentColor;

    // Don't double-place on same cell in this stroke
    const existing = pendingPixels.find(p => p.x === cell.x && p.y === cell.y);
    if (existing) {
      existing.color = color;
      setPendingPixels([...pendingPixels]);
    } else {
      setPendingPixels(prev => [...prev, { x: cell.x, y: cell.y, color }]);
    }
  }, [tool, currentColor, readOnly, localPixels, width, maxPixels, pendingPixels, setCurrentColor]);

  const commitPixels = useCallback(() => {
    if (pendingPixels.length === 0) return;

    // Save previous colors for undo
    const prevColors = pendingPixels.map(p => ({
      x: p.x,
      y: p.y,
      prevColor: localPixels[p.y * width + p.x] || null
    }));
    setUndoStack(prev => [...prev.slice(-19), { pixels: prevColors }]); // max 20

    // Apply to local state
    const newPixels = [...localPixels];
    for (const p of pendingPixels) {
      newPixels[p.y * width + p.x] = p.color;
    }
    setLocalPixels(newPixels);

    // Notify parent
    if (onPixelsChanged) {
      onPixelsChanged(pendingPixels);
    }

    setPendingPixels([]);
  }, [pendingPixels, localPixels, width, onPixelsChanged]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    // Restore previous colors
    const newPixels = [...localPixels];
    const revertedPixels = [];
    for (const p of lastAction.pixels) {
      newPixels[p.y * width + p.x] = p.prevColor;
      revertedPixels.push({ x: p.x, y: p.y, color: p.prevColor });
    }
    setLocalPixels(newPixels);

    // Notify parent with isUndo flag
    if (onPixelsChanged) {
      onPixelsChanged(revertedPixels, true); // second arg = isUndo
    }
  }, [undoStack, localPixels, width, onPixelsChanged]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    commitPixels();
  }, [commitPixels]);

  const handleContainerLayout = useCallback((e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setContainerSize({ width: w, height: h });
  }, []);

  const handleSave = () => {
    if (onSave) onSave(localPixels);
  };


  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.fallbackText}>
          Pixel Editor is optimized for web. Please use the web version for the best experience.
        </Text>
      </View>
    );
  }

  // === MOBILE PORTRAIT LAYOUT: full-width scrollable grid + bottom panel ===
  // Landscape mobile falls through to the desktop layout below
  if (isPortraitMode) {
    // Cells fill full width but have a minimum size for finger taps — grid scrolls vertically if needed
    const fitCellSize = Math.floor((containerSize.width - pixelGap * (width - 1)) / width);
    const mobileCellSize = Math.max(fitCellSize, 32);
    const panelHeight = Math.floor(containerSize.height * 0.2);
    const gridHeight = containerSize.height - panelHeight;
    const panelWheelSize = Math.min(panelHeight - 16, containerSize.width * 0.35);

    return (
      <View style={[styles.container, style]} onLayout={handleContainerLayout}>
        {/* Scrollable grid area — full width, 60% height, scrolls vertically */}
        <div style={{
          width: '100%', height: gridHeight,
          overflow: wheelOverlay ? 'hidden' : 'scroll',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', display: 'inline-block', backgroundColor: '#E8D4C8', minWidth: '100%' }}>
            {textureLoadedRef.current && (
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: `url(${typeof require('../assets/images/slot-bg-2.jpeg') === 'string' ? require('../assets/images/slot-bg-2.jpeg') : ''})`,
                backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.8, pointerEvents: 'none',
              }} />
            )}
            <div style={{
              position: 'relative', display: 'grid',
              gridTemplateColumns: `repeat(${width}, ${mobileCellSize}px)`,
              gridTemplateRows: `repeat(${height}, ${mobileCellSize}px)`,
              gap: `${pixelGap}px`, userSelect: 'none',
            }}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { if (isDrawing) { setIsDrawing(false); commitPixels(); } }}
            >
              {Array.from({ length: width * height }, (_, i) => {
                const x = i % width;
                const y = Math.floor(i / width);
                const color = localPixels[i];
                const pending = pendingPixels.find(p => p.x === x && p.y === y);
                const displayColor = pending ? pending.color : color;
                let phantomColor = null;
                if (!displayColor) {
                  phantomColor = localPixels[y * width + (width - 1 - x)] || null;
                }
                const overlayColor = displayColor || 'rgba(112, 68, 199, 0.2)';
                const isWheelTarget = wheelOverlay && wheelOverlay.pixelX === x && wheelOverlay.pixelY === y;
                return (
                  <div key={i} style={{
                    width: mobileCellSize, height: mobileCellSize, boxSizing: 'border-box',
                    position: 'relative', overflow: 'hidden', backgroundColor: overlayColor,
                    ...(isWheelTarget ? {
                      outline: '3px solid #7044C7',
                      outlineOffset: '-1px',
                      zIndex: 5,
                      boxShadow: '0 0 8px rgba(112, 68, 199, 0.6)',
                    } : {}),
                  }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Mobile portrait: open wheel overlay (don't paint yet — touchend paints)
                      setScrollEnabled(false);
                      const touch = e.touches[0];
                      wheelOpenTimeRef.current = Date.now();
                      wheelTouchIdRef.current = touch?.identifier ?? null;
                      latestPickedColorRef.current = currentColor;
                      setWheelOverlay({
                        pixelX: x, pixelY: y,
                        screenX: touch?.clientX ?? 0,
                        screenY: touch?.clientY ?? 0,
                        previewColor: currentColor,
                      });
                      // After 4s hold, enable drag painting
                      setMobileDragEnabled(false);
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      holdTimerRef.current = setTimeout(() => {
                        setMobileDragEnabled(true);
                        setIsDrawing(true);
                        closeWheelOverlay();
                      }, 4000);
                    }}
                    onTouchMove={(e) => {
                      if (!mobileDragEnabled) return;
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (el?.dataset?.px) handlePixelAction({ x: +el.dataset.px, y: +el.dataset.py });
                    }}
                    onTouchEnd={() => {
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      if (mobileDragEnabled) {
                        setIsDrawing(false);
                        commitPixels();
                      }
                      setMobileDragEnabled(false);
                    }}
                    data-px={x} data-py={y}
                  >
                    {mobileCellSize >= 6 && <div style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, border: '1px dashed rgba(92, 90, 88, 0.55)', pointerEvents: 'none' }} />}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTop: '1px solid rgba(255,255,255,0.5)', borderLeft: '1px solid rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.15)', borderRight: '1px solid rgba(0,0,0,0.15)', pointerEvents: 'none', boxSizing: 'border-box' }} />
                    {phantomColor && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: phantomColor, opacity: 0.1, pointerEvents: 'none' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile wheel overlay — rendered OUTSIDE the scroll container as a fixed overlay */}
        {wheelOverlay && (() => {
          const screenW = typeof window !== 'undefined' ? window.innerWidth : containerSize.width;
          const screenH = typeof window !== 'undefined' ? window.innerHeight : containerSize.height;
          const mobileOverlaySize = Math.min(screenW * 0.7, 280);
          return (
            <>
              {/* Backdrop — tap to dismiss wheel */}
              <div
                style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  zIndex: 9999,
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const finalColor = latestPickedColorRef.current || latestWheelOverlayRef.current?.previewColor;
                  if (finalColor) setCurrentColor(finalColor);
                  closeWheelOverlay();
                }}
                onClick={() => {
                  const finalColor = latestPickedColorRef.current || latestWheelOverlayRef.current?.previewColor;
                  if (finalColor) setCurrentColor(finalColor);
                  closeWheelOverlay();
                }}
              />
              {/* Wheel — positioned over the tapped pixel, clamped to screen */}
              <div ref={mobileWheelRef} style={{
                position: 'fixed',
                left: Math.max(8, Math.min(screenW - mobileOverlaySize - 8, (wheelOverlay.screenX || 0) - mobileOverlaySize / 2)),
                top: Math.max(8, Math.min(screenH - mobileOverlaySize - 8, (wheelOverlay.screenY || 0) - mobileOverlaySize / 2)),
                width: mobileOverlaySize,
                height: mobileOverlaySize,
                pointerEvents: 'auto',
                opacity: wheelFading ? 0 : 1,
                transition: 'opacity 0.3s ease-out',
                zIndex: 10000,
              }}>
                <div style={{ opacity: 0.85, width: '100%', height: '100%' }}>
                  <ColorWheel
                    color={wheelOverlay.previewColor}
                    onChange={(c) => {
                      setWheelOverlay(prev => prev ? { ...prev, previewColor: c } : null);
                      setCurrentColor(c);
                    }}
                    onCommit={() => {
                      if (wheelOverlay?.previewColor) setCurrentColor(wheelOverlay.previewColor);
                      closeWheelOverlay();
                    }}
                    visible={true}
                    hideToggle={true}
                    size={mobileOverlaySize}
                    singleIndex={selectedWheelIndex}
                    alwaysTrack={true}
                  />
                </div>
                {/* Center color preview */}
                <div style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 24, height: 24,
                  backgroundColor: wheelOverlay.previewColor,
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 0 6px rgba(0,0,0,0.4)',
                  borderRadius: 12, pointerEvents: 'none', zIndex: 11,
                }} />
                {/* Touch position indicator */}
                {wheelOverlay.indicatorX != null && (
                  <div style={{
                    position: 'absolute',
                    left: wheelOverlay.indicatorX * mobileOverlaySize - 6,
                    top: wheelOverlay.indicatorY * mobileOverlaySize - 6,
                    width: 12, height: 12,
                    borderRadius: '50%',
                    border: '2.5px solid #fff',
                    boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                    pointerEvents: 'none', zIndex: 12,
                  }} />
                )}
              </div>
            </>
          );
        })()}

        {/* Bottom panel — always visible, 20% height */}
        {/* Layout: left column (tools row + wheels row stacked), right column (full preview image) */}
        <View style={[styles.mobilePanel, { height: panelHeight }]}>
          {/* Left: two stacked rows */}
          <View style={styles.mobilePanelLeft}>
            {/* Top row: tools + color swatch + budget + save */}
            <View style={styles.mobileRow}>
              {[
                { key: TOOLS.DRAW, label: 'Draw' },
                { key: TOOLS.PAINT, label: 'Paint' },
                { key: TOOLS.EYEDROPPER, label: 'Pick' },
                { key: TOOLS.ERASER, label: 'Erase' },
              ].map(t => (
                <Pressable key={t.key}
                  style={[styles.mobileToolBtn, tool === t.key && styles.toolBtnActive]}
                  onPress={() => setTool(t.key)}
                >
                  {Platform.OS === 'web' && (
                    <img src={`data:image/svg+xml,${TOOL_SVGS[t.key]}`} alt={t.label}
                      style={{ width: 14, height: 14, display: 'block', margin: '0 auto' }} />
                  )}
                  <Text style={[styles.mobileToolLabel, tool === t.key && styles.toolTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.mobileToolBtn, undoStack.length === 0 && { opacity: 0.4 }]}
                onPress={handleUndo} disabled={undoStack.length === 0}>
                {Platform.OS === 'web' && (
                  <img src={`data:image/svg+xml,${TOOL_SVGS.undo}`} alt="Undo"
                    style={{ width: 14, height: 14, display: 'block', margin: '0 auto' }} />
                )}
                <Text style={styles.mobileToolLabel}>Undo</Text>
              </Pressable>
              <View style={[styles.mobileColorSwatch, { backgroundColor: currentColor }]} />
              {pixelsRemaining !== null && (
                <View style={styles.budgetBadge}>
                  <Text style={styles.budgetText}>{pixelsRemaining} px</Text>
                </View>
              )}
              {showSaveButton && onSave && (
                <Pressable style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              )}
            </View>
            {/* Bottom row: color wheels */}
            <ColorWheel
              color={currentColor}
              onChange={setCurrentColor}
              visible={true}
              hideToggle={true}
              size={panelHeight - 28}
              selectedIndex={selectedWheelIndex}
              onSelectIndex={setSelectedWheelIndex}
            />
          </View>
          {/* Right: full preview image */}
          <View style={styles.mobilePanelRight}>
            <MinkyPanel transparent padding={2} borderRadius={4}>
              <PixelThumbnail pixels={localPixels} width={width} height={height} size={panelHeight - 16} />
            </MinkyPanel>
          </View>
        </View>
      </View>
    );
  }

  // === DESKTOP LAYOUT ===
  return (
    <View style={[styles.container, style]} onLayout={handleContainerLayout}>
      <View style={styles.mainRow}>
        {/* Left panel: tools, budget, color, wheels, swatches */}
        <View style={[styles.leftPanel, { width: leftPanelWidth }]}>
          {/* Tool bar: horizontal icons on landscape mobile, vertical with labels on desktop */}
          <View style={isLandscapeMobile ? styles.landscapeToolbar : undefined}>
            {[
              { key: TOOLS.DRAW, label: 'Draw' },
              { key: TOOLS.PAINT, label: 'Paint' },
              { key: TOOLS.EYEDROPPER, label: 'Pick' },
              { key: TOOLS.ERASER, label: 'Erase' },
            ].map(t => (
              <Pressable
                key={t.key}
                style={[
                  isLandscapeMobile ? styles.landscapeToolBtn : styles.toolBtn,
                  tool === t.key && styles.toolBtnActive
                ]}
                onPress={() => !readOnly && setTool(t.key)}
              >
                {Platform.OS === 'web' && (
                  <img
                    src={`data:image/svg+xml,${TOOL_SVGS[t.key]}`}
                    alt={t.label}
                    style={{ width: isLandscapeMobile ? 16 : 18, height: isLandscapeMobile ? 16 : 18, display: 'block', margin: '0 auto' }}
                  />
                )}
                {!isLandscapeMobile && (
                  <Text style={[styles.toolText, tool === t.key && styles.toolTextActive]}>
                    {t.label}
                  </Text>
                )}
              </Pressable>
            ))}
            <Pressable
              style={[
                isLandscapeMobile ? styles.landscapeToolBtn : styles.toolBtn,
                undoStack.length === 0 && { opacity: 0.4 }
              ]}
              onPress={handleUndo}
              disabled={undoStack.length === 0}
            >
              {Platform.OS === 'web' && (
                <img
                  src={`data:image/svg+xml,${TOOL_SVGS.undo}`}
                  alt="Undo"
                  style={{ width: isLandscapeMobile ? 16 : 18, height: isLandscapeMobile ? 16 : 18, display: 'block', margin: '0 auto' }}
                />
              )}
              {!isLandscapeMobile && (
                <Text style={styles.toolText}>Undo</Text>
              )}
            </Pressable>
            {/* Color swatch + budget inline on landscape mobile */}
            {isLandscapeMobile && (
              <View style={[styles.bigSwatch, { width: 20, height: 20, backgroundColor: currentColor }]} />
            )}
            {isLandscapeMobile && pixelsRemaining !== null && (
              <View style={styles.budgetBadge}>
                <Text style={styles.budgetText}>{pixelsRemaining}</Text>
              </View>
            )}
          </View>

          {/* Budget — desktop only (landscape has it inline above) */}
          {!isLandscapeMobile && pixelsRemaining !== null && (
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{pixelsRemaining} px</Text>
            </View>
          )}

          {/* Current color - big swatch — desktop only */}
          {!isLandscapeMobile && (
            <View style={[styles.bigSwatch, { backgroundColor: currentColor }]} />
          )}

          {/* Landscape mobile: mini preview ABOVE color wheels */}
          {isLandscapeMobile && (
            <MinkyPanel transparent padding={2} borderRadius={4}>
              <PixelThumbnail
                pixels={localPixels}
                width={width}
                height={height}
                size={leftPanelWidth - 20}
              />
            </MinkyPanel>
          )}

          {/* Color wheels — 6 wide on landscape mobile */}
          <ColorWheel
            color={currentColor}
            onChange={setCurrentColor}
            visible={true}
            hideToggle={true}
            size={leftPanelWidth - 16}
            selectedIndex={selectedWheelIndex}
            onSelectIndex={setSelectedWheelIndex}
            columns={isLandscapeMobile ? 6 : undefined}
          />

          {/* Mini preview bitmap — desktop only (landscape has it above wheels) */}
          {!isLandscapeMobile && (
            <MinkyPanel transparent padding={2} borderRadius={4}>
              <PixelThumbnail
                pixels={localPixels}
                width={width}
                height={height}
                size={leftPanelWidth - 20}
              />
            </MinkyPanel>
          )}

          {/* Save button */}
          {showSaveButton && onSave && (
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          )}
        </View>

        {/* Pixel grid */}
        <View style={styles.gridArea} onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setGridAreaSize({ width: w, height: h });
        }}>
          <div style={{ position: 'relative', display: 'inline-block', backgroundColor: '#E8D4C8' }}>
            {textureLoadedRef.current && (
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: `url(${typeof require('../assets/images/slot-bg-2.jpeg') === 'string'
                    ? require('../assets/images/slot-bg-2.jpeg') : ''})`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '200px',
                  opacity: 0.8,
                  pointerEvents: 'none',
                }}
              />
            )}
            <div
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
                gap: `${pixelGap}px`,
                cursor: TOOL_CURSORS[tool] || 'default',
                userSelect: 'none',
              }}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  commitPixels();
                }
              }}
            >
              {Array.from({ length: width * height }, (_, i) => {
                const x = i % width;
                const y = Math.floor(i / width);
                const color = localPixels[i];
                const pending = pendingPixels.find(p => p.x === x && p.y === y);
                const displayColor = pending ? pending.color : color;

                // Symmetry phantom: if empty, show horizontally mirrored color at 10%
                let phantomColor = null;
                if (!displayColor) {
                  const mx = width - 1 - x;
                  phantomColor = localPixels[y * width + mx] || null;
                }

                const overlayColor = displayColor || 'rgba(112, 68, 199, 0.2)';
                return (
                  <div
                    key={i}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      boxSizing: 'border-box',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: overlayColor,
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const c = localPixels[y * width + x];
                      if (c) {
                        setCurrentColor(c);
                        if (tool === TOOLS.ERASER) setTool(TOOLS.PAINT);
                      } else {
                        setTool(TOOLS.ERASER);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // Ignore right-click
                      if (e.button === 2) return;
                      // Double-click detection — desktop only (mobile taps trigger this too easily)
                      if (!isMobile) {
                        const now = Date.now();
                        const last = lastClickRef.current;
                        if (now - last.time < 400 && last.x === x && last.y === y) {
                          lastClickRef.current = { time: 0, x: -1, y: -1 };
                          if (wheelOverlay) closeWheelOverlay();
                          setTool(t => t === TOOLS.DRAW ? TOOLS.PAINT : TOOLS.DRAW);
                          return;
                        }
                        lastClickRef.current = { time: now, x, y };
                      }
                      if (wheelOverlay) {
                        closeWheelOverlay();
                        return;
                      }
                      // Left click in draw mode: open wheel overlay
                      if (tool === TOOLS.DRAW) {
                        const cellStep = cellSize + pixelGap;
                        setWheelOverlay({
                          pixelX: x,
                          pixelY: y,
                          left: x * cellStep + cellSize / 2,
                          top: y * cellStep + cellSize / 2,
                          previewColor: currentColor,
                        });
                        return;
                      }
                      setIsDrawing(true);
                      handlePixelAction({ x, y });
                    }}
                    onMouseEnter={() => {
                      if (wheelOverlay) return;
                      if (isDrawing) handlePixelAction({ x, y });
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (wheelOverlay) {
                        closeWheelOverlay();
                        return;
                      }
                      if (tool === TOOLS.DRAW) {
                        setScrollEnabled(false);
                        const cellStep = cellSize + pixelGap;
                        const touch = e.touches[0];
                        wheelOpenTimeRef.current = Date.now();
                        latestPickedColorRef.current = currentColor;
                        setWheelOverlay({
                          pixelX: x, pixelY: y,
                          left: x * cellStep + cellSize / 2,
                          top: y * cellStep + cellSize / 2,
                          screenX: touch?.clientX ?? 0,
                          screenY: touch?.clientY ?? 0,
                          previewColor: currentColor,
                        });
                        return;
                      }
                      setIsDrawing(true);
                      handlePixelAction({ x, y });
                    }}
                    onTouchMove={(e) => {
                      if (!isDrawing) return;
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (el?.dataset?.px) handlePixelAction({ x: +el.dataset.px, y: +el.dataset.py });
                    }}
                    onTouchEnd={() => {
                      if (isDrawing) {
                        setIsDrawing(false);
                        commitPixels();
                      }
                    }}
                    data-px={x} data-py={y}
                  >
                    {cellSize >= 6 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 1, left: 1, right: 1, bottom: 1,
                          border: '1px dashed rgba(92, 90, 88, 0.55)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        borderTop: '1px solid rgba(255,255,255,0.5)',
                        borderLeft: '1px solid rgba(255,255,255,0.5)',
                        borderBottom: '1px solid rgba(0,0,0,0.15)',
                        borderRight: '1px solid rgba(0,0,0,0.15)',
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {pending && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, width: '100%', height: '100%',
                          outline: '1px solid rgba(255,255,255,0.6)',
                          outlineOffset: '-1px',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {phantomColor && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, width: '100%', height: '100%',
                          backgroundColor: phantomColor,
                          opacity: 0.1,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Color wheel overlay */}
            {wheelOverlay && (
              <div
                ref={isLandscapeMobile ? mobileWheelRef : undefined}
                style={{
                  position: 'absolute',
                  left: wheelOverlay.left - overlayWheelSize / 2,
                  top: wheelOverlay.top - overlayWheelSize / 2,
                  width: overlayWheelSize,
                  height: overlayWheelSize,
                  pointerEvents: 'auto',
                  opacity: wheelFading ? 0 : 1,
                  transition: 'opacity 0.5s ease-out',
                  zIndex: 10,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  // Release commits the color and closes
                  const idx = wheelOverlay.pixelY * width + wheelOverlay.pixelX;
                  setLocalPixels(prev => {
                    const next = [...prev];
                    next[idx] = wheelOverlay.previewColor;
                    return next;
                  });
                  if (onPixelsChanged) {
                    onPixelsChanged([{
                      x: wheelOverlay.pixelX,
                      y: wheelOverlay.pixelY,
                      color: wheelOverlay.previewColor,
                    }]);
                  }
                  setCurrentColor(wheelOverlay.previewColor);
                  closeWheelOverlay();
                }}
              >
                {/* Wheel at 80% opacity — drag over to pick */}
                <div style={{ opacity: 0.8, width: '100%', height: '100%' }}>
                  <ColorWheel
                    color={wheelOverlay.previewColor}
                    onChange={(c) => {
                      setWheelOverlay(prev => prev ? { ...prev, previewColor: c } : null);
                      setCurrentColor(c);
                    }}
                    visible={true}
                    hideToggle={true}
                    size={overlayWheelSize}
                    singleIndex={selectedWheelIndex}
                    alwaysTrack={true}
                  />
                </div>
                {/* Center square — drag to paint */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: cellSize * 1.5,
                    height: cellSize * 1.5,
                    backgroundColor: wheelOverlay.previewColor,
                    cursor: 'crosshair',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 0 6px rgba(0,0,0,0.4)',
                    zIndex: 11,
                    borderRadius: 2,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // Start painting from center square
                    const idx = wheelOverlay.pixelY * width + wheelOverlay.pixelX;
                    setLocalPixels(prev => {
                      const next = [...prev];
                      next[idx] = wheelOverlay.previewColor;
                      return next;
                    });
                    setPendingPixels([{
                      x: wheelOverlay.pixelX,
                      y: wheelOverlay.pixelY,
                      color: wheelOverlay.previewColor,
                    }]);
                    setCurrentColor(wheelOverlay.previewColor);
                    setIsDrawing(true);
                    setWheelOverlay(null);
                    setWheelFading(false);
                    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
                  }}
                />
              </div>
            )}
          </div>
        </View>
      </View>
    </View>
  );
};

/**
 * Render a miniature pixel art thumbnail (no interaction).
 * Used for board list cards and inventory items.
 */
export const PixelThumbnail = ({ pixels = [], width = 32, height = 32, size = 64 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = pixels[y * width + x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [pixels, width, height]);

  if (Platform.OS !== 'web') {
    return <View style={{ width: size, height: size, borderRadius: 4 }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        borderRadius: 4,
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    minHeight: 0,
  },
  leftPanel: {
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  landscapeToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  landscapeToolBtn: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    alignItems: 'center',
  },
  toolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(112, 68, 199, 0.3)',
  },
  toolText: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#454342',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  toolTextActive: {
    color: '#7044C7',
  },
  budgetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
  },
  budgetText: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#7044C7',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bigSwatch: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderStyle: 'dashed',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 4,
  },
  miniSwatch: {
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  swatchSelected: {
    borderWidth: 1.5,
    borderColor: '#7044C7',
  },
  gridArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 0,
    minWidth: 0,
  },
  // Mobile styles
  mobilePanel: {
    flexDirection: 'row',
    backgroundColor: 'rgba(232, 212, 200, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  mobilePanelLeft: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  mobilePanelRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  mobileToolBtn: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    alignItems: 'center',
  },
  mobileToolLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 7,
    color: '#454342',
    fontWeight: '700',
  },
  mobileColorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderStyle: 'dashed',
  },
  // Desktop styles
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.25)',
  },
  saveBtnText: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#7044C7',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fallbackText: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#454342',
    textAlign: 'center',
    padding: 20,
  },
});

export default PixelEditor;
