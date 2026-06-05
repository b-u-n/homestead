---
schema_version: 2
id: pattern/depth-overlay-modal
type: pattern
title: Depth-Based Overlay Modal Stacking
status: stable
last_audited: 2026-05-22
tags: [navigation, ui-pattern]
source_doc:
  - doc/drops
references:
  - spec/flow-engine
---

## Pattern

Drops within one flow declare a `depth` (default `0`). Drops at the same depth swap content within one modal — the modal stays open, the body changes. Drops at a higher depth open a new modal **on top**, with the base modal still visible underneath. Closing the higher overlay returns control to the base.

```javascript
'flow:list':         { component: ListDrop,         depth: 0, ... },
'flow:respond':      { component: RespondDrop,      depth: 0, ... },
'flow:confirmation': { component: ConfirmationDrop, depth: 1, size: 'medium', showClose: false, ... },
```

Size presets for overlay drops (depth > 0): `small` 350×300, `medium` 450×400, `large` 550×500, or none (full modal size).

## When to use

- A confirmation overlay on top of a list (success toast that requires acknowledgement).
- A picker overlay launched from a detail screen (e.g. tag picker over a profile form).
- Any case where the base context should remain *visible* (not hidden) while the user acts on a focused sub-task.

Not for: a simple sub-step in the same task — use same-depth navigation instead. Not for: cross-flow modals — open a separate `<FlowEngine>` mounted at the app level.

## Notes

Per [[spec/flow-engine]] R6, the back button is history-driven, not depth-driven. A single-drop overlay at depth 1 has no history and shows no back — use `showClose: false` if you want to force the user through a specific action button.

The fullscreen size (`size: 'fullscreen'`) is a special case: removes title bar, fills the screen, drop components must center their own content. See `md/DROPS.md` "Fullscreen Mode".
