---
schema_version: 2
id: drift/hearts-success-check-pattern-mismatch
type: drift
title: Heart-spending drops check `result.success` after `emit()` unwraps `data`
status: open
last_audited: 2026-05-22
cause: ambiguous_in_spec
auto_accept_after: 90
drifts_from:
  - spec/heart-balance-and-spending
affects:
  - component/HeartPaymentModal
source_doc:
  - doc/hearts
---

## Symptom

`WebSocketService.emit()` (frontend/services/websocket.js:52–67) resolves with `response.data` (not the full envelope) on success, and `throw`s on failure. But heart-related drops (`CreateWeepingWillowPost.js`, `RespondToPost.js`) check `if (result.success)` after the emit, where `result` is the unwrapped data — `success` is `undefined`.

The consequence: the post-success branch (which should call `profileStore.setHearts(result.hearts)`) is silently skipped. Combined with `drift/hearts-transaction-response-incomplete` it means the UI never reflects the new balance until refresh.

This violates `spec/heart-balance-and-spending` R5.

## Resolution

Replace `if (result.success) { ... }` with `try { const result = await WebSocketService.emit(...); /* success */ } catch { /* failure */ }`. Once the success path is reached, `result` IS the data — read `result.hearts` and `result.heartBank` directly.

Cause is `ambiguous_in_spec` because the wire-protocol convention (data-unwrap vs envelope-pass-through) was not previously documented in `md/HEARTS.md`; rather, both shapes were in active use in different drops. The fix is to migrate all drops to the unwrapped convention and document it in the wire-protocol concept.

## Audit log

| Date       | Agent                  | Note                                                                 |
|------------|------------------------|----------------------------------------------------------------------|
| 2026-05-22 | claude (user-currency) | Drift recorded from md/HEARTS.md Issue 3.                            |
