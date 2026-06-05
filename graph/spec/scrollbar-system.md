---
schema_version: 2
id: spec/scrollbar-system
type: spec
title: Scrollbar System
status: stable
last_audited: 2026-05-22
tags: [scroll, ui-pattern]
source_doc:
  - doc/scrollbar
governs:
  - component/Scrollbar
  - component/ScrollBarView
  - component/Scroll
references:
  - spec/design-tokens
---

## Rules

### R1: Use `ScrollBarView` as the default scrollable container — `Scrollbar` is the manual fallback

`ScrollBarView` is the drop-in ScrollView replacement that bundles a MinkyPanel-styled scrollbar with correct dimension tracking. Call sites should reach for it first. The bare `Scrollbar` component is for cases where you need a non-standard ScrollView (e.g. a horizontal list with a separate vertical scrollbar).

**Why:** Manual usage requires wiring four event handlers (`onScroll`, `onLayout`, `onContentSizeChange`, `onScroll` callback) — every consumer that does this by hand is one more place to forget `onLayout` and ship a broken-on-first-render scrollbar.
**Evidence:** `md/SCROLLBAR.md` "ScrollBarView (Recommended)" section.
**Test:** Replace a hand-wired ScrollView+Scrollbar pair with `<ScrollBarView>` — confirm identical behavior with less code.

### R2: Manual `Scrollbar` use MUST wire `onLayout` AND `onContentSizeChange` AND `onScroll`

Without `onLayout`, `visibleHeight` is 0 until first scroll. Without `onContentSizeChange`, `contentHeight` is 0 until first scroll. With either at 0, the scrollbar hides (per R3) and the user has no scroll affordance until they discover it accidentally.

**Why:** This is the failure mode every implementer hits on first attempt. The contract is in the docs but the silent failure makes it easy to miss.
**Evidence:** `md/SCROLLBAR.md` "Important" callout under Manual Usage.
**Test:** Wire a manual Scrollbar without `onLayout` — confirm scrollbar is invisible until first user scroll. Add `onLayout` — confirm it appears immediately.

### R3: Scrollbar MUST auto-hide when content fits the viewport (unless `alwaysShowScrollbar`)

Default behavior: if `contentHeight <= visibleHeight`, scrollbar renders nothing. Override via `alwaysShowScrollbar={true}` only for surfaces where the scrollable region's bounds need to be visually communicated even when empty.

**Why:** A visible-but-non-functional scrollbar is visual noise. The user reads "this scrolls" and tries to scroll, then nothing happens — worse than no scrollbar at all.
**Evidence:** `md/SCROLLBAR.md` "Behavior" section.
**Test:** Render a `ScrollBarView` with short content — confirm no scrollbar. Add `alwaysShowScrollbar` — confirm it appears.

### R4: `scrollEnabled={false}` MUST block ALL scroll mechanisms — touch, wheel, drag, track click

Disabling scroll requires four separate gates:
1. ScrollView's `scrollEnabled` prop (RN gesture)
2. Custom touch handlers (`handleTouchStart`, `handleTouchMove`) guarded by `scrollEnabledRef`
3. Container div's wheel handler guarded by ref
4. Scrollbar receives `onScroll={undefined}`, disabling its drag/wheel/click handlers

**Why:** Disabling only the ScrollView prop leaves three other paths open. The PixelEditor color wheel needs ALL paths blocked or the canvas under the overlay scrolls during a drag.
**Evidence:** `md/SCROLLBAR.md` "scrollEnabled" prop description.
**Test:** Open the PixelEditor color wheel, attempt scroll via every mechanism (touch, wheel, scrollbar drag, scrollbar track click) — none should produce scrolling.

### R5: Global scroll lock uses `ScrollLockContext` module-level pub/sub, NOT React Context

`frontend/contexts/ScrollLockContext.js` exports `setScrollEnabled(bool)` and a subscription mechanism. It is a module-level singleton, not a React Context provider — so any component anywhere in the tree can disable scroll without needing a `<Provider>` wrapper.

**Why:** A React Context would require placement above every `Scroll` instance, which is impossible to guarantee app-wide. Module-level pub/sub works regardless of tree position.
**Evidence:** `md/SCROLLBAR.md` "Global Scroll Lock" + `md/MOBILE_WHEEL_TOUCH.md` "Scroll Blocking" item 2.
**Test:** Import `setScrollEnabled` in any component, call `setScrollEnabled(false)` — every `Scroll`/`ScrollBarView` in the app disables.

### R6: `scrollEnabledRef.current` MUST be synced every render — closures over the ref read latest value

Inside `addEventListener` callbacks added in `useEffect`, the closure captures `scrollEnabled` at effect time. To avoid stale-closure bugs, the handler reads `scrollEnabledRef.current` instead — the ref is reassigned on every render so the read is always current.

**Why:** Without the ref pattern, disabling scroll mid-gesture wouldn't take effect until the next event handler re-registration cycle. The bug manifests as one or two scroll events firing after `setScrollEnabled(false)`.
**Evidence:** `md/SCROLLBAR.md` "How it flows" item 4.
**Test:** Add a wheel event during the few-ms window between `setScrollEnabled(false)` and the next render — confirm it does NOT scroll.

## Notes

The default scrollbar colors (`thumbColor: 'rgba(120, 100, 140, 0.5)'`, `trackColor: 'rgba(0, 0, 0, 0.1)'`) are NOT tokens yet — they should be added when `spec/design-tokens` covers the scrollbar surface. `ScrollBarView` defaults use purple overlays (`rgba(112, 68, 199, 0.2)` track / `0.4` thumb) to read as a MinkyPanel-derivative — see also [[spec/minky-panel]].
