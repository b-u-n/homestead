---
schema_version: 2
id: component/Modal
type: component
title: Modal
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/Modal.js
belongs_to:
  - concept/vaporwave-aesthetic
follows:
  - pattern/modal-overlay-with-sound
uses:
  - component/StitchedBorder
  - component/Scroll
source_doc:
  - doc/claude
  - doc/textbox
---

## Purpose

The standard full-screen modal shell for the app. Owns visibility, backdrop dismissal, X/back close affordances, open/close sound effects, title bar, scroll reset on content change, and the platform-split web/native overlay rendering. Drop content, settings modals, and flow steps all mount as `children` inside this component.

## Notes

The `scrollResetKey` prop is the hook for flow-engine drops: when the drop ID changes, FlowEngine passes a new key and Modal walks every descendant scroll container resetting `scrollTop` to 0. This avoids the "I scrolled in the previous drop, now I'm halfway down the next drop" UX bug.

Web backdrop uses a raw `<div>` (not `<Pressable>`) to avoid `preventDefault()` blocking focus on inputs — see [[spec/modal-pattern]] R6 and [[spec/textbox-autoexpand]] R1.

Props documented in source. The full list as of audit: `visible, onClose, onBack, canGoBack, title, children, modalSize, playSound = true, additionalOpenSound, showClose = true, zIndex = 2000, size, backLabel, onCustomBack, scrollResetKey`.
