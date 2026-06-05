---
schema_version: 2
id: spec/activity-v2
type: spec
title: Activity v2 (Primitive Composition)
status: stable
last_audited: 2026-05-22
tags: [activities, workbooks]
source_doc:
  - doc/activities-v2-schema
  - doc/activities
  - doc/workbooks
governs_glob:
  - activities/v2/*.json
governs:
  - component/WorkbookActivity
  - component/JournalStep
supersedes:
  - spec/activity-v1-legacy
tested_by:
  - activities/v2/_migrate-r6-r2.js
  - activities/v2/_migrate-r5-carryforward.js
---

## Rules

### R1: Closing reflection MUST use `JournalStep` with timer + word count

The reflection journal in the `save` step MUST use `ref: "JournalStep"` with `timerMinutes` set and `showWordCount: true`. No bare `FreeTextMultilineArea` for the closing reflection — the timer and word count are part of the therapeutic mechanic (slowing down, rewarding depth).

**Why:** Inherited verbatim from `activities/v2/_SCHEMA.md` R1. Models the gold-standard rule-numbering pattern this graph spec follows.
**Evidence:** `activities/v2/_SCHEMA.md` R1; `activities/v2/relapse-prevention-plan.json` save step.
**Test:** `node activities/v2/_migrate-r6-r2.js` flags any activity whose save step is missing a `JournalStep` with `timerMinutes` and `showWordCount: true`.

### R2: Every activity ends with TWO steps — `save` (capture) + `saved` (terminal)

The `save` step contains, in order, `QuickMoodMicroWidget` (`post_mood`) + `ReflectionFraming` + `JournalStep` (`journal`). The `saved` step has `terminal: true`, `carryAll: false`, and a single `SummaryOutputCard` with `kind: "post-session-retrospective"`.

**Why:** Inherited verbatim from `activities/v2/_SCHEMA.md` R2. The renderer relies on the terminal-step flag to suppress nav buttons; the save→saved transition is where `workbook:activity:complete` fires.
**Evidence:** `activities/v2/_SCHEMA.md` R2; renderer at `frontend/components/drops/WorkbookActivity.js`.
**Test:** `node activities/v2/_migrate-r6-r2.js` adds/repairs the save+saved pair when missing.

### R3: Every completed activity is auto-saved as a `HistoryEntry`

When `workbook:activity:complete` fires on the save→saved transition, the backend writes a `HistoryEntry` to the diary surface. The diary card surfaces the `pre_mood → post_mood` delta and the first ~140 chars of the `journal` text as the Reflection line — so every activity MUST include `bind: "pre_mood"`, `bind: "post_mood"`, and `bind: "journal"` (conventional keys; the auto-write logic greps for them).

**Why:** Inherited verbatim from `activities/v2/_SCHEMA.md` R3. Activity instances are the source for diary history; the rule guarantees diary cards render with mood + reflection.
**Evidence:** `activities/v2/_SCHEMA.md` R3; backend handler `workbook:activity:complete` in `backend/src/flows/workbook.js`.
**Test:** Manual — complete an activity, look in diary, confirm mood + reflection summary.

### R4: Every state change persists; no "Save" button anywhere

Every input change in every step writes the full `stepData` snapshot + `currentStepIndex` to the active `WorkbookProgress` instance via `workbook:state:save` (text debounced ~500ms; nav immediate). Each Start of an activity creates a new `WorkbookProgress` instance.

**Why:** Inherited verbatim from `activities/v2/_SCHEMA.md` R4. Removes the "did I save?" cognitive load and makes closing the modal mid-step non-destructive.
**Evidence:** `activities/v2/_SCHEMA.md` R4; `workbook:state:save` handler in `backend/src/flows/workbook.js`.
**Test:** Open an activity, type into a JournalStep, close the modal, reopen — text persists.

### R5: Carry forward every prior bound field as authored components

Every step after the first MUST begin with explicit `carryFrom` blocks for every bound field captured in earlier steps (excluding `pre_mood`, `post_mood`, `journal`). Carry-over is an authoring discipline — the renderer just renders what's written.

**Why:** Inherited verbatim from `activities/v2/_SCHEMA.md` R5. Visible-in-JSON carry-over is auditable and self-documenting; automatic carry-over hides context behind renderer behavior.
**Evidence:** `activities/v2/_SCHEMA.md` R5; `activities/v2/_migrate-r5-carryforward.js`.
**Test:** `node activities/v2/_migrate-r5-carryforward.js` reports any step missing required carry blocks for prior bound fields.

### R6: Mood check-in MUST bookend every activity (pre_mood + post_mood)

The first step MUST include a `QuickMoodMicroWidget` with `bind: "pre_mood"`. The `save` step MUST include one with `bind: "post_mood"`. Both are required for the diary HistoryEntry's mood-delta render (R3).

**Why:** Inherited verbatim from `activities/v2/_SCHEMA.md` R6. The pre/post bookend is the unit of "did this activity move the user".
**Evidence:** `activities/v2/_SCHEMA.md` R6; `activities/v2/body-scan.json` (canonical reference).
**Test:** `node activities/v2/_migrate-r6-r2.js` flags activities missing either bind.

## Notes

This spec lifts the load-bearing rules from `activities/v2/_SCHEMA.md` into the graph so other nodes can `reference` them by ID. The full primitive catalog, layout shapes, copy-paste skeleton, and tone guidance stay in `activities/v2/_SCHEMA.md` per R6 — do not duplicate that prose here.

`governs_glob: [activities/v2/*.json]` lets this single spec govern all 80+ activity JSON files without per-file component nodes.

This spec `supersedes` [[spec/activity-v1-legacy]], the deprecated inline-step schema documented in `md/ACTIVITIES.md` ("Step Type Reference" section).
