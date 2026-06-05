---
schema_version: 2
id: spec/activity-v1-legacy
type: spec
title: Activity v1 (Legacy Inline-Step Schema)
status: deprecated
last_audited: 2026-05-22
tags: [activities, legacy]
source_doc:
  - doc/activities
  - doc/workbooks
governs:
  - component/WorkbookActivity
---

## Rules

### R1: Activity has top-level metadata + `steps[]` of typed steps

Each activity is a MongoDB document with `id`, `name`/`title`, `emoji`, `tags` (`conditions`, `themes`, `experience_level`, `difficulty`), and an ordered `steps` array. Each step has `stepId`, `type`, `prompt`, and type-specific properties.

**Why:** The shape predates the v2 primitive-composition system. Existing v1 activities still run on this contract until migrated.
**Evidence:** `md/ACTIVITIES.md` "Activity JSON Schema" section; `md/WORKBOOKS.md` `WorkbookActivity` model.
**Test:** Manual — load any unmigrated v1 activity in the running app; the inline renderer in `frontend/components/drops/WorkbookActivity.js` handles it.

### R2: Step `type` is one of the 13 documented types

Inline (rendered directly by `WorkbookActivity.js`): `text`, `checkbox`, `slider`, `multiselect`. Component-rendered (delegated to `frontend/components/workbook/*.js`): `psychoeducation`, `rating`, `likert`, `guided-exercise`, `prompt-sequence`, `journal`, `likert-reflection`, `checklist-assessment`, `assessment-results`, `sortable-list`, `action-plan` (14 total in practice).

**Why:** The fixed enum is what makes the renderer dispatchable. Adding a new type requires a renderer file + an enum update.
**Evidence:** `md/ACTIVITIES.md` "Step Type Reference" + "Step Types" table in `md/WORKBOOKS.md`.
**Test:** Manual — see [[drift/workbook-step-type-enum-mismatch]] for the contradiction between the Mongoose enum and the documented type list.

### R3: Tag-based bookshelf membership

Activities surface in a bookshelf if any of `tags.conditions` intersects the bookshelf's `tagFilters.conditions`. Conditions are canonical slugs (`generalized-anxiety`, `depression`, etc.). One activity can appear in multiple bookshelves.

**Why:** Decouples authoring (tags) from placement (shelves). New shelves can be added by updating `tagFilters` without re-tagging activities.
**Evidence:** `md/ACTIVITIES.md` "Tag-to-Bookshelf Mapping"; `md/WORKBOOKS.md` "Tag-Based Bookshelf Membership".
**Test:** Manual — verify a multi-tagged activity appears in every matching shelf.

## Notes

`status: deprecated` — new activities ship as v2 (`activities/v2/*.json`, governed by [[spec/activity-v2]]). This spec exists so the v1 coexistence is first-class graph data and so the v2 spec's `supersedes` edge has a valid target.

See [[drift/activity-v1-v2-coexistence]] for the open drift describing the migration debt.
