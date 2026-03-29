# Mobile Color Wheel Touch/Drag Implementation

These patterns are used in both portrait and landscape mobile modes for the PixelEditor's popup color wheel overlay.

## Core Problem
Touch events are delivered to the element where `touchstart` occurred. Since the touch starts on a pixel cell (not the wheel), the wheel's own `onTouchMove`/`onTouchEnd` never fire. Solution: global document-level listeners.

## Key Refs
```js
const mobileWheelRef = useRef(null);           // DOM ref to wheel overlay container
const latestWheelOverlayRef = useRef(null);    // Always-current wheelOverlay state (avoids stale closures)
const wheelOpenTimeRef = useRef(0);            // Timestamp when wheel opened (guards against instant close)
const containerRef = useRef(null);             // DOM ref to PixelEditor container View (for overlay positioning)
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

## Wheel Overlay Positioning

### Why `position: absolute` (not `fixed`)
The wheel overlay lives inside Modal's container div. When `uxStore.isPortrait === true` (phone physically portrait, content displayed as landscape), Modal applies `transform: rotate(90deg) translateY(-Hpx)` with `transformOrigin: top left`. Per CSS spec, `position: fixed` inside a transformed ancestor behaves like `position: absolute` relative to that ancestor. So we use `position: absolute` explicitly and compute coordinates in the container's local space.

### How coordinates are computed
At wheel open time (in the cell's `onTouchStart`), compute the cell's center position relative to the PixelEditor container:

```js
const cellRect = cellEl.getBoundingClientRect();  // physical viewport coords
const contRect = contEl.getBoundingClientRect();  // physical viewport coords
const physX = (cellRect.left + cellRect.width / 2) - contRect.left;
const physY = (cellRect.top + cellRect.height / 2) - contRect.top;
```

Both `getBoundingClientRect()` calls return physical viewport coordinates (accounting for CSS transforms). Their difference gives a physical offset.

### Portrait rotation coordinate transform (`actuallyPortraitMode`)
When `uxStore.isPortrait` is true, the content is CSS-rotated 90deg. Physical screen axes don't match the container's local axes. The transform is:

```js
if (actuallyPortraitMode) {
  overlayX = physY;                      // physical vertical → local horizontal
  overlayY = contRect.width - physX;     // physical horizontal → local vertical (INVERTED)
  containerW = contRect.height;          // physical height = local width (long axis)
  containerH = contRect.width;           // physical width = local height (short axis)
} else {
  overlayX = physX;
  overlayY = physY;
  containerW = contRect.width;
  containerH = contRect.height;
}
```

**Key: the short axis (overlayY) must be inverted** (`contRect.width - physX`). This matches the 90deg clockwise rotation where one axis flips direction.

### CRITICAL: capture DOM rects synchronously, not in setTimeout
The `getBoundingClientRect()` calls MUST happen synchronously in the touch event handler, NOT inside a `setTimeout` callback. React's synthetic events are pooled — `e.currentTarget` becomes null after the event handler returns. If wheel opening is delayed (e.g., hold timer), capture the cell element and rects first, then use them in the timer callback.

### Pre-computed values stored in wheelOverlay state
All positioning values are computed once at open time and stored in wheelOverlay state to avoid calling `getBoundingClientRect()` during render (which forces layout reflows and kills performance):

```js
setWheelOverlay({
  pixelX, pixelY,       // grid coordinates
  overlayX, overlayY,   // container-relative center position
  contW, contH,         // container dimensions (local space)
  overlaySize,          // Math.min(contW * 0.49, 196) — 30% smaller than original
  previewColor,
});
```

### Overlay rendering uses stored values directly
```js
const { contW, contH, overlaySize } = wheelOverlay;
// No getBoundingClientRect() calls during render!
left: Math.max(8, Math.min(contW - overlaySize - 8, overlayX - overlaySize / 2))
top:  Math.max(8, Math.min(contH - overlaySize - 8, overlayY - overlaySize / 2))
```

## Canvas Touch Coordinate Transform (global touchmove handler)
When picking colors from the wheel canvas via touch, physical touch coordinates must be mapped to canvas pixel coordinates. In portrait rotation, the axes are swapped and the short axis is inverted:

```js
if (uxStore.isPortrait) {
  cx = (touch.clientY - rect.top) * scaleY;                    // physical Y → canvas X
  cy = canvas.height - (touch.clientX - rect.left) * scaleX;   // physical X → canvas Y (INVERTED)
} else {
  cx = (touch.clientX - rect.left) * scaleX;
  cy = (touch.clientY - rect.top) * scaleY;
}
```

## Quick Tap vs Hold (DRAW mode)
On mobile, DRAW mode uses a 212ms hold timer to distinguish quick tap from hold:
- **Quick tap** (< 212ms): paints the pixel with current color immediately on touchEnd
- **Hold** (>= 212ms): opens the color wheel overlay

This matches the desktop behavior. The `tapStartRef` tracks the pending quick-tap state and is cleared when the hold timer fires.

## Global Touch Listeners (useEffect)
Only active when `isMobile && wheelOverlay` is truthy.

### touchmove
1. `e.preventDefault()` — stops scroll container from scrolling
2. Find canvas via `mobileWheelRef.current.querySelector('canvas')`
3. Map touch coords to canvas internal coords (accounting for display scale and portrait rotation)
4. Read pixel color via `getImageData`
5. Update `wheelOverlay` state with `previewColor`, `indicatorX`, `indicatorY`
6. Update `currentColor`

### touchend
1. Guard: if < 600ms since open, ignore (prevents opening tap from closing)
2. Read latest state from `latestWheelOverlayRef.current`
3. Paint the target pixel with `previewColor`
4. Call `onPixelsChanged` to send to backend
5. Call `closeWheelOverlay()`

## HSB Sliders (TouchSlider) and Portrait Rotation
The `TouchSlider` component maps physical touch X to a 0–1 slider value via `getBoundingClientRect()`. In portrait rotation, the slider is physically vertical but rendered horizontally in local space, so the axis is inverted:

```js
const t = rotated
  ? Math.max(0, Math.min(1, 1 - (clientX - rect.left) / rect.width))
  : Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
```

The `rotated` prop is passed as `actuallyPortraitMode` from PixelEditor → `HSBSlidersInline` → `TouchSlider`.

## Manual Scroll After Wheel Dismiss
When the user drags outside the wheel circle, the wheel is dismissed and manual scrolling begins. In portrait rotation, scroll deltas must be swapped:

```js
if (uxStore.isPortrait) {
  el.scrollLeft += dy;  // physical vertical movement → horizontal scroll
  el.scrollTop += dx;   // physical horizontal movement → vertical scroll
} else {
  el.scrollLeft += dx;
  el.scrollTop += dy;
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

## Cell Touch Handler (mobile)
- Only `onTouchStart`, no `onMouseDown`/`onMouseEnter` (prevents duplicate events)
- DRAW mode: hold timer (212ms) — quick tap paints, hold opens wheel
- PAINT/ERASER modes: immediate action, no wheel
- `e.preventDefault()` + `e.stopPropagation()` to prevent scroll
