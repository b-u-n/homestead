---
schema_version: 2
id: pattern/drop-composition
type: pattern
title: Drop Composition (Declarative Flow Definition)
status: stable
last_audited: 2026-05-22
tags: [navigation, ui-pattern]
source_doc:
  - doc/flows
  - doc/drops
references:
  - spec/flow-engine
---

## Pattern

A multi-step UI is declared as a `{ name, title, startAt, drops }` object. Each entry in `drops` is `{ component, depth?, size?, title?, showClose?, next: [...] }`. `next` rules are evaluated in order on each `onComplete(output)` until one matches; the matched `goto` becomes the new current drop (or closes the flow if `null`).

```javascript
export const myFlow = {
  name: 'myFlow',
  title: 'My Flow',
  startAt: 'myFlow:landing',
  drops: {
    'myFlow:landing': {
      component: LandingDrop,
      next: [
        { when: (o) => o.action === 'continue', goto: 'myFlow:step2' },
        { when: true,                            goto: null }
      ]
    },
    'myFlow:step2': { /* ... */ }
  }
};
```

## When to use

Any multi-step modal interaction: wishing well, workbook activity, settings wizard, profile setup. Especially appropriate when:

- You have 2+ screens that share a logical task.
- You need history-based back navigation.
- You want to deep-link into the middle of the flow ([[pattern/deep-link-mid-flow]]).
- The branching is data-driven, not just linear (use `when` predicates).

Not appropriate for: one-shot confirmation modals (use `Modal` directly), top-level page routing (use the app router).

## Notes

This pattern is the *how* of [[spec/flow-engine]]. The spec defines the contract (R1–R6); this node names the recurring shape. New flows under `/frontend/flows/` MUST follow this composition.

`canGoBack` is history-driven, not depth-driven — see [[spec/flow-engine]] R6.
