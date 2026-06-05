---
schema_version: 2
id: component/WorkbookLanding
type: component
title: WorkbookLanding
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/WorkbookLanding.js
belongs_to:
  - concept/activity-system
uses:
  - component/MinkyPanel
source_doc:
  - doc/workbooks
  - doc/activities
---

## Purpose

The first drop of the workbook flow — renders the activity list for a bookshelf as a single-column list of `MinkyPanel` rows (emoji + title + stitched-checkbox completion indicator). User taps an activity tile and the flow advances to [[component/WorkbookActivity]] at depth 1.

## Notes

Per `md/ACTIVITIES.md` "Bookshelf Landing", the layout is one panel per row (full width), NOT the older 3-column grid documented elsewhere — see `md/WORKBOOKS.md` for the legacy reference. The stitched-checkbox empty/checked indicator mirrors the `ChecklistAssessmentStep` checkbox primitive.

Governed by [[spec/workbook-system]]. `component/MinkyPanel` is owned by the design-tokens cluster.
