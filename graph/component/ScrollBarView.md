---
schema_version: 2
id: component/ScrollBarView
type: component
title: ScrollBarView
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/ScrollBarView.js
belongs_to:
  - concept/vaporwave-aesthetic
uses:
  - component/Scrollbar
source_doc:
  - doc/scrollbar
  - doc/mobile-wheel-touch
---

## Purpose

Drop-in replacement for ScrollView that bundles a MinkyPanel-styled `Scrollbar`, dimension tracking (`onLayout` + `onContentSizeChange` + `onScroll`), wheel handling on the container div, and the full `scrollEnabled` gate (touch handlers + wheel handler + ref-guarded scrollbar callback). The default scrollable container for app surfaces.

## Notes

Honors the module-level scroll lock via `ScrollLockContext` — but only through `component/Scroll`, which wraps ScrollBarView and subscribes to the lock. Direct use of ScrollBarView does NOT auto-subscribe; pass `scrollEnabled` explicitly from caller state if global lock isn't relevant.

`scrollEnabledRef` synced every render to avoid stale closures in `addEventListener` callbacks — see [[spec/scrollbar-system]] R6.
