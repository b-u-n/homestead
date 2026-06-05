---
schema_version: 2
id: drift/menus-vs-modal-pattern-divergence
type: drift
title: MENUS.md and CLAUDE.md describe two unreconciled "modal" patterns
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/modal-pattern
affects:
  - component/Modal
  - component/HamburgerMenu
source_doc:
  - doc/claude
  - doc/menus
---

## Symptom

`CLAUDE.md` (lines 54–88) declares one "Modal Pattern": the standard `Modal` component at `frontend/components/Modal.js`. It says "When implementing modals in this application, always use the standard `Modal` component."

`md/MENUS.md` describes the dropdown menu pattern (HamburgerMenu, NotificationHeart) with its own visual shell — same texture + overlay + StitchedBorder layering as MinkyPanel and Modal, same general aesthetic — but does NOT use `component/Modal`. It rolls its own positioning, its own outside-click handling (web global listener vs Modal's web-div-onClick), and its own backdrop-on-native handling.

The two patterns are structurally similar (overlay-on-content, dismiss-on-outside, vaporwave shell) but implementationally separate. Reading CLAUDE.md alone, a contributor would conclude there's exactly one modal pattern and reach for `<Modal>` everywhere. Reading MENUS.md alone, a contributor adding a third dropdown would copy the menu pattern without ever knowing `component/Modal` exists.

A new contributor implementing, say, a popover for the bazaar would have no canonical guidance on which to follow. The two patterns are not labeled distinctly — both are described in their docs as "modal-style."

## Resolution

Add a section to `CLAUDE.md` (or a new `md/MODALS_AND_MENUS.md`) that explicitly distinguishes the two patterns:

1. **Full-screen modal:** Use `component/Modal`. Takes over the viewport, owns sound/back-stack/scroll-reset.
2. **Anchored dropdown:** Roll your own using the [[pattern/close-on-outside-click]] template (web global listener, native backdrop Pressable). Use the same texture/overlay/stitched-border shell.

Then update `md/MENUS.md` to point at the dropdown pattern by name (currently it says "modal" too freely), and update `CLAUDE.md`'s Modal Pattern section to add a "NOT for dropdowns — see MENUS.md" callout.

Alternatively, factor a shared `component/AnchoredDropdownShell` that HamburgerMenu/NotificationHeart/EmoteMenu compose. This would deduplicate the three current implementations and give a single home for the dropdown contract.

## Audit log

| Date       | Agent                  | Note                                                                                |
|------------|------------------------|-------------------------------------------------------------------------------------|
| 2026-05-22 | claude (panel-modal-scroll cluster) | Drift discovered during graph buildout. Both docs label themselves authoritative for the "modal-style" pattern. |
