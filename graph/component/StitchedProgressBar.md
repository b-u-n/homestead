---
schema_version: 2
id: component/StitchedProgressBar
type: component
title: StitchedProgressBar
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/workbook/StitchedProgressBar.js
belongs_to:
  - concept/activity-system
source_doc:
  - doc/activities
---

## Purpose

The textured segmented progress bar shown at the top of every activity step — one stitched cell per step, filled cells use scrollbar blue, unfilled are transparent. First and last segments have rounded corners. Used by [[component/WorkbookActivity]] to indicate `(currentStepIndex + 1) / totalSteps`.

## Notes

Small, single-purpose component. The styling rules (scrollbar blue, stitched border) live in `md/ACTIVITIES.md` "Consistency Notes" and depend on tokens owned by the design-tokens cluster.
