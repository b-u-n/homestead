---
schema_version: 2
id: component/WorkbookActivity
type: component
title: WorkbookActivity
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/WorkbookActivity.js
belongs_to:
  - concept/activity-system
follows:
  - pattern/primitive-composition
uses:
  - component/MinkyPanel
  - component/WoolButton
  - component/StitchedProgressBar
  - component/JournalStep
source_doc:
  - doc/activities
  - doc/workbooks
  - doc/activities-v2-schema
---

## Purpose

The multi-step activity renderer. Loads a `WorkbookActivity` document (v1 or v2), instantiates the per-step primitives (v2) or inline step type (v1), wires each bound input to `workbook:state:save`, and handles Previous/Next navigation plus the save→saved terminal transition that fires `workbook:activity:complete`. Mounts at depth 1 over the [[component/WorkbookLanding]].

## Notes

This is the single renderer that handles both v1 (inline-step schema, [[spec/activity-v1-legacy]]) and v2 (primitive composition, [[spec/activity-v2]]). The dispatcher branches on the step shape: presence of `components: []` → v2; presence of `type: ...` → v1.

For v2, the renderer also implements the author-invisible behavior described in [[spec/activity-v2]] R6 (pre_mood/post_mood lifted above the panel) and R2 (terminal step suppresses nav buttons).

`component/WoolButton` and `component/MinkyPanel` are owned by other clusters.
