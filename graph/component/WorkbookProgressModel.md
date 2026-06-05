---
schema_version: 2
id: component/WorkbookProgressModel
type: component
title: WorkbookProgress (Mongoose Model)
status: stable
last_audited: 2026-05-22
surface: backend
file: /backend/src/models/WorkbookProgress.js
belongs_to:
  - concept/activity-system
source_doc:
  - doc/workbooks
  - doc/activities-v2-schema
---

## Purpose

The Mongoose model for per-user per-activity-attempt progress. Stores `accountId`, `workbookId`, `activityId`, `completedSteps: [stepId]`, `stepData: Map<stepId, Mixed>`, `status: 'in-progress' | 'completed'`, and `lastAccessedAt`. Each Start of an activity inserts a new document (R3 of [[spec/workbook-system]]); each input change updates `stepData` and `currentStepIndex` via the `workbook:state:save` handler.

## Notes

Unique compound index on `{ accountId, workbookId, activityId }` documented in `md/WORKBOOKS.md` is in tension with R3 of [[spec/workbook-system]] — if multiple instances per user-activity are allowed (per `activities/v2/_SCHEMA.md` "Persistence concept"), the index needs to include an attempt discriminator. Candidate Phase-2 drift node; not yet recorded.

Governed by [[spec/workbook-system]].
