---
schema_version: 2
id: spec/workbook-system
type: spec
title: Workbook System
status: stable
last_audited: 2026-05-22
tags: [workbooks, activities, websockets]
source_doc:
  - doc/workbooks
  - doc/activities
governs:
  - component/Workbook
  - component/WorkbookLanding
  - component/WorkbookActivity
  - component/WorkbookProgressModel
references:
  - spec/flow-engine
  - spec/activity-v2
---

## Rules

### R1: Hierarchy is Library Rooms → Bookshelves → Workbooks → Activities → Steps

Four library rooms (Main Lobby, Recovery, Finding Balance, Connection) contain fifteen bookshelves (anxiety, depression, stress, emotions, attachment, boundaries, loneliness, accountability, self, impulses, anger, adhd, burnout, grief, trauma). One bookshelf opens one workbook; one workbook lists many activities; one activity has many steps.

**Why:** Fixed hierarchy is how the surface is navigated and how progress is scoped. Adding a level (e.g. "chapters") would require schema migration; adding a sibling shelf is just a new `Workbook` document.

**Evidence:** `md/WORKBOOKS.md` "System Overview" and "Library Rooms" sections.
**Test:** Manual — open each library room and confirm the bookshelves match the documented mapping.

### R2: Activities surface in a bookshelf via tag intersection

A `WorkbookActivity` appears in a bookshelf iff any of its `tags.conditions` intersects the bookshelf's `tagFilters.conditions`. The same activity can appear on multiple shelves.

**Why:** Decouples authoring (per-activity tags) from placement (per-shelf filters). New shelves don't require re-tagging activities.
**Evidence:** `md/WORKBOOKS.md` "Tag-Based Bookshelf Membership"; `md/ACTIVITIES.md` "Tag-to-Bookshelf Mapping".
**Test:** Manual — verify a multi-tagged activity (e.g. one tagged with both `generalized-anxiety` and `depression`) appears on both shelves.

### R3: Each Start of an activity creates a NEW `WorkbookProgress` instance

Every time a user starts (or resumes via "Start fresh") an activity, a new `WorkbookProgress` document is inserted. A user may have many in-progress and many completed instances of the same activity. The instance `_id` is the unit of "this attempt" everywhere downstream (diary HistoryEntry, resume picker).

**Why:** Distinguishes "I journaled twice this week about anxiety" from "I edited my single anxiety journal twice". Enables a faithful history per attempt.
**Evidence:** `md/WORKBOOKS.md` "Progress System" + `activities/v2/_SCHEMA.md` "Persistence concept".
**Test:** Manual — complete an activity, then start it again from the bookshelf; two separate completion entries appear in the diary.

### R4: Every state change writes to the active instance — no manual save

Every input change writes the full `stepData` snapshot + `currentStepIndex` to the active `WorkbookProgress` via `workbook:state:save` (text debounced ~500ms; non-text and nav immediate). Closing the modal mid-step is non-destructive.

**Why:** Same R4 as [[spec/activity-v2]] R4 — the system-level guarantee that the user's running state IS the database state.
**Evidence:** `activities/v2/_SCHEMA.md` "Persistence concept"; `backend/src/flows/workbook.js` `workbook:state:save` handler.
**Test:** Type into any bound primitive, close the modal, reopen — text persists.

### R5: Completion fires `workbook:activity:complete` and auto-writes a `HistoryEntry`

On the transition INTO the `saved` terminal step, the renderer fires `workbook:activity:complete`. The backend flips the `WorkbookProgress.status` to `'completed'` AND auto-writes a `HistoryEntry` for the diary surface (R3 of [[spec/activity-v2]]).

**Why:** Completion is the single coordinated write that surfaces an attempt to the diary. Tying it to the save→saved transition (not to "next on the last step") means the user can't half-complete.
**Evidence:** `md/WORKBOOKS.md` "WebSocket Events" table; `activities/v2/_SCHEMA.md` R3.
**Test:** Complete any activity; confirm a new card appears in the diary.

### R6: WebSocket events are namespaced `workbook:*`

All workbook events live under the `workbook:` namespace: `workbook:load`, `workbook:activity:load`, `workbook:activity:start`, `workbook:state:save`, `workbook:step:complete`, `workbook:activity:complete`, `workbook:progress:get`, plus broadcasts `workbook:progress:updated` and `workbook:activity:completed`.

**Why:** Per [[spec/flow-engine]] R5, backend handlers register inside the flow namespace. `workbook:*` is the workbook flow's surface.
**Evidence:** `md/WORKBOOKS.md` "WebSocket Events"; `backend/src/flows/workbook.js`.
**Test:** Manual — `grep "workbook:" backend/src/flows/workbook.js` lists every registered handler.

## Notes

This spec governs the workbook surface — its data model, navigation, and persistence. Per-activity authoring rules live in [[spec/activity-v2]]; the flow/modal mechanics live in [[spec/flow-engine]].

`status: stable` is honest for the surface as a whole, but see [[drift/workbook-step-type-enum-mismatch]] for an active drift inside the data model.
