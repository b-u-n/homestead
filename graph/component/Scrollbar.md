---
schema_version: 2
id: component/Scrollbar
type: component
title: Scrollbar
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/Scrollbar.js
belongs_to:
  - concept/vaporwave-aesthetic
source_doc:
  - doc/scrollbar
---

## Purpose

A MinkyPanel-styled scrollbar widget. Renders a track + thumb whose size is inversely proportional to `contentHeight / visibleHeight`. Optionally accepts an `onScroll(offset)` callback for click-track-to-jump; passing `onScroll={undefined}` disables all internal handlers (drag, wheel, track click). Auto-hides when content fits the viewport.

## Notes

Used directly when manual scroll wiring is needed (separate ScrollView + Scrollbar layout, horizontal+vertical pairings). For the common vertical-scrollable container case, prefer [[component/ScrollBarView]] which bundles this with dimension tracking — see [[spec/scrollbar-system]] R1.

Default thumb color `rgba(120, 100, 140, 0.5)` and track color `rgba(0, 0, 0, 0.1)` are not yet tokenized.
