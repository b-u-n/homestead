---
schema_version: 2
id: component/JournalStep
type: component
title: JournalStep
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/workbook/JournalStep.js
belongs_to:
  - concept/activity-system
source_doc:
  - doc/activities
  - doc/activities-v2-schema
---

## Purpose

The timed-journal primitive. Renders an auto-expanding textarea with an automatic countdown timer (`timerMinutes`), live word count (`showWordCount`), optional minimum-word gating (`minWords`), and an optional "Reread" button after submission (`showReread`). The closing reflection of every v2 activity (R1 of [[spec/activity-v2]]) must use this primitive — bare `FreeTextMultilineArea` is disallowed there.

## Notes

JournalStep is one of the primitives in the v2 catalog (`frontend/components/primitives/_index.js`) AND a load-bearing step type in v1's inline-renderer dispatch. The same component services both schemas.

Governed by [[spec/activity-v2]] (R1 + R2 reference it by ref name).
