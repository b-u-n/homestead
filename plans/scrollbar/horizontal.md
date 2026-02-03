# Add Horizontal Scrollbar Support + Apply to Two Overflow Areas

## Files to modify
- `frontend/components/Scrollbar.js` — axis-swap logic (horizontal prop)
- `frontend/components/ScrollBarView.js` — layout swap, metric axis swap
- `frontend/screens/UsernameCreationScreen.js` — wrap slot machines in horizontal Scroll
- `frontend/components/LibraryNav.js` — wrap room list in vertical Scroll with maxHeight

`frontend/components/Scroll.js` already passes `horizontal` through and has directional fade masks. No changes needed.

---

## 1. Scrollbar.js — Add `horizontal` prop

Add `horizontal = false` to props. Keep existing prop names (`contentHeight`, `visibleHeight`, `scrollOffset`) — the caller will pass the correct axis values regardless.

**Event handlers** — swap axis reads with ternaries:
- `clientY` → `horizontal ? clientX : clientY` (in handleMouseMove, handleTouchMove, handleTrackMouseDown, handleTrackTouchStart, handleMouseDown, handleTouchStart)
- `rect.height` → `horizontal ? rect.width : rect.height` (in handleDragMove, handleTrackMouseDown, handleTrackTouchStart)
- `e.clientY - rect.top` → `horizontal ? (e.clientX - rect.left) : (e.clientY - rect.top)` (in track click/touch handlers)
- `e.deltaY` → `horizontal ? (e.deltaX || e.deltaY) : e.deltaY` (in handleWheel — fallback so vertical wheel works on horizontal scrollbar)

**Rendering** — swap track and thumb orientation:
- Track: `height:'100%', width:trackWidth` → horizontal: `width:'100%', height:trackWidth`
- Thumb: `left/right:3, height:calc(...), top:calc(...)` → horizontal: `top/bottom:3, width:calc(...), left:calc(...)`

Add `horizontal` to dependency arrays of affected useCallbacks.

## 2. ScrollBarView.js — Layout and metric swap

**Destructure `horizontal`** from props (currently falls into `...scrollViewProps`). Pass it explicitly to both `<ScrollView>` and `<Scrollbar>`.

**Scroll metrics** — swap axis:
- `handleScroll`: `contentOffset.y` → `.x`, `layoutMeasurement.height` → `.width`, `contentSize.height` → `.width`
- `handleLayout`: `layout.height` → `.width`
- `handleContentSizeChange`: `h` → `w`
- `handleScrollbarScroll`: `scrollTo({y:offset})` → `scrollTo({x:offset})`

**Scrollbar positioning** — swap from right-side to bottom:
- Vertical: `top:8, right:2, bottom:8, width:30, flexDirection:'row'`
- Horizontal: `left:8, right:8, bottom:2, height:30, flexDirection:'column'`

**ScrollView padding** — swap `paddingRight:30` to `paddingBottom:30` when horizontal.

**Invisible padding div** — swap `{width:6}` to `{height:6}`.

**Wheel handler** — swap `e.deltaY` to `(e.deltaX || e.deltaY)` when horizontal.

**Indicator props** — add `showsHorizontalScrollIndicator={false}`.

## 3. UsernameCreationScreen.js — Horizontal slot machine scroll

Replace `<View style={styles.slotMachinesContainer}>` with `<Scroll horizontal>`.

Wrap each SlotMachine in `<View style={styles.slotMachineWrapper}>` with `minWidth: 220, flex: 1` so they don't collapse to zero width inside horizontal ScrollView.

Split styles:
```
slotMachinesScroll: { marginBottom: 40, maxWidth: 1000, width: '100%', minHeight: 480 }
slotMachinesContainer: { flexDirection: 'row', paddingHorizontal: 10, gap: 10, paddingVertical: 0 }
slotMachineWrapper: { minWidth: 220, flex: 1 }
```

## 4. LibraryNav.js — Vertical scroll with maxHeight

Import `Scroll`. Add `maxHeight` to container (use `Dimensions.get('window').height - 100` for cross-platform, or viewport calc for web-only).

Wrap the room list `<View style={styles.roomList}>` content in `<Scroll>`, moving gap styling to contentContainerStyle. The header ("~ SECTIONS ~") stays outside the Scroll so it's always visible.

Add `overflow: 'hidden'` to container style.

---

## Execution order

1. **Scrollbar.js** — axis-swap foundation
2. **ScrollBarView.js** — layout/metric swap (depends on 1)
3. **UsernameCreationScreen.js** — horizontal scroll consumer (depends on 1+2)
4. **LibraryNav.js** — vertical scroll consumer (independent of 1+2, just uses existing vertical mode)

## Verification
- On narrow mobile screen, slot machine wheels scroll horizontally with a visible scrollbar at bottom
- Scrollbar thumb drags horizontally, track click-jumps work, wheel scrolls
- On wide screen, all 3 slot machines fit without scrollbar appearing
- LibraryNav shows a scrollbar when menu overflows viewport height
- LibraryNav stays centered and absolutely positioned on the map
- Existing vertical scrollbars throughout the app are unaffected (no regressions)
