---
schema_version: 2
id: spec/flow-engine
type: spec
title: Flow Engine
status: stable
last_audited: 2026-05-22
tags: [navigation, ui-pattern]
source_doc:
  - doc/flows
  - doc/drops
governs:
  - component/FlowEngine.frontend
  - component/FlowEngine.backend
  - component/Modal
references:
  - pattern/drop-composition
  - pattern/deep-link-mid-flow
  - pattern/depth-overlay-modal
---

## Rules

### R1: Drops MUST be namespaced as `flowName:dropId`

Every drop ID has the shape `<flowName>:<slug>` (e.g. `weepingWillow:viewPost`). The flow's `name`, `startAt`, and every entry in `drops` and every `goto` MUST share that namespace. Cross-flow `goto` is not supported.

**Why:** Single global drop-ID space without collisions; navigation is dispatchable to a single flow's drop table.
**Evidence:** `md/FLOWS.md` "Flow Definition Structure"; `md/DROPS.md` "Drop Definition".
**Test:** Manual — load any flow file under `/frontend/flows/`; every drop ID is prefixed with the flow's `name`.

### R2: Drop components receive a fixed prop contract

Every drop component receives `{ input, context, updateContext, accumulatedData, onComplete, onBack, canGoBack, flowName, dropId }`. Drops MUST call `onComplete(outputData)` to advance and MAY call `onBack()` only when `canGoBack` is true.

**Why:** Drops are interchangeable across flows because they read a fixed API. The Flow Engine is what wires navigation; the drop is what renders.
**Evidence:** `md/FLOWS.md` "Drop Component Props" table; `md/DROPS.md` "Drop Component Props".
**Test:** Manual — `grep` any drop component for `onComplete` and the prop signature.

### R3: Navigation rules are an ordered `next: [...]` array; first match wins

Each drop's `next` is an array of `{ when, goto }` rules evaluated in order. `when` is either a function `(output, accumulatedData, context) => boolean` or the literal `true` (fallback). `goto` is either a drop ID (same namespace) or `null` (close the flow).

**Why:** Declarative routing keeps the state machine inspectable. First-match ordering means the fallback rule goes last.
**Evidence:** `md/FLOWS.md` "Navigation Rules"; `md/DROPS.md` "Navigation Rules".
**Test:** Manual — any `goto: null` rule at the top of `next` masks every rule below it.

### R4: Deep linking uses `startAt` + `initialParams`

To inject a user into the middle of a flow (e.g. notification deep link), pass `startAt` (drop ID) and `initialParams` (object) to `<FlowEngine>`. The params land in both `input` and `context` for the starting drop. Deep-linkable drops MUST handle missing params gracefully.

**Why:** Notifications, push deep links, and resume-from-history all require entering mid-flow without replaying earlier drops.
**Evidence:** `md/FLOWS.md` "Deep Linking (Injecting Users Mid-Flow)"; `frontend/components/FlowEngine.js`.
**Test:** Manual — open any notification linked to a workbook activity; the flow opens at the linked drop.

### R5: Backend handlers register inside the flow namespace and validate input

A backend flow exports `{ name, handlers: { '<flow>:<verb>': { validate, handler, formatOutput? } } }`. The handler context is `{ socket, io, flowName, eventName, user }`. `validate(data)` returns `{ valid, error? }` and runs before `handler`.

**Why:** WebSocket event names mirror the flow namespace — discoverable, no global registry. Input validation in `validate` prevents handlers from defensive-coding the same checks.
**Evidence:** `md/FLOWS.md` "Backend Flow Architecture"; `backend/src/utils/FlowEngine.js`; `backend/src/flows/workbook.js`.
**Test:** Manual — emit an event missing a required field; validator rejects with the documented error.

### R6: Depth determines modal stacking; back is history-driven, not depth-driven

Drops at the same depth swap content within one modal; drops at higher depth open a new overlay on top. The back button is shown iff `canGoBack` (history at this depth has more than one entry) — depth alone does NOT show back.

**Why:** A confirmation overlay at depth 1 with one drop has no history; back is meaningless. Conflating depth with back availability was the original bug this rule documents the fix for.
**Evidence:** `md/DROPS.md` "Depth System" and "Back Button" sections.
**Test:** Manual — open a single-drop overlay; back button is absent.

## Notes

The Flow Engine pairs with [[spec/workbook-system]] (workbook flows are one consumer) and is referenced by every feature that uses modal-based multi-step UI. Drop-side rules are covered here; per-drop styling and centering live in `md/DROPS.md`.

`governs` includes [[component/Modal]] (owned by another cluster) because the Flow Engine's depth and size semantics are implemented in Modal — leave the edge for reconciliation.
