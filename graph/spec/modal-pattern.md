---
schema_version: 2
id: spec/modal-pattern
type: spec
title: Modal Pattern
status: drifting
last_audited: 2026-05-22
tags: [ui-pattern, modal]
source_doc:
  - doc/claude
  - doc/menus
governs:
  - component/Modal
  - component/HamburgerMenu
  - component/NotificationHeart
references:
  - spec/design-tokens
  - token/color-primary-text
---

## Rules

### R1: All modal-style surfaces MUST use the standard `Modal` component

Any modal (full-screen overlay with backdrop, title bar, X close button) renders through `frontend/components/Modal.js`. Drop content, settings modals, and flow steps mount inside it as children — they do NOT roll their own modal shell.

**Why:** Modal owns the scroll reset behavior, the open/close sound effects, the back-button stack, the platform-specific backdrop handling, and the vaporwave shell styling. Reimplementing any of these per surface produces inconsistent behavior and visual drift.
**Evidence:** `CLAUDE.md` lines 54–88 declare Modal as the standard.
**Test:** Grep for ad-hoc `position: absolute` full-screen overlay components — any non-Modal full-screen overlay is a violation.

### R2: Modal MUST close on backdrop click (web) or backdrop press (native)

Web uses a raw `<div>` overlay (not `<Pressable>` — see R6). Native uses a `<Pressable>` with `StyleSheet.absoluteFill` behind the content. Both call `onClose` when the user clicks/presses outside the content area.

**Why:** Predictable dismiss is the contract every modal user expects. Mixing backdrop-click and X-only modals across surfaces breaks user mental model.
**Evidence:** `CLAUDE.md` Modal Pattern features list.
**Test:** Open any modal, click the dark backdrop area, confirm `onClose` fires.

### R3: Open/close sound effects MUST be played by Modal, not by call sites

`Modal` calls `SoundManager.play('openActivity')` on first visible and `SoundManager.play('closeActivity')` on dismiss. Optional `additionalOpenSound` prop lets a caller layer a secondary sound; `playSound={false}` opts out entirely.

**Why:** Centralizing the sound contract in Modal prevents call sites from forgetting it or double-playing it. The opt-out flag handles the rare nested-modal case.
**Evidence:** `frontend/components/Modal.js` lines 44–58 (`useEffect` on `visible`).
**Test:** Open and close any modal — confirm the two-step sound plays exactly once each.

### R4: Dropdown menus (HamburgerMenu, NotificationHeart) are NOT Modal — they follow a separate dropdown contract

Menus are anchored positionally (`position: absolute`, `top: 55`, `right: 0`), close on outside click, and layer the same texture/overlay/stitched-border shell — but they do NOT use `component/Modal`. The shared layering shell IS the contract; the implementation is per-component.

**Why:** Modals are full-screen and own focus/sound/back-stack; dropdowns are local UI affordances that don't. Conflating them was the original sin that produced two separate "modal patterns" in the codebase.
**Evidence:** `md/MENUS.md` "Shared Architecture" section — defines the dropdown shell separately from `CLAUDE.md`'s Modal contract.
**Test:** Open `HamburgerMenu` — confirm it does NOT take over the full screen and does NOT have a backdrop on web.

### R5: Outside-click dismissal MUST be platform-split

Web: global `document.addEventListener('click', handleClickOutside)` with a `setTimeout(_, 0)` delay so the opening click doesn't immediately re-close. Native: render a fixed `<Pressable style={styles.backdrop}>` behind the dropdown.

**Why:** Fixed-position backdrops on web don't capture clicks reliably due to canvas stacking contexts (see `md/MENUS.md` line 99). Native doesn't expose a global click listener in the same way.
**Evidence:** `md/MENUS.md` "Close-on-Outside-Click" section.
**Test:** On web, click outside an open `HamburgerMenu` — it closes. On native iOS/Android, tap outside — it closes via the backdrop.

### R6: Modal overlays on web MUST use a raw `<div>`, not `<Pressable>`

React Native Web's `<Pressable>` calls `preventDefault()` on pointer events, which blocks focus inside the modal. Use a raw `<div>` with an `onClick` handler for the web backdrop.

**Why:** Text inputs inside modals lose focus when the modal mounts if the overlay is a `<Pressable>`. The fix is documented but easy to regress on.
**Evidence:** `md/TEXTBOX.md` "Modal overlay" section.
**Test:** Open a modal with a text input as the first focused child — confirm it receives focus and accepts typing immediately.

## Notes

`status: drifting` because MENUS.md describes a *different* full visual shell than CLAUDE.md's Modal — both call themselves "modal-style" but the dropdowns are not Modal. See [[drift/menus-vs-modal-pattern-divergence]] for the resolution.

The Modal scroll-reset behavior (walking every descendant on `scrollResetKey` change) is implementation detail — not a load-bearing rule, but documented in `frontend/components/Modal.js` lines 21–43 in case a future maintainer wonders why every modal scroll resets to top when the drop changes.
