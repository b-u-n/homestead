# Mobile Color Wheel Touch/Drag Implementation

These patterns are used in both portrait and landscape mobile modes for the PixelEditor's popup color wheel overlay.

## Core Problem
Touch events are delivered to the element where `touchstart` occurred. Since the touch starts on a pixel cell (not the wheel), the wheel's own `onTouchMove`/`onTouchEnd` never fire. Solution: global document-level listeners.

## Key Refs
```js
const mobileWheelRef = useRef(null);           // DOM ref to wheel overlay container
const latestWheelOverlayRef = useRef(null);    // Always-current wheelOverlay state (avoids stale closures)
const wheelOpenTimeRef = useRef(0);            // Timestamp when wheel opened (guards against instant close)
```

## Ref Sync
```js
useEffect(() => {
  latestWheelOverlayRef.current = wheelOverlay;
}, [wheelOverlay]);
```

## closeWheelOverlay
Must read from `latestWheelOverlayRef`, NOT from `wheelOverlay` state (stale closure).
```js
const closeWheelOverlay = useCallback(() => {
  const wo = latestWheelOverlayRef.current;
  if (wo?.previewColor) setCurrentColor(wo.previewColor);
  setWheelOverlay(null);
  setWheelFading(false);
}, [setCurrentColor]);
```

## Global Touch Listeners (useEffect)
Only active when `isMobile && wheelOverlay` is truthy.

### touchmove
1. `e.preventDefault()` — stops scroll container from scrolling
2. Find canvas via `mobileWheelRef.current.querySelector('canvas')`
3. Map touch coords to canvas internal coords (accounting for display scale)
4. Read pixel color via `getImageData`
5. Update `wheelOverlay` state with `previewColor`, `indicatorX`, `indicatorY`
6. Update `currentColor`

### touchend
1. Guard: if < 600ms since open, ignore (prevents opening tap from closing)
2. Read latest state from `latestWheelOverlayRef.current`
3. Paint the target pixel with `previewColor`
4. Call `onPixelsChanged` to send to backend
5. Call `closeWheelOverlay()`

## Wheel Overlay State Shape
```js
{
  pixelX, pixelY,        // Grid coordinates of target pixel
  screenX, screenY,      // Touch screen coordinates (for positioning overlay)
  previewColor,          // Current color being previewed
  indicatorX, indicatorY // Normalized 0-1 position on wheel (for indicator dot)
}
```

## Indicator Dot
Rendered as a 12px white circle with shadow at `indicatorX * overlaySize, indicatorY * overlaySize` inside the wheel overlay div.

## Target Pixel Highlight
When wheel is open, the target pixel gets:
```js
outline: '3px solid #7044C7',
outlineOffset: '-1px',
zIndex: 5,
boxShadow: '0 0 8px rgba(112, 68, 199, 0.6)',
```

## Double-Click Toggle
Disabled on mobile (`if (!isMobile)` guard) to prevent accidental Draw↔Paint switching.

## Scroll Blocking
Three mechanisms work together:

1. **Portrait grid div**: toggles `overflow: wheelOverlay ? 'hidden' : 'auto'` inline on the raw HTML scroll div.

2. **Module-level scroll lock** (`frontend/contexts/ScrollLockContext.js`): PixelEditor calls `setScrollEnabled(false)` when the wheel opens and `setScrollEnabled(true)` when it closes. This is a module-level pub/sub (not React context) so it works regardless of component tree position.

3. **ScrollBarView handler guards**: All scroll event handlers in ScrollBarView (`handleTouchStart`, `handleTouchMove`, `onWheel`) check `scrollEnabledRef.current` before processing. The ref is synced on every render so it's never stale, even inside `addEventListener` closures. The Scrollbar component receives `onScroll={undefined}` when disabled, which makes all its internal handlers (drag, wheel, track click) no-op since they check `!onScroll`.

**Flow**: `setScrollEnabled(false)` → `Scroll.js` subscriber updates state → passes `scrollEnabled={false}` to `ScrollBarView` → ref updated → every handler blocked.

Also: global `document.addEventListener('wheel', blockWheel)` in the mobile touchmove useEffect catches any remaining wheel events on the page.

## Cell Touch Handler (portrait)
- Only `onTouchStart`, no `onMouseDown`/`onMouseEnter` (prevents duplicate events)
- Always uses Draw mode (opens wheel overlay)
- Does NOT call `handlePixelAction` — touchend paints the pixel
- `e.preventDefault()` + `e.stopPropagation()` to prevent scroll
