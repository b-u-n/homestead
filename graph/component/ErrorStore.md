---
schema_version: 2
id: component/ErrorStore
type: component
title: ErrorStore
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/stores/ErrorStore.js
source_doc:
  - doc/errors
follows:
  - pattern/error-store-broadcast
---

## Purpose

MobX store that owns the global error queue. `addError(message, { blocking, duration })` pushes an error; `removeError(id)` and `dismissAll()` clear them. Derived properties (`hasErrors`, `hasBlockingError`, `errorCount`, `blockingErrors`, `nonBlockingErrors`) drive what `ErrorContainer` renders.

## Notes

Single source of error state app-wide. Every WebSocket call site routes failures here (see [[spec/error-handling]] R5). The store does NOT decide blocking — it honors the flag from the producer (R2). Auto-dismiss timing (5.4s for non-blocking, 0 for blocking) is enforced at add time via the `duration` option.
