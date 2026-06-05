---
schema_version: 2
id: pattern/error-store-broadcast
type: pattern
title: Error Store Broadcast
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/errors
references:
  - spec/error-handling
---

## Pattern

Single global MobX store (`ErrorStore`) owns the error queue. Producers push via `ErrorStore.addError(message, { blocking, duration })`. A single root-mounted observer (`ErrorContainer`) renders the queue, dispatching each entry to either a toast component or a modal component based on its `blocking` flag. Auto-dismiss is scheduled at add time using the duration option (0 = never).

```javascript
// Producer side (any call site)
ErrorStore.addError('Not enough hearts');                       // toast, 5.4s
ErrorStore.addError('Session expired', { blocking: true });     // modal, no auto

// Renderer side (mounted once)
const ErrorContainer = observer(() => (
  <>
    {ErrorStore.nonBlockingErrors.map(e => <ErrorNotification ... />)}
    {ErrorStore.blockingErrors[0] && <BlockingErrorModal ... />}
  </>
));
```

## When to use

For any user-visible failure path. The pattern guarantees: consistent visual treatment, consistent dismiss semantics, observable count for "dismiss all" affordances, and a single chokepoint for sound effects and accessibility announcements.

Do NOT use for: domain-specific inline validation feedback that lives next to a form field (those are local component concerns, not "errors" in this system's sense — though `ErrorStore` is the right channel for "this form-level submit failed").

## Notes

The pattern is canonical for `ErrorStore` specifically and could be generalized (e.g. a future `NoticeStore` for non-error transient messages). Until that exists, do not invent a parallel pattern — extend `ErrorStore` if needed.
