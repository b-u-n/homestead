---
schema_version: 2
id: drift/workbook-step-type-enum-stale-doc
type: drift
title: WORKBOOKS.md step-type enum is stale vs. WorkbookActivity model
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/workbook-system
affects:
  - component/WorkbookProgressModel
source_doc:
  - doc/workbooks
  - doc/activities
---

## Symptom

`md/WORKBOOKS.md` documents the `WorkbookActivity` Mongoose schema with `step.type` enum `['text', 'checkbox', 'slider', 'multiselect']` (4 values, line ~167). The actual model at `backend/src/models/WorkbookActivity.js` lines 67–73 enum has **15 values**:

```js
enum: [
  'text', 'checkbox', 'slider', 'multiselect',
  'psychoeducation', 'rating', 'likert', 'guided-exercise',
  'prompt-sequence', 'journal', 'checklist-assessment',
  'sortable-list', 'action-plan', 'likert-reflection',
  'assessment-results'
]
```

Meanwhile `md/ACTIVITIES.md` documents 14+ step types and `md/WORKBOOKS.md`'s own "Step Types" table further down (lines ~258–273) lists 14. The schema-block enum at the top of WORKBOOKS.md was simply never updated when component step types were added.

A third source — `activities/v2/_SCHEMA.md` — supersedes both by introducing primitive composition; there step `type` is no longer a discriminator at all.

## Resolution

1. Update the `WorkbookActivity` schema documentation block in `md/WORKBOOKS.md` to either (a) list the full 15-value enum from the model, or (b) call out that v2 activities don't use `type` and link to `activities/v2/_SCHEMA.md`.
2. Or, simpler: drop the inline schema block from `md/WORKBOOKS.md` and link to `backend/src/models/WorkbookActivity.js` as the source of truth.

Low risk — purely a doc-vs-code mismatch. No runtime impact (the model is what runs).

## Audit log

| Date       | Agent                | Note                                                                |
|------------|----------------------|---------------------------------------------------------------------|
| 2026-05-22 | claude (cluster init)| Stale doc enum spotted by spot-checking the model during cluster bootstrap. |
