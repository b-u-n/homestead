---
schema_version: 2
id: drift/scroll-blocking-mechanism-count-divergence
type: drift
title: SCROLLBAR.md and MOBILE_WHEEL_TOUCH.md disagree on how many scroll-blocking mechanisms exist
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/scrollbar-system
affects:
  - component/ScrollBarView
source_doc:
  - doc/scrollbar
  - doc/mobile-wheel-touch
---

## Symptom

The two docs enumerate different sets of scroll-blocking mechanisms required when the color wheel is open:

**`md/SCROLLBAR.md`** ("scrollEnabled" prop description) lists FOUR gates:
1. ScrollView `scrollEnabled` prop
2. Custom touch handlers (`handleTouchStart`, `handleTouchMove`) via ref check
3. Scrollbar wheel handler on container div
4. Scrollbar component receives `onScroll={undefined}`

**`md/MOBILE_WHEEL_TOUCH.md`** ("Scroll Blocking" section) lists THREE mechanisms + one global fallback:
1. Portrait grid div `overflow: wheelOverlay ? 'hidden' : 'auto'` inline toggle
2. Module-level scroll lock (`ScrollLockContext`)
3. ScrollBarView handler guards (matches gates 2–4 above, collapsed into one item)
4. Plus a global `document.addEventListener('wheel', blockWheel)` in the mobile touchmove useEffect

So SCROLLBAR.md mentions four ScrollBarView-internal gates but does NOT mention (a) the inline `overflow: hidden` toggle on the portrait grid, (b) the module-level scroll lock as a triggering mechanism, or (c) the global document wheel listener.

MOBILE_WHEEL_TOUCH.md mentions the scroll-lock trigger and the global fallback but glosses over the four-gate internal structure as one bullet.

The two docs are not actually contradictory — they're describing overlapping concerns from different angles. But a reader trying to verify "every scroll path is blocked" by reading EITHER doc will miss mechanisms covered only by the other.

## Resolution

Consolidate the scroll-blocking documentation into a single canonical list, either in `md/SCROLLBAR.md` (since the gates live in ScrollBarView) or in a new `md/SCROLL_BLOCKING.md`. The list should enumerate ALL five mechanisms with their location and their trigger:

1. ScrollView `scrollEnabled` prop — in ScrollBarView, fed from caller
2. Custom touch handlers ref-guarded — in ScrollBarView
3. Container div wheel handler ref-guarded — in ScrollBarView
4. Scrollbar `onScroll={undefined}` — in ScrollBarView, passed to Scrollbar
5. Portrait grid div inline `overflow: hidden` — in PixelEditor, separate from ScrollBarView
6. Module-level `ScrollLockContext` — in `frontend/contexts/ScrollLockContext.js`, subscribed by `Scroll`
7. Global `document.addEventListener('wheel', blockWheel)` — in PixelEditor's mobile touchmove useEffect

The other doc cross-links instead of duplicating. Until this is consolidated, contributors fixing a scroll-leak bug need to read BOTH docs in full.

## Audit log

| Date       | Agent                                | Note                                                                       |
|------------|--------------------------------------|----------------------------------------------------------------------------|
| 2026-05-22 | claude (panel-modal-scroll cluster) | Drift discovered during graph buildout. Both docs are correct; neither is complete. |
