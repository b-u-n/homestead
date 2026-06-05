---
schema_version: 2
id: pattern/deep-link-mid-flow
type: pattern
title: Deep Link Mid-Flow (startAt + initialParams)
status: stable
last_audited: 2026-05-22
tags: [navigation, notifications]
source_doc:
  - doc/flows
references:
  - spec/flow-engine
---

## Pattern

Open a flow at a non-default drop with pre-populated params. Pass `startAt` (drop ID) and `initialParams` (object) to `<FlowEngine>`; the params are stored in `accumulatedData` AND merged into `context`, so the starting drop sees them via `input` or `context`.

```javascript
<FlowEngine
  flowDefinition={weepingWillowFlow}
  visible={true}
  startAt="weepingWillow:viewPost"
  initialParams={{ postId: 'abc123' }}
/>
```

Drop component:

```javascript
const ViewPost = ({ input, context }) => {
  const postId = input?.postId || context?.postId;
  if (!postId) return <ErrorState message="Post not found" />;
  // ...
};
```

## When to use

- Notification deep links (notification `navigation: { flow, dropId, params }` consumed by `NotificationStore`).
- Resume-from-saved-state (e.g. WorkbookProgress resume picker).
- Cross-feature handoff (one feature opens another's flow at a specific drop).

Drops authored to be deep-link targets MUST handle missing params gracefully — render an error or default state rather than crashing.

## Notes

This pattern is anchored by [[spec/flow-engine]] R4. The Notification model stores the `{ flow, dropId, params }` triple; `NotificationStore.consumePendingNavigation()` returns it for the UI to wire into `<FlowEngine>`.
