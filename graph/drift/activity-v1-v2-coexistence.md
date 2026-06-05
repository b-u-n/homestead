---
schema_version: 2
id: drift/activity-v1-v2-coexistence
type: drift
title: Activity v1 deprecated but coexists with v2
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 180
drifts_from:
  - spec/activity-v1-legacy
affects:
  - component/WorkbookActivity
source_doc:
  - doc/activities
  - doc/workbooks
  - doc/activities-v2-schema
---

## Symptom

Two activity schemas live in the codebase simultaneously:

- **v1 (legacy):** Inline-step model with `type: 'text' | 'checkbox' | 'slider' | 'multiselect' | 'psychoeducation' | 'rating' | 'likert' | 'guided-exercise' | 'prompt-sequence' | 'journal' | 'likert-reflection' | 'checklist-assessment' | 'assessment-results' | 'sortable-list' | 'action-plan'`. Documented top-to-bottom in `md/ACTIVITIES.md`.
- **v2 (current):** Primitive-composition model with `components: [{ ref, bind?, props? }]`. Documented in `activities/v2/_SCHEMA.md` and gated by mandatory rules R1–R6.

`md/ACTIVITIES.md` opens with a callout pointing readers to `activities/v2/_SCHEMA.md` for new activities, but then the bulk of the doc is still the v1 step-type reference. Authors landing on `md/ACTIVITIES.md` for the first time see the v1 catalog and the v2 callout side-by-side, and may pick either pattern.

The single renderer `frontend/components/drops/WorkbookActivity.js` handles both shapes by branching on the step's structure (`components: []` → v2; `type: ...` → v1). The Mongoose model `WorkbookActivity` has fields for both — v2 (`components`, `layout`, `collect`) and v1 (`type`, `prompt`, `items`, `scale`, etc.) — see `backend/src/models/WorkbookActivity.js` lines 55–95.

## Resolution

**Migration path, in order:**

1. Audit `/activities/v2/` and ensure every existing seed file passes `_migrate-r6-r2.js` and `_migrate-r5-carryforward.js`. (Already true at audit date.)
2. Migrate any remaining v1 JSON seeds to v2 primitive composition.
3. Rewrite `md/ACTIVITIES.md` so the v1 Step Type Reference is collapsed into a "Legacy" appendix, with the v2 pattern as the main body — or drop the v1 reference entirely and let `md/ACTIVITIES.md` redirect to `activities/v2/_SCHEMA.md`.
4. Strip the v1 fields from the Mongoose model once no document references them.
5. Mark [[spec/activity-v1-legacy]] `status: deprecated` → `resolved` and remove the `supersedes` edge from [[spec/activity-v2]].

If unresolved by `2026-11-18` (180 days from audit) this drift auto-flips to `accepted` — meaning the v1/v2 coexistence becomes the documented permanent shape and the migration is shelved.

## Audit log

| Date       | Agent                | Note                                                                                    |
|------------|----------------------|-----------------------------------------------------------------------------------------|
| 2026-05-22 | claude (cluster init)| Drift recorded during activities-system cluster bootstrap. Both v1 and v2 still active. |
