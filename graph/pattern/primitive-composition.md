---
schema_version: 2
id: pattern/primitive-composition
type: pattern
title: Primitive Composition (Activity v2 Steps)
status: stable
last_audited: 2026-05-22
tags: [activities, workbooks]
source_doc:
  - doc/activities-v2-schema
  - doc/activities
references:
  - spec/activity-v2
---

## Pattern

A v2 activity step is an ordered `components: [...]` array. Each entry is `{ ref, bind?, props?, interactable?, carryFrom? }` where `ref` names a primitive from `frontend/components/primitives/_index.js` (`StaticTextContentBlock`, `FreeTextMultilineArea`, `QuickMoodMicroWidget`, `JournalStep`, etc.). The renderer (`WorkbookActivity.js`) walks the array and instantiates each primitive with its `props`.

```json
{
  "stepId": "rate-anxiety",
  "layout": "vertical",
  "collect": "merge",
  "components": [
    { "ref": "StaticTextContentBlock", "props": { "blockRole": "rich-text-prose", "text": "Take a moment…" } },
    { "ref": "NumericRatingSlider", "bind": "intensity",
      "props": { "scaleMin": 0, "scaleMax": 10, "labelCopy": "Intensity" } }
  ]
}
```

Each step picks a `layout` (`vertical` default, `split-2`, `grid-2x2`, `overlay`) and a `collect` mode (`merge` default, `first`, `array`) that determines how the components' bound values aggregate into `stepData[stepId]`.

Render-only entries omit `bind`. Carry-over entries set `interactable: false` + `carryFrom: { stepId, bind? }`.

## When to use

Every new activity under `/activities/v2/`. The pattern is the activity authoring contract — there is no other way to author a v2 step.

Not for: legacy v1 activities (those still use the inline `type`-based step model — see [[spec/activity-v1-legacy]]).

## Notes

This pattern is the *how* of [[spec/activity-v2]]. The spec defines the rules (R1–R6); this node names the composition shape that those rules constrain. The primitive catalog (≈30 refs) is enumerated in `activities/v2/_SCHEMA.md` and is intentionally NOT duplicated here per R6.

`JournalStep`, `QuickMoodMicroWidget`, and `SummaryOutputCard` get their own component nodes because they're load-bearing for save-step rules (R1, R2, R6 of [[spec/activity-v2]]).
