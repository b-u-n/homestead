import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Text } from './ButtonBase';
import ColorWheel, { hexToHsl, hslToHex } from './ColorWheel';
import MinkyPanel from './MinkyPanel';
import ScrollBarView from './ScrollBarView';
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

const TouchSlider = ({ value, max, gradient, onChange }) => {
  const trackRef = useRef(null);
  const pick = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(t * max));
  }, [max, onChange]);
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      ref={trackRef}
      style={{
        flex: 1, height: 18, borderRadius: 9, position: 'relative',
        background: `linear-gradient(to right, ${gradient})`,
        cursor: 'pointer', touchAction: 'none',
      }}
      onMouseDown={(e) => { e.preventDefault(); pick(e.clientX); }}
      onMouseMove={(e) => { if (e.buttons === 1) pick(e.clientX); }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); pick(e.touches[0].clientX); }}
      onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); pick(e.touches[0].clientX); }}
    >
      <div style={{
        position: 'absolute', top: 1, left: `calc(${pct}% - 8px)`,
        width: 16, height: 16, borderRadius: '50%',
        background: 'white', border: '2px solid rgba(112, 68, 199, 0.6)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)', touchAction: 'none',
      }}
        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); pick(e.touches[0].clientX); }}
        onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); pick(e.touches[0].clientX); }}
      />
    </div>
  );
};

const HSBSlidersInline = ({ currentColor, sliderCenterRef, hexToHsl, hslToHex, setCurrentColorFromSlider }) => {
  const hsl = hexToHsl(currentColor);
  const center = sliderCenterRef.current || hsl;
  const levels = 16;
  const hueLevels = 8;
  const hRange = 28.8;
  const sRange = 20;
  const sMin = Math.max(0, center.s - sRange);
  const sMax = Math.min(100, center.s + sRange);
  const bRange = 20;
  const bMin = Math.max(0, center.l - bRange);
  const bMax = Math.min(100, center.l + bRange);
  const hueStops = Array.from({ length: 8 }, (_, i) => {
    const t = i / 7;
    const h = ((center.h - hRange + t * hRange * 2) % 360 + 360) % 360;
    return `${hslToHex(h, hsl.s, hsl.l)} ${Math.round(t * 100)}%`;
  }).join(', ');
  const satStops = Array.from({ length: 5 }, (_, i) => {
    const t = i / 4;
    return `${hslToHex(hsl.h, sMin + t * (sMax - sMin), hsl.l)} ${Math.round(t * 100)}%`;
  }).join(', ');
  const briStops = Array.from({ length: 5 }, (_, i) => {
    const t = i / 4;
    return `${hslToHex(hsl.h, hsl.s, bMin + t * (bMax - bMin))} ${Math.round(t * 100)}%`;
  }).join(', ');
  const hSliderVal = Math.round(((hsl.h - (center.h - hRange) + 360) % 360) / (hRange * 2) * hueLevels);
  const sSliderVal = Math.round((hsl.s - sMin) / (sMax - sMin || 1) * levels);
  const bSliderVal = Math.round((hsl.l - bMin) / (bMax - bMin || 1) * levels);
  return (
    <View style={{ gap: 3, alignSelf: 'stretch', paddingHorizontal: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontFamily: 'Comfortaa', fontSize: 8, color: '#5C5A58', fontWeight: '700', width: 10 }}>H</Text>
        <TouchSlider value={Math.max(0, Math.min(hueLevels, hSliderVal))} max={hueLevels} gradient={hueStops}
          onChange={(v) => {
            const h = ((center.h - hRange + (v / hueLevels) * hRange * 2) % 360 + 360) % 360;
            setCurrentColorFromSlider(hslToHex(h, hsl.s, hsl.l));
          }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontFamily: 'Comfortaa', fontSize: 8, color: '#5C5A58', fontWeight: '700', width: 10 }}>S</Text>
        <TouchSlider value={Math.max(0, Math.min(levels, sSliderVal))} max={levels} gradient={satStops}
          onChange={(v) => {
            const s = sMin + (v / levels) * (sMax - sMin);
            setCurrentColorFromSlider(hslToHex(hsl.h, s, hsl.l));
          }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontFamily: 'Comfortaa', fontSize: 8, color: '#5C5A58', fontWeight: '700', width: 10 }}>B</Text>
        <TouchSlider value={Math.max(0, Math.min(levels, bSliderVal))} max={levels} gradient={briStops}
          onChange={(v) => {
            const l = bMin + (v / levels) * (bMax - bMin);
            setCurrentColorFromSlider(hslToHex(hsl.h, hsl.s, l));
          }} />
      </View>
    </View>
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
  onRemotePixelsRef,
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
  const [containerSize, setContainerSize] = useState(null);
  const [gridAreaSize, setGridAreaSize] = useState({ width: 300, height: 400 });
  const [internalColor, setInternalColor] = useState('#000000');
  const isMobile = uxStore.isMobile;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const gridScrollRef = useRef(null);
  const [gridScroll, setGridScroll] = useState({ scrollLeft: 0, scrollTop: 0, clientWidth: 0, clientHeight: 0, scrollWidth: 0, scrollHeight: 0 });
  const [mobileDragEnabled, setMobileDragEnabled] = useState(false);
  const holdTimerRef = useRef(null);
  const wheelOpenTimeRef = useRef(0);
  const wheelTouchIdRef = useRef(null);
  const mobileWheelInteractedRef = useRef(false); // did the user drag on the wheel?
  const tapTimerRef = useRef(null);
  const tapStartRef = useRef(null); // { x, y } of initial touch for scroll detection
  const manualScrollRef = useRef(null); // { lastX, lastY } — active when wheel dismissed mid-drag
  const paintDriftRef = useRef(null); // rAF id for paint-mode centering drift
  const [selectedPixel, setSelectedPixel] = useState(null); // { x, y } — selected pixel for live color edit
  const paintTouchRef = useRef(null); // current touch position for drift loop
  const [selectedWheelIndex, setSelectedWheelIndex] = useState(2); // which wheel the overlay uses
  const [wheelOverlay, setWheelOverlay] = useState(null); // { pixelX, pixelY, previewColor }
  const [sharedPickPos, setSharedPickPos] = useState(null); // shared { nx, ny } for wheel indicators
  const lastClickRef = useRef({ time: 0, x: -1, y: -1 });
  const [wheelFading, setWheelFading] = useState(false);
  const wheelTimerRef = useRef(null);

  const currentColor = externalColor !== undefined ? externalColor : internalColor;
  const sliderCenterRef = useRef(null); // HSL center point for constrained sliders
  const isSliderChangeRef = useRef(false);
  const setCurrentColor = useCallback((c) => {
    if (!isSliderChangeRef.current) {
      // External source (wheel, eyedropper, swatch) — update slider center
      sliderCenterRef.current = hexToHsl(c);
    }
    isSliderChangeRef.current = false;
    if (onColorChange) onColorChange(c);
    else setInternalColor(c);
  }, [onColorChange]);
  const setCurrentColorFromSlider = useCallback((c) => {
    isSliderChangeRef.current = true;
    setCurrentColor(c);
  }, [setCurrentColor]);

  // Expose a function for the parent to push remote pixel updates directly
  useEffect(() => {
    if (onRemotePixelsRef) {
      onRemotePixelsRef.current = (pixels) => {
        setLocalPixels(prev => {
          const next = [...prev];
          for (const p of pixels) {
            next[p.y * width + p.x] = p.color;
          }
          return next;
        });
      };
    }
    return () => { if (onRemotePixelsRef) onRemotePixelsRef.current = null; };
  }, [onRemotePixelsRef, width]);

  // Sync external pixels
  useEffect(() => {
    setLocalPixels([...externalPixels]);
  }, [externalPixels]);

  // Live color edit: when currentColor changes with a pixel selected, update that pixel
  const prevColorRef = useRef(currentColor);
  // Live color edit: ONLY when color changes (not on selection change)
  const selectedPixelRef = useRef(null);
  useEffect(() => { selectedPixelRef.current = selectedPixel; }, [selectedPixel]);
  useEffect(() => {
    const sp = selectedPixelRef.current;
    if (!sp) return;
    if (currentColor === prevColorRef.current) return;
    prevColorRef.current = currentColor;
    const idx = sp.y * width + sp.x;
    setLocalPixels(prev => {
      if (prev[idx] === currentColor) return prev;
      const next = [...prev];
      next[idx] = currentColor;
      return next;
    });
    onPixelsChanged?.([{ x: sp.x, y: sp.y, color: currentColor }]);
  }, [currentColor, width, onPixelsChanged]);

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
  // Use uxStore.isPortrait for mode detection (reactive, correct before first layout)
  // and containerSize for sizing calculations (updated via onLayout)
  const pixelGap = 0;
  // Portrait mode disabled for now — always use landscape on mobile
  const isPortraitMode = false;
  const isLandscapeMobile = isMobile;

  // Reset container measurement when orientation changes so layout
  // waits for fresh onLayout before rendering with stale dimensions
  const prevPortraitRef = useRef(isPortraitMode);
  if (prevPortraitRef.current !== isPortraitMode) {
    prevPortraitRef.current = isPortraitMode;
    if (containerSize !== null) setContainerSize(null);
  }

  const cw = containerSize?.width || 400;
  const ch = containerSize?.height || 400;
  const leftPanelWidth = isPortraitMode ? 0 : Math.floor(cw / 6);

  // Cell size calculation per mode
  let cellSize;
  if (isPortraitMode) {
    cellSize = Math.max(1, Math.floor(Math.min(
      (cw - pixelGap * (width - 1)) / width,
      (ch - pixelGap * (height - 1)) / height
    )));
  } else if (isLandscapeMobile) {
    // Landscape mobile: minimum 32px cells for finger taps
    const availW = cw - leftPanelWidth - 8;
    const availH = ch;
    const fitSize = Math.floor(Math.min(
      (availW - pixelGap * (width - 1)) / width,
      (availH - pixelGap * (height - 1)) / height
    ));
    cellSize = Math.max(fitSize, 32);
  } else {
    // Desktop: fit to available space (container minus left panel)
    const availW = cw - leftPanelWidth - 8; // 8 = mainRow gap
    const availH = ch;
    cellSize = Math.max(1, Math.floor(Math.min(
      (availW - pixelGap * (width - 1)) / width,
      (availH - pixelGap * (height - 1)) / height
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

  // Mobile: global touchmove — pick colors from wheel canvas as finger drags,
  // or manual-scroll the grid after wheel dismissal
  useEffect(() => {
    if (!isMobile) return;
    const handleGlobalTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      // Manual scroll mode — wheel was dismissed, now scroll the grid
      if (manualScrollRef.current) {
        e.preventDefault();
        const el = gridScrollRef.current;
        if (el) {
          el.scrollLeft += manualScrollRef.current.lastX - touch.clientX;
          el.scrollTop += manualScrollRef.current.lastY - touch.clientY;
        }
        manualScrollRef.current.lastX = touch.clientX;
        manualScrollRef.current.lastY = touch.clientY;
        return;
      }

      if (!latestWheelOverlayRef.current) return;
      if (!mobileWheelRef.current) return;
      const canvas = mobileWheelRef.current.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (touch.clientX - rect.left) * scaleX;
      const cy = (touch.clientY - rect.top) * scaleY;
      const r = canvas.width / 2;
      if (Math.sqrt((cx - r) ** 2 + (cy - r) ** 2) > r) {
        // Outside wheel — dismiss and start manual scrolling
        const finalColor = latestPickedColorRef.current || latestWheelOverlayRef.current?.previewColor;
        if (finalColor) setCurrentColor(finalColor);
        latestPickedColorRef.current = null;
        closeWheelOverlay();
        manualScrollRef.current = { lastX: touch.clientX, lastY: touch.clientY };
        return;
      }
      e.preventDefault();
      const ctx = canvas.getContext('2d');
      const px = Math.round(cx);
      const py = Math.round(cy);
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return;
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      if (pixel[3] === 0) return;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      latestPickedColorRef.current = hex;
      setSharedPickPos({ nx: px / canvas.width, ny: py / canvas.height });
      setWheelOverlay(prev => prev ? {
        ...prev,
        previewColor: hex,
        indicatorX: px / canvas.width,
        indicatorY: py / canvas.height,
      } : null);
      setCurrentColor(hex);
    };
    const handleGlobalTouchEnd = () => {
      if (manualScrollRef.current) {
        manualScrollRef.current = null;
        return;
      }
      if (!latestWheelOverlayRef.current) return;
      if (Date.now() - wheelOpenTimeRef.current < 600) return;
      const wo = latestWheelOverlayRef.current;
      const color = latestPickedColorRef.current;
      if (wo && color) {
        const idx = wo.pixelY * width + wo.pixelX;
        setLocalPixels(prev => {
          const next = [...prev];
          next[idx] = color;
          return next;
        });
        onPixelsChanged?.([{ x: wo.pixelX, y: wo.pixelY, color }]);
        setCurrentColor(color);
      }
      latestPickedColorRef.current = null;
      closeWheelOverlay();
    };
    const blockWheel = (e) => {
      if (latestWheelOverlayRef.current) e.preventDefault();
    };
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('wheel', blockWheel, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('wheel', blockWheel);
    };
  }, [isMobile, isPortraitMode, isLandscapeMobile, setCurrentColor, closeWheelOverlay, width, onPixelsChanged]);

  const overlayWheelSize = cellSize * 10 + pixelGap * 9;

  // Grid cells are now rendered as individual styled divs (no canvas).
  // getCellFromEvent is no longer needed - each cell handles its own events.

  const handlePixelAction = useCallback((cell) => {
    if (!cell || readOnly) return;

    // Select this pixel
    setSelectedPixel({ x: cell.x, y: cell.y });

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


  // Seed initial scroll metrics so the minimap viewport indicator shows on load
  useEffect(() => {
    const el = gridScrollRef.current;
    if (el) {
      setGridScroll({ scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, clientWidth: el.clientWidth, clientHeight: el.clientHeight, scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight });
    }
  }, [containerSize, isPortraitMode, isLandscapeMobile]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.fallbackText}>
          Pixel Editor is optimized for web. Please use the web version for the best experience.
        </Text>
      </View>
    );
  }

  // Wait for real container measurement — fallback to window size if onLayout doesn't fire
  useEffect(() => {
    if (containerSize || Platform.OS !== 'web') return;
    const timer = setTimeout(() => {
      if (!containerSize) {
        setContainerSize({ width: window.innerWidth, height: window.innerHeight });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [containerSize]);

  if (!containerSize) {
    return <View style={[styles.container, style]} onLayout={handleContainerLayout} />;
  }

  // === MOBILE PORTRAIT LAYOUT: full-width scrollable grid + bottom panel ===
  // Landscape mobile falls through to the desktop layout below
  if (isPortraitMode) {
    // Cells fill full width but have a minimum size for finger taps — grid scrolls vertically if needed
    const fitCellSize = Math.floor((containerSize.width - pixelGap * (width - 1)) / width);
    const mobileCellSize = Math.max(fitCellSize, 32);
    const panelHeight = Math.floor(containerSize.height * 0.2);
    const gridHeight = containerSize.height - panelHeight - 16;
    const panelWheelSize = Math.min(panelHeight - 16, containerSize.width * 0.35);

    return (
      <View style={[styles.container, style]} onLayout={handleContainerLayout}>
        {/* Scrollable grid area — full width, 80% height, scrolls both axes */}
        <div ref={gridScrollRef} style={{
          width: '100%', height: gridHeight,
          overflow: 'scroll',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          marginBottom: 16, flexShrink: 0,
        }} onScroll={(e) => {
          const t = e.target;
          setGridScroll({ scrollLeft: t.scrollLeft, scrollTop: t.scrollTop, clientWidth: t.clientWidth, clientHeight: t.clientHeight, scrollWidth: t.scrollWidth, scrollHeight: t.scrollHeight });
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
                      const touch = e.touches[0];
                      if (!touch) return;
                      if (tool === TOOLS.EYEDROPPER) {
                        const c = localPixels[y * width + x];
                        if (c) setCurrentColor(c);
                        setTool(TOOLS.DRAW);
                        return;
                      }
                      if (tool === TOOLS.PAINT || tool === TOOLS.ERASER) {
                        setIsDrawing(true);
                        paintTouchRef.current = { x: touch.clientX, y: touch.clientY };
                        handlePixelAction({ x, y });
                        // Start centering drift loop
                        const driftLoop = () => {
                          const scrollEl = gridScrollRef.current;
                          const pt = paintTouchRef.current;
                          if (!scrollEl || !pt) return;
                          const rect = scrollEl.getBoundingClientRect();
                          const centerX = rect.left + rect.width / 2;
                          const centerY = rect.top + rect.height / 2;
                          const offsetX = pt.x - centerX;
                          const offsetY = pt.y - centerY;
                          const speed = 0.048;
                          const maxDrift = 7;
                          const driftX = Math.max(-maxDrift, Math.min(maxDrift, offsetX * speed));
                          const driftY = Math.max(-maxDrift, Math.min(maxDrift, offsetY * speed));
                          if (Math.abs(offsetX) > 4) scrollEl.scrollLeft += driftX;
                          if (Math.abs(offsetY) > 4) scrollEl.scrollTop += driftY;
                          paintDriftRef.current = requestAnimationFrame(driftLoop);
                        };
                        if (paintDriftRef.current) cancelAnimationFrame(paintDriftRef.current);
                        paintDriftRef.current = requestAnimationFrame(driftLoop);
                        return;
                      }
                      // DRAW mode: open wheel
                      wheelOpenTimeRef.current = Date.now();
                      wheelTouchIdRef.current = touch?.identifier ?? null;
                      latestPickedColorRef.current = currentColor;
                      setWheelOverlay({
                        pixelX: x, pixelY: y,
                        screenX: touch.clientX,
                        screenY: touch.clientY,
                        previewColor: currentColor,
                      });
                      setMobileDragEnabled(false);
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      holdTimerRef.current = setTimeout(() => {
                        setMobileDragEnabled(true);
                        setIsDrawing(true);
                        closeWheelOverlay();
                      }, 4000);
                    }}
                    onTouchMove={(e) => {
                      if (isDrawing) {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const paintHalf = mobileCellSize * 0.72;
                        const step = mobileCellSize * 0.5;
                        const seen = new Set();
                        for (let ox = -paintHalf; ox <= paintHalf; ox += step) {
                          for (let oy = -paintHalf; oy <= paintHalf; oy += step) {
                            const el = document.elementFromPoint(touch.clientX + ox, touch.clientY + oy);
                            if (el?.dataset?.px) {
                              const key = `${el.dataset.px},${el.dataset.py}`;
                              if (!seen.has(key)) {
                                seen.add(key);
                                handlePixelAction({ x: +el.dataset.px, y: +el.dataset.py });
                              }
                            }
                          }
                        }
                        paintTouchRef.current = { x: touch.clientX, y: touch.clientY };
                        return;
                      }
                      if (!mobileDragEnabled) return;
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (el?.dataset?.px) handlePixelAction({ x: +el.dataset.px, y: +el.dataset.py });
                    }}
                    onTouchEnd={() => {
                      paintTouchRef.current = null;
                      if (paintDriftRef.current) { cancelAnimationFrame(paintDriftRef.current); paintDriftRef.current = null; }
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      if (isDrawing || mobileDragEnabled) { setIsDrawing(false); commitPixels(); }
                      setMobileDragEnabled(false);
                    }}
                    data-px={x} data-py={y}
                  >
                    {mobileCellSize >= 6 && <div style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, border: '1px dashed rgba(92, 90, 88, 0.55)', pointerEvents: 'none' }} />}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTop: '1px solid rgba(255,255,255,0.5)', borderLeft: '1px solid rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.15)', borderRight: '1px solid rgba(0,0,0,0.15)', pointerEvents: 'none', boxSizing: 'border-box' }} />
                    {phantomColor && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: phantomColor, opacity: 0.1, pointerEvents: 'none' }} />}
                    {selectedPixel && selectedPixel.x === x && selectedPixel.y === y && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(92, 90, 88, 0.5)', pointerEvents: 'none', zIndex: 3 }} />}
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
                    externalPickPos={sharedPickPos}
                    onExternalPickPos={setSharedPickPos}
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
                <View style={[styles.budgetBadge, { paddingHorizontal: 7, paddingVertical: 3, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.budgetText, { textAlign: 'center', lineHeight: 12 }]}>{pixelsRemaining} pixels remaining</Text>
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
              externalPickPos={sharedPickPos}
              onExternalPickPos={setSharedPickPos}
            />
          </View>
          {/* Right: full preview image with viewport indicator */}
          <View style={styles.mobilePanelRight}>
            <div style={{
              position: 'relative',
              width: panelHeight - 16,
              height: panelHeight - 16,
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px dashed rgba(92, 90, 88, 0.55)',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
              onClick={(e) => {
                if (!gridScrollRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) / rect.width;
                const clickY = (e.clientY - rect.top) / rect.height;
                const el = gridScrollRef.current;
                el.scrollLeft = clickX * el.scrollWidth - el.clientWidth / 2;
                el.scrollTop = clickY * el.scrollHeight - el.clientHeight / 2;
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (!touch || !gridScrollRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const fx = (touch.clientX - rect.left) / rect.width;
                const fy = (touch.clientY - rect.top) / rect.height;
                const el = gridScrollRef.current;
                el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2;
                el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2;
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (!touch || !gridScrollRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const fx = (touch.clientX - rect.left) / rect.width;
                const fy = (touch.clientY - rect.top) / rect.height;
                const el = gridScrollRef.current;
                el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2;
                el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2;
              }}
            >
              <PixelThumbnail pixels={localPixels} width={width} height={height} size={panelHeight - 16} />
              {gridScroll.scrollWidth > 0 && gridScroll.scrollHeight > 0 && (
                <div style={{
                  position: 'absolute',
                  left: (gridScroll.scrollLeft / gridScroll.scrollWidth) * (panelHeight - 16),
                  top: (gridScroll.scrollTop / gridScroll.scrollHeight) * (panelHeight - 16),
                  width: (gridScroll.clientWidth / gridScroll.scrollWidth) * (panelHeight - 16),
                  height: (gridScroll.clientHeight / gridScroll.scrollHeight) * (panelHeight - 16),
                  border: '2px dashed rgba(255, 255, 255, 0.85)',
                  borderRadius: 2,
                  boxShadow: '0 0 3px rgba(0, 0, 0, 0.4)',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                }} />
              )}
            </div>
          </View>
        </View>
      </View>
    );
  }

  // === MOBILE LANDSCAPE LAYOUT: left panel + scrollable grid ===
  if (isLandscapeMobile) {
    const fitCellSize = Math.floor((containerSize.height - pixelGap * (height - 1)) / height);
    const mobileCellSize = Math.max(fitCellSize, 32);
    const panelWidth = Math.floor(containerSize.width * 0.2);
    const gridWidth = containerSize.width - panelWidth - 16;
    const minimapSize = panelWidth - 16;

    return (
      <View style={[styles.container, style, { flexDirection: 'row', overflow: 'hidden' }]} onLayout={handleContainerLayout}>
        {/* Side panel — split into left (tools/wheels) and right (minimap) */}
        <View style={{ flexDirection: 'row', height: '100%', marginRight: 16, flexShrink: 0, gap: 8, alignItems: 'center' }}>
          {/* Left sub-panel: tools, swatch, budget, wheels */}
          <View style={[styles.mobilePanelLeft, { flex: 1, height: '100%', gap: 6, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
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
            </View>
            <View style={[styles.mobileColorSwatch, { backgroundColor: currentColor, width: '100%', height: 12, borderRadius: 6 }]} />
            {pixelsRemaining !== null && (
              <View style={[styles.budgetBadge, { alignItems: 'center' }]}>
                <Text style={[styles.budgetText, { textAlign: 'center' }]}>{pixelsRemaining} pixels remaining</Text>
              </View>
            )}
            <ColorWheel
              color={currentColor}
              onChange={setCurrentColor}
              visible={true}
              hideToggle={true}
              size={minimapSize}
              selectedIndex={selectedWheelIndex}
              onSelectIndex={setSelectedWheelIndex}
              columns={4}
              externalPickPos={sharedPickPos}
              onExternalPickPos={setSharedPickPos}
            />
          </View>
          {/* HSB sliders + minimap */}
          <View style={{ justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <HSBSlidersInline currentColor={currentColor} sliderCenterRef={sliderCenterRef} hexToHsl={hexToHsl} hslToHex={hslToHex} setCurrentColorFromSlider={setCurrentColorFromSlider} />
            <div style={{
              position: 'relative',
              width: minimapSize,
              height: minimapSize,
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px dashed rgba(92, 90, 88, 0.55)',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
              onClick={(e) => {
                if (!gridScrollRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const el = gridScrollRef.current;
                el.scrollLeft = ((e.clientX - rect.left) / rect.width) * el.scrollWidth - el.clientWidth / 2;
                el.scrollTop = ((e.clientY - rect.top) / rect.height) * el.scrollHeight - el.clientHeight / 2;
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (!touch || !gridScrollRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const el = gridScrollRef.current;
                el.scrollLeft = ((touch.clientX - rect.left) / rect.width) * el.scrollWidth - el.clientWidth / 2;
                el.scrollTop = ((touch.clientY - rect.top) / rect.height) * el.scrollHeight - el.clientHeight / 2;
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (!touch || !gridScrollRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const el = gridScrollRef.current;
                el.scrollLeft = ((touch.clientX - rect.left) / rect.width) * el.scrollWidth - el.clientWidth / 2;
                el.scrollTop = ((touch.clientY - rect.top) / rect.height) * el.scrollHeight - el.clientHeight / 2;
              }}
            >
              <PixelThumbnail pixels={localPixels} width={width} height={height} size={minimapSize} />
              {gridScroll.scrollWidth > 0 && gridScroll.scrollHeight > 0 && (
                <div style={{
                  position: 'absolute',
                  left: (gridScroll.scrollLeft / gridScroll.scrollWidth) * minimapSize,
                  top: (gridScroll.scrollTop / gridScroll.scrollHeight) * minimapSize,
                  width: (gridScroll.clientWidth / gridScroll.scrollWidth) * minimapSize,
                  height: (gridScroll.clientHeight / gridScroll.scrollHeight) * minimapSize,
                  border: '2px dashed rgba(255, 255, 255, 0.85)',
                  borderRadius: 2,
                  boxShadow: '0 0 3px rgba(0, 0, 0, 0.4)',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                }} />
              )}
            </div>
          </View>
        </View>

        {/* Scrollable grid area */}
        <div ref={gridScrollRef} style={{
          flex: 1, height: containerSize.height,
          overflow: 'scroll',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }} onScroll={(e) => {
          const t = e.target;
          setGridScroll({ scrollLeft: t.scrollLeft, scrollTop: t.scrollTop, clientWidth: t.clientWidth, clientHeight: t.clientHeight, scrollWidth: t.scrollWidth, scrollHeight: t.scrollHeight });
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
                      outline: '3px solid #7044C7', outlineOffset: '-1px', zIndex: 5,
                      boxShadow: '0 0 8px rgba(112, 68, 199, 0.6)',
                    } : {}),
                  }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const touch = e.touches[0];
                      if (!touch) return;
                      if (tool === TOOLS.EYEDROPPER) {
                        const c = localPixels[y * width + x];
                        if (c) setCurrentColor(c);
                        setTool(TOOLS.DRAW);
                        return;
                      }
                      if (tool === TOOLS.PAINT || tool === TOOLS.ERASER) {
                        setIsDrawing(true);
                        tapStartRef.current = { x: touch.clientX, y: touch.clientY };
                        paintTouchRef.current = { x: touch.clientX, y: touch.clientY };
                        handlePixelAction({ x, y });
                        // Start centering drift loop
                        const driftLoop = () => {
                          const scrollEl = gridScrollRef.current;
                          const pt = paintTouchRef.current;
                          if (!scrollEl || !pt) return;
                          const rect = scrollEl.getBoundingClientRect();
                          const centerX = rect.left + rect.width / 2;
                          const centerY = rect.top + rect.height / 2;
                          const offsetX = pt.x - centerX;
                          const offsetY = pt.y - centerY;
                          const speed = 0.048;
                          const maxDrift = 7;
                          const driftX = Math.max(-maxDrift, Math.min(maxDrift, offsetX * speed));
                          const driftY = Math.max(-maxDrift, Math.min(maxDrift, offsetY * speed));
                          if (Math.abs(offsetX) > 4) scrollEl.scrollLeft += driftX;
                          if (Math.abs(offsetY) > 4) scrollEl.scrollTop += driftY;
                          paintDriftRef.current = requestAnimationFrame(driftLoop);
                        };
                        if (paintDriftRef.current) cancelAnimationFrame(paintDriftRef.current);
                        paintDriftRef.current = requestAnimationFrame(driftLoop);
                        return;
                      }
                      // DRAW mode: open wheel
                      wheelOpenTimeRef.current = Date.now();
                      wheelTouchIdRef.current = touch?.identifier ?? null;
                      latestPickedColorRef.current = currentColor;
                      setWheelOverlay({
                        pixelX: x, pixelY: y,
                        screenX: touch.clientX, screenY: touch.clientY,
                        previewColor: currentColor,
                      });
                      setMobileDragEnabled(false);
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      holdTimerRef.current = setTimeout(() => {
                        setMobileDragEnabled(true);
                        setIsDrawing(true);
                        closeWheelOverlay();
                      }, 4000);
                    }}
                    onTouchMove={(e) => {
                      if (isDrawing) {
                        e.preventDefault();
                        const touch = e.touches[0];
                        // Paint cells under finger — sample grid at cell-size intervals
                        const paintHalf = mobileCellSize * 0.72;
                        const step = mobileCellSize * 0.5;
                        const seen = new Set();
                        for (let ox = -paintHalf; ox <= paintHalf; ox += step) {
                          for (let oy = -paintHalf; oy <= paintHalf; oy += step) {
                            const el = document.elementFromPoint(touch.clientX + ox, touch.clientY + oy);
                            if (el?.dataset?.px) {
                              const key = `${el.dataset.px},${el.dataset.py}`;
                              if (!seen.has(key)) {
                                seen.add(key);
                                handlePixelAction({ x: +el.dataset.px, y: +el.dataset.py });
                              }
                            }
                          }
                        }
                        // Update touch position for centering drift loop
                        paintTouchRef.current = { x: touch.clientX, y: touch.clientY };
                        return;
                      }
                      if (!mobileDragEnabled) return;
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (el?.dataset?.px) handlePixelAction({ x: +el.dataset.px, y: +el.dataset.py });
                    }}
                    onTouchEnd={() => {
                      tapStartRef.current = null;
                      paintTouchRef.current = null;
                      if (paintDriftRef.current) { cancelAnimationFrame(paintDriftRef.current); paintDriftRef.current = null; }
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      if (isDrawing || mobileDragEnabled) { setIsDrawing(false); commitPixels(); }
                      setMobileDragEnabled(false);
                    }}
                    data-px={x} data-py={y}
                  >
                    {mobileCellSize >= 6 && <div style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, border: '1px dashed rgba(92, 90, 88, 0.55)', pointerEvents: 'none' }} />}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTop: '1px solid rgba(255,255,255,0.5)', borderLeft: '1px solid rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.15)', borderRight: '1px solid rgba(0,0,0,0.15)', pointerEvents: 'none', boxSizing: 'border-box' }} />
                    {phantomColor && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: phantomColor, opacity: 0.1, pointerEvents: 'none' }} />}
                    {selectedPixel && selectedPixel.x === x && selectedPixel.y === y && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(92, 90, 88, 0.5)', pointerEvents: 'none', zIndex: 3 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wheel overlay — fixed, screen-clamped, same as portrait */}
        {wheelOverlay && (() => {
          const screenW = typeof window !== 'undefined' ? window.innerWidth : containerSize.width;
          const screenH = typeof window !== 'undefined' ? window.innerHeight : containerSize.height;
          const mobileOverlaySize = Math.min(screenW * 0.7, 280);
          return (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); const c = latestPickedColorRef.current || latestWheelOverlayRef.current?.previewColor; if (c) setCurrentColor(c); closeWheelOverlay(); }}
                onClick={() => { const c = latestPickedColorRef.current || latestWheelOverlayRef.current?.previewColor; if (c) setCurrentColor(c); closeWheelOverlay(); }}
              />
              <div ref={mobileWheelRef} style={{
                position: 'fixed',
                left: Math.max(8, Math.min(screenW - mobileOverlaySize - 8, (wheelOverlay.screenX || 0) - mobileOverlaySize / 2)),
                top: Math.max(8, Math.min(screenH - mobileOverlaySize - 8, (wheelOverlay.screenY || 0) - mobileOverlaySize / 2)),
                width: mobileOverlaySize, height: mobileOverlaySize,
                pointerEvents: 'auto', opacity: wheelFading ? 0 : 1,
                transition: 'opacity 0.3s ease-out', zIndex: 10000,
              }}>
                <div style={{ opacity: 0.85, width: '100%', height: '100%' }}>
                  <ColorWheel
                    color={wheelOverlay.previewColor}
                    onChange={(c) => { setWheelOverlay(prev => prev ? { ...prev, previewColor: c } : null); setCurrentColor(c); }}
                    onCommit={() => { if (wheelOverlay?.previewColor) setCurrentColor(wheelOverlay.previewColor); closeWheelOverlay(); }}
                    visible={true} hideToggle={true} size={mobileOverlaySize}
                    singleIndex={selectedWheelIndex} alwaysTrack={true}
                    externalPickPos={sharedPickPos} onExternalPickPos={setSharedPickPos}
                  />
                </div>
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 24, backgroundColor: wheelOverlay.previewColor, boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 0 6px rgba(0,0,0,0.4)', borderRadius: 12, pointerEvents: 'none', zIndex: 11 }} />
                {wheelOverlay.indicatorX != null && (
                  <div style={{ position: 'absolute', left: wheelOverlay.indicatorX * mobileOverlaySize - 6, top: wheelOverlay.indicatorY * mobileOverlaySize - 6, width: 12, height: 12, borderRadius: '50%', border: '2.5px solid #fff', boxShadow: '0 0 4px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 12 }} />
                )}
              </div>
            </>
          );
        })()}
      </View>
    );
  }

  // === DESKTOP LAYOUT ===
  return (
    <View style={[styles.container, style]} onLayout={handleContainerLayout}>
      <View style={styles.mainRow}>
        {/* Left panel: tools, budget, color, wheels, swatches */}
        <View style={styles.leftPanel} {...(Platform.OS === 'web' && !isMobile ? { onClick: (e) => { if (e.target === e.currentTarget) setSelectedPixel(null); } } : {})}>
          {/* Tool bar: horizontal icons on landscape mobile, vertical with labels on desktop */}
          <View style={styles.landscapeToolbar}>
            {[
              { key: TOOLS.DRAW, label: 'Draw' },
              { key: TOOLS.PAINT, label: 'Paint' },
              { key: TOOLS.EYEDROPPER, label: 'Pick' },
              { key: TOOLS.ERASER, label: 'Erase' },
            ].map(t => (
              <Pressable
                key={t.key}
                style={[
                  styles.landscapeToolBtn,
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
                styles.landscapeToolBtn,
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
                <Text style={styles.budgetText}>{pixelsRemaining} pixels remaining</Text>
              </View>
            )}
          </View>

          {/* Budget — desktop only (landscape has it inline above) */}
          {!isLandscapeMobile && pixelsRemaining !== null && (
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{pixelsRemaining} pixels remaining</Text>
            </View>
          )}

          {/* Current color - big swatch — desktop only */}
          {!isLandscapeMobile && (
            <View style={[styles.bigSwatch, { backgroundColor: currentColor }]} />
          )}

          {/* HSB Sliders — constrained to range around center point */}
          {Platform.OS === 'web' && (() => {
            const hsl = hexToHsl(currentColor);
            const center = sliderCenterRef.current || hsl;

            const levels = 16;
            const hueLevels = 8;

            // Hue: +/-8% of 360 = +/-28.8°
            const hRange = 28.8;
            const hueStops = Array.from({ length: 8 }, (_, i) => {
              const t = i / 7;
              const h = ((center.h - hRange + t * hRange * 2) % 360 + 360) % 360;
              return `${hslToHex(h, hsl.s, hsl.l)} ${Math.round(t * 100)}%`;
            }).join(', ');

            // Saturation: +/-20%
            const sRange = 20;
            const sMin = Math.max(0, center.s - sRange);
            const sMax = Math.min(100, center.s + sRange);
            const satStops = Array.from({ length: 5 }, (_, i) => {
              const t = i / 4;
              const s = sMin + t * (sMax - sMin);
              return `${hslToHex(hsl.h, s, hsl.l)} ${Math.round(t * 100)}%`;
            }).join(', ');

            // Brightness: +/-20%
            const bRange = 20;
            const bMin = Math.max(0, center.l - bRange);
            const bMax = Math.min(100, center.l + bRange);
            const briStops = Array.from({ length: 5 }, (_, i) => {
              const t = i / 4;
              const l = bMin + t * (bMax - bMin);
              return `${hslToHex(hsl.h, hsl.s, l)} ${Math.round(t * 100)}%`;
            }).join(', ');

            // Map slider 0-16 to constrained range
            const hSliderVal = Math.round(((hsl.h - (center.h - hRange) + 360) % 360) / (hRange * 2) * hueLevels);
            const sSliderVal = Math.round((hsl.s - sMin) / (sMax - sMin || 1) * levels);
            const bSliderVal = Math.round((hsl.l - bMin) / (bMax - bMin || 1) * levels);

            const sliderStyle = (gradient) => ({
              flex: 1, height: 14, borderRadius: 7,
              WebkitAppearance: 'none', appearance: 'none',
              background: `linear-gradient(to right, ${gradient})`,
              outline: 'none', cursor: 'pointer',
            });

            return (
              <View style={styles.sliderGroup}>
                <style dangerouslySetInnerHTML={{ __html: `
                  .hsb-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 14px; height: 14px; border-radius: 50%;
                    background: white; border: 2px solid rgba(112, 68, 199, 0.6);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3); cursor: pointer;
                  }
                  .hsb-slider::-moz-range-thumb {
                    width: 14px; height: 14px; border-radius: 50%;
                    background: white; border: 2px solid rgba(112, 68, 199, 0.6);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3); cursor: pointer;
                  }
                `}} />
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>H</Text>
                  <input type="range" className="hsb-slider" min={0} max={hueLevels} step={1}
                    value={Math.max(0, Math.min(hueLevels, hSliderVal))}
                    onChange={(e) => {
                      const h = ((center.h - hRange + (parseInt(e.target.value) / hueLevels) * hRange * 2) % 360 + 360) % 360;
                      setCurrentColorFromSlider(hslToHex(h, hsl.s, hsl.l));
                    }}
                    style={sliderStyle(hueStops)} />
                </View>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>S</Text>
                  <input type="range" className="hsb-slider" min={0} max={levels} step={1}
                    value={Math.max(0, Math.min(levels, sSliderVal))}
                    onChange={(e) => {
                      const s = sMin + (parseInt(e.target.value) / levels) * (sMax - sMin);
                      setCurrentColorFromSlider(hslToHex(hsl.h, s, hsl.l));
                    }}
                    style={sliderStyle(satStops)} />
                </View>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>B</Text>
                  <input type="range" className="hsb-slider" min={0} max={levels} step={1}
                    value={Math.max(0, Math.min(levels, bSliderVal))}
                    onChange={(e) => {
                      const l = bMin + (parseInt(e.target.value) / levels) * (bMax - bMin);
                      setCurrentColorFromSlider(hslToHex(hsl.h, hsl.s, l));
                    }}
                    style={sliderStyle(briStops)} />
                </View>
              </View>
            );
          })()}

          {isLandscapeMobile && (
            <HSBSlidersInline currentColor={currentColor} sliderCenterRef={sliderCenterRef} hexToHsl={hexToHsl} hslToHex={hslToHex} setCurrentColorFromSlider={setCurrentColorFromSlider} />
          )}
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

          {/* Color wheels — 6 wide on landscape mobile, 4 on desktop */}
          <ColorWheel
            color={currentColor}
            onChange={setCurrentColor}
            visible={true}
            hideToggle={true}
            size={leftPanelWidth - 20}
            selectedIndex={selectedWheelIndex}
            onSelectIndex={setSelectedWheelIndex}
            columns={isLandscapeMobile ? 6 : 4}
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
                      setSelectedPixel({ x, y });
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
                        // Paint this pixel directly (not via pendingPixels which has stale closure)
                        setSelectedPixel({ x, y });
                        const c = currentColor;
                        setLocalPixels(prev => {
                          const next = [...prev];
                          next[y * width + x] = c;
                          return next;
                        });
                        onPixelsChanged?.([{ x, y, color: c }]);
                        return;
                      }
                      // Left click in draw mode: quick click paints, hold opens wheel
                      if (tool === TOOLS.DRAW) {
                        const cellStep = cellSize + pixelGap;
                        tapStartRef.current = { cellX: x, cellY: y };
                        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                        holdTimerRef.current = setTimeout(() => {
                          tapStartRef.current = null;
                          setWheelOverlay({
                            pixelX: x,
                            pixelY: y,
                            left: x * cellStep + cellSize / 2,
                            top: y * cellStep + cellSize / 2,
                            previewColor: currentColor,
                          });
                        }, 212);
                        return;
                      }
                      setIsDrawing(true);
                      handlePixelAction({ x, y });
                    }}
                    onMouseUp={() => {
                      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                      if (tapStartRef.current) {
                        const tx = tapStartRef.current.cellX;
                        const ty = tapStartRef.current.cellY;
                        setSelectedPixel({ x: tx, y: ty });
                        // Always paint with current color
                        const c = currentColor;
                        setLocalPixels(prev => {
                          const next = [...prev];
                          next[ty * width + tx] = c;
                          return next;
                        });
                        onPixelsChanged?.([{ x: tx, y: ty, color: c }]);
                        tapStartRef.current = null;
                      }
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
                    {selectedPixel && selectedPixel.x === x && selectedPixel.y === y && (
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 4, height: 4, borderRadius: '50%',
                        backgroundColor: 'rgba(92, 90, 88, 0.5)',
                        pointerEvents: 'none', zIndex: 3,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Color wheel overlay */}
            {wheelOverlay && (
              <div
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
    justifyContent: 'center',
    gap: 8,
    minHeight: 0,
  },
  leftPanel: {
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginRight: '2%',
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
  sliderGroup: {
    gap: 2,
    alignSelf: 'stretch',
    paddingHorizontal: 2,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sliderLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 8,
    color: '#5C5A58',
    fontWeight: '700',
    width: 10,
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
