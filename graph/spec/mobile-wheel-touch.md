---
schema_version: 2
id: spec/mobile-wheel-touch
type: spec
title: Mobile Color Wheel Touch
status: stable
last_audited: 2026-05-22
tags: [mobile, touch, pixel-editor]
source_doc:
  - doc/mobile-wheel-touch
references:
  - spec/scrollbar-system
---

## Rules

### R1: Touch handlers MUST be global (`document.addEventListener`), NOT per-element

Touch events route to the element where `touchstart` fired. Since the gesture starts on a pixel cell (not the color wheel overlay), per-element `onTouchMove`/`onTouchEnd` on the wheel never fire. Solution: register `touchmove`/`touchend` listeners on `document` while the wheel is open.

**Why:** Per-element listeners look right and feel right but silently never fire — the highest-cost bug class in this surface.
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "Core Problem" + "Global Touch Listeners" sections.
**Test:** Attempt to drag from a pixel cell onto the wheel — confirm color preview updates as the finger moves over the wheel.

### R2: State reads inside global listeners MUST use refs, NEVER React state — stale closures will eat you

`closeWheelOverlay` reads from `latestWheelOverlayRef.current`, not from `wheelOverlay` state. Same for `scrollEnabledRef` in ScrollBarView, `currentColorRef`, etc. Every long-lived listener captures its closure ONCE at `addEventListener` time, and React state inside that closure is forever stuck on its initial value.

**Why:** This is the React mobile pattern that breaks every implementer once. The symptom is "the color preview works but never commits" — the touchend reads the initial color, not the latest dragged preview.
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "closeWheelOverlay" + "Ref Sync" sections.
**Test:** Open the wheel, drag to a different color, lift — confirm the pixel paints with the dragged color, not the initial color.

### R3: Portrait rotation coordinate transform swaps axes AND inverts the short axis

When `uxStore.isPortrait === true`, Modal applies `transform: rotate(90deg) translateY(-Hpx)`. To map physical viewport coordinates into the container's local space:
- `overlayX = physY` (physical vertical → local horizontal)
- `overlayY = contRect.width - physX` (physical horizontal → local vertical, **inverted**)
- `containerW = contRect.height`, `containerH = contRect.width`

The short-axis inversion (`contRect.width - physX`) is mandatory — without it, vertical drag direction is reversed.

**Why:** A 90° clockwise rotation maps two axes — one direct, one inverted. Missing the inversion produces a wheel that tracks the finger correctly along one axis and backwards along the other.
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "Portrait rotation coordinate transform" + "Canvas Touch Coordinate Transform" sections.
**Test:** Enable portrait rotation, drag finger up on the wheel — confirm hue indicator moves up (not down). Drag right — confirm it moves right.

### R4: `getBoundingClientRect()` MUST be called synchronously in the touch handler, NEVER in `setTimeout`

React's synthetic events are pooled. After the event handler returns, `e.currentTarget` becomes null. If wheel opening is delayed (hold timer), capture the cell element and its rect FIRST, then use the captured values in the timer callback.

**Why:** The bug surface here is intermittent and confusing — works the first time you open the wheel, fails after a fast retry because the pooled event was reused.
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "CRITICAL: capture DOM rects synchronously" section.
**Test:** Add a `setTimeout(_, 0)` wrapping the `getBoundingClientRect()` call — confirm the wheel opens off-center on rapid taps.

### R5: Position values are computed ONCE at open time, stored in state, NEVER recomputed during render

The wheel overlay state stores `overlayX`, `overlayY`, `contW`, `contH`, `overlaySize`. Render reads from state. Render does NOT call `getBoundingClientRect()` because that forces layout reflows on every render and tanks performance.

**Why:** Render-time `getBoundingClientRect()` is a layout-thrash trap. One call per frame at 60fps × dozens of cells = mobile jank.
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "Pre-computed values stored in wheelOverlay state" section.
**Test:** Open the wheel, profile renders — confirm no layout thrashes in the React DevTools Profiler.

### R6: Quick-tap vs hold MUST be distinguished by a 212ms hold timer (mobile only)

Mobile DRAW mode: a 212ms timer differentiates quick tap (< 212ms, paints with current color on touchEnd) from hold (>= 212ms, opens color wheel). Desktop uses the same 212ms threshold for parity. Mobile-only `isMobile` guard prevents accidental Draw↔Paint switching via double-click.

**Why:** Mobile users cannot reliably double-click; the hold gesture is the natural mobile substitute for "right-click to pick a color."
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "Quick Tap vs Hold (DRAW mode)" + "Double-Click Toggle" sections.
**Test:** On mobile, quick-tap a cell — paints. Hold for >212ms — wheel opens.

### R7: Touchend handler MUST guard against instant close (< 600ms since open)

`wheelOpenTimeRef` records the timestamp when the wheel opened. The global `touchend` handler ignores events fired less than 600ms after open — otherwise the opening tap's own touchend would immediately close the wheel.

**Why:** Without the guard, the wheel opens and instantly closes on the same gesture. The 600ms threshold is empirical — long enough to cover the opening sequence, short enough that user-initiated dismissal feels responsive.
**Evidence:** `md/MOBILE_WHEEL_TOUCH.md` "touchend" item 1.
**Test:** Hold a cell — confirm the wheel opens AND stays open until the user moves or lifts deliberately.

## Notes

This spec is tightly coupled with [[spec/scrollbar-system]] — three of the scroll-blocking mechanisms enumerated there are consumed here (portrait grid `overflow: hidden`, module-level scroll lock, ScrollBarView handler guards). Plus a fourth `document.addEventListener('wheel', blockWheel)` to catch remaining wheel events on the page.

The PixelEditor component itself is owned by the room-editor cluster; this spec governs the touch interaction patterns used inside it, which are reusable elsewhere (any color picker, any modal overlay that needs portrait-aware touch).
