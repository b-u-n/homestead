---
schema_version: 2
id: component/Workbook
type: component
title: Workbook
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/Workbook.js
belongs_to:
  - concept/activity-system
uses:
  - component/FlowEngine.frontend
  - component/WorkbookLanding
  - component/WorkbookActivity
source_doc:
  - doc/workbooks
---

## Purpose

The top-level workbook surface — a thin wrapper that mounts `<FlowEngine>` with the workbook flow definition. Receives a `bookshelfId`, opens the workbook landing, and routes the user into per-activity flows. One Workbook instance per opened bookshelf.

## Notes

Governed by [[spec/workbook-system]]. The actual screens live in [[component/WorkbookLanding]] (activity grid) and [[component/WorkbookActivity]] (step navigator). The Workbook component itself is intentionally small — it's the integration point between the surface and the Flow Engine.
