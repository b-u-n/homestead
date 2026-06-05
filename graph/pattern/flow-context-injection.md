---
schema_version: 2
id: pattern/flow-context-injection
type: pattern
title: Flow Context Injection
status: stable
last_audited: 2026-05-22
tags: [navigation, context, flow-engine]
source_doc:
  - doc/flows
  - doc/drops
  - doc/claude
references:
  - spec/flow-engine
  - pattern/drop-composition
---

## Pattern

A `FlowEngine` instance maintains three separate data planes for each running flow, each with different lifetime and visibility:

1. **`input`** — per-drop. The output of the previous drop becomes the next drop's `input`.
2. **`accumulatedData`** — flow-wide append. Every drop's output is merged in. Available to every subsequent drop and every routing `when(output, accumulated, context)` check.
3. **`context`** — flow-wide shared mutable. Seeded from `initialContext` prop; drops mutate via `updateContext(partial)`. Always includes `flowName` (auto-injected by the engine).

```js
const MyDrop = ({ input, context, updateContext, accumulatedData, onComplete }) => {
  // input  = previous drop's output
  // accumulatedData = merged outputs from every prior drop in this flow run
  // context = flow-wide shared state, mutable via updateContext

  const handleNext = () => {
    updateContext({ chosenColor: 'pink' });
    onComplete({ action: 'continue', value: 42 });
  };
};
```

Additionally, every drop is rendered inside a `<FlowContext.Provider value={{ flowName, dropId }}>` so deeper-nested components (not direct drop children) can read those identifiers via `useContext(FlowContext)` without prop drilling.

## When to use

- Multi-step flows where step N+1 needs data from step N (`input` / `accumulatedData`).
- Flows with cross-cutting state every drop needs to read or write (`context`) — e.g. the currently-being-edited post, the active activity instance.
- Components nested deep under a drop that need to know which flow/drop they're inside (`FlowContext` consumer).

Do NOT use context for state that lives outside the flow run — that belongs in a MobX store ([[pattern/mobx-store]]).

## Notes

The three planes are deliberately distinct: `input` is one-step memory, `accumulatedData` is full-flow memory, `context` is mutable shared. Conflating them (e.g. mutating `accumulatedData` from a drop) breaks the routing predicates that read it as a snapshot. See [[spec/flow-engine]] R2 for the drop prop contract.

Deep linking (R4 of [[spec/flow-engine]]) injects `initialParams` into BOTH `accumulatedData` and `context` so a drop entered mid-flow has the same data shape as one reached by normal navigation.
