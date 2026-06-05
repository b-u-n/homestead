---
schema_version: 2
id: component/Scroll
type: component
title: Scroll
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/Scroll.js
belongs_to:
  - concept/vaporwave-aesthetic
uses:
  - component/ScrollBarView
source_doc:
  - doc/scrollbar
---

## Purpose

Thin wrapper around `ScrollBarView` that subscribes to the module-level `ScrollLockContext` and forwards the current `scrollEnabled` value as a prop. Use `Scroll` when you want the surface to participate in the global scroll lock (e.g. inside Modal); use `ScrollBarView` directly when you do not.

## Notes

The pub/sub link is one-way: `setScrollEnabled(false)` from anywhere → `Scroll` subscriber → state update → `<ScrollBarView scrollEnabled={false}>`. ScrollBarView then propagates to its internal ref and disables every scroll mechanism (see [[spec/scrollbar-system]] R4).
