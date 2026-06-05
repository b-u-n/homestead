---
schema_version: 2
id: drift/hearts-transaction-response-incomplete
type: drift
title: Heart-mutating handlers omit updated balance in response
status: open
last_audited: 2026-05-22
cause: unimplemented
auto_accept_after: 90
drifts_from:
  - spec/heart-balance-and-spending
affects:
  - component/HeartPaymentModal
source_doc:
  - doc/hearts
---

## Symptom

`weepingWillow:posts:create` (backend/src/flows/weepingWillow.js:125–129) returns:

```js
return { success: true, message: '...', data: post };  // hearts, heartBank missing
```

`weepingWillow:posts:addResponse` (lines 209–218) returns `{ post, heartsAwarded }` without the new `hearts` and `heartBank` values for the responder.

The consequence: even when the frontend correctly updates `ProfileStore` from the response (which it currently does NOT — see `drift/hearts-success-check-pattern-mismatch`), there is no balance value to set. The UI stays stale until a manual page refresh forces a fresh `user:get`.

This violates `spec/heart-balance-and-spending` R3 ("every handler that mutates hearts MUST return `{ hearts, heartBank }`").

## Resolution

Patch both handlers to include the new balances:

```js
// weepingWillow:posts:create
return { success: true, message: '...', data: { post, hearts: account.hearts, heartBank: account.heartBank } };

// weepingWillow:posts:addResponse
return { success: true, message: '...', data: { post, heartsAwarded, hearts: responder.hearts, heartBank: responder.heartBank } };
```

Audit any future heart-mutating handlers (e.g., shop purchases via hearts) at PR time.

## Audit log

| Date       | Agent                  | Note                                                                 |
|------------|------------------------|----------------------------------------------------------------------|
| 2026-05-22 | claude (user-currency) | Drift recorded from md/HEARTS.md Issue 1.                            |
