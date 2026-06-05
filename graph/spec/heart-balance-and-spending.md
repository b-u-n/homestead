---
schema_version: 2
id: spec/heart-balance-and-spending
type: spec
title: Heart Balance & Spending
status: drifting
last_audited: 2026-05-22
tags: [currency, hearts]
source_doc:
  - doc/hearts
governs:
  - component/HeartPaymentModal
  - component/Heart
  - component/NotificationHeart
---

## Rules

### R1: Active Heart balance is capped at 9; overflow rolls to the Heart Bank

A user's spendable hearts (`Account.hearts`) is `0–9`. Anything beyond 9 increments `Account.heartBank` (unbounded). The two are separate sources for spending — the user picks Active vs Bank in `HeartPaymentModal`.

**Why:** The 9-cap is the design constraint that powers the 1–9 heart picker UI and prevents Active hearts from devaluing into a meaningless counter.
**Evidence:** `md/HEARTS.md` Overview; `HeartPaymentModal.js` heart selector renders `[1..9]`.
**Test:** Set `Account.hearts = 12` via admin; UI must show 9 and route the surplus to `heartBank`.

### R2: Backend is authoritative for heart balance; frontend `profileStore.hearts` is a cache

The frontend validates user input against `profileStore.hearts` for instant feedback, but the backend re-validates against `account.hearts` before mutating state. Disagreement is resolved server-side.

**Why:** Stale frontend state (e.g. between page loads) must not let a user overspend. The double-check keeps the UX optimistic without trusting it.
**Evidence:** `md/HEARTS.md` Data Flow ("Backend validates against account.hearts (authoritative)").
**Test:** Pause the WebSocket, click a spend; backend rejects with the corrected balance.

### R3: Every handler that mutates hearts MUST return `{ hearts, heartBank }` in its response payload

`weepingWillow:posts:create`, `weepingWillow:posts:addResponse`, and any future heart-mutating handler MUST include the new `hearts` and `heartBank` values in the response so the frontend can hydrate `ProfileStore` without a separate `user:get` round-trip.

**Why:** Without this, the UI stays stale until the next refresh — the bug that motivated this spec. Round-tripping `user:get` doubles latency.
**Evidence:** `md/HEARTS.md` Issue 1 — backend currently returns only `{ post }` or `{ post, heartsAwarded }`.
**Test:** See `drift/hearts-transaction-response-incomplete`. Resolve by patching the two `weepingWillow` handlers and any later additions.

### R4: After a heart transaction, the frontend MUST update `ProfileStore` from the response

The success branch of every heart-spending or heart-earning emit MUST call `profileStore.setHearts(result.hearts)` and `profileStore.setHeartBank(result.heartBank)` when those fields are present.

**Why:** R3 makes the values available; this rule says use them. The combination is what closes the loop and makes the UI reflect the new balance immediately.
**Evidence:** `md/HEARTS.md` Issue 2.
**Test:** Spend 3 hearts; the on-screen counter decrements without a page refresh.

### R5: `WebSocketService.emit()` resolves with `response.data`, not the full envelope

The wire layer unwraps `response.data` on success and `throw`s on failure. Component code MUST NOT check `if (result.success)` — `success` is implicit if no error was thrown. The result variable IS the data, not the envelope.

**Why:** The legacy `result.success` check is always `undefined` after the unwrap, leading to silent skip of the post-success path (e.g., the ProfileStore update in R4).
**Evidence:** `md/HEARTS.md` Issue 3; `frontend/services/websocket.js` lines 52–67.
**Test:** Audit all heart-related drops — any `if (result.success)` is a bug.

### R6: The 1–9 heart picker MUST visually distinguish available vs unavailable hearts

When a user has fewer than 9 Active hearts, the picker still renders all 9 slots but with reduced opacity for unavailable hearts (`opacity: 0.2`) and disables their press handlers. Selected hearts render at full opacity (`1`); deselected-but-available render at intermediate (`0.4`).

**Why:** Hiding hearts the user doesn't have would make the picker layout shift each transaction. The three-tier opacity scale is the agreed-on cue.
**Evidence:** `HeartPaymentModal.js` heart selector loop.
**Test:** Set `hearts = 4`; picker shows 9 hearts with 5 dimmed and disabled.

## Notes

`status: drifting` is intentional — R3 and R5 are open bugs (see `drift/hearts-transaction-response-incomplete`, `drift/hearts-success-check-pattern-mismatch`). When both drifts resolve, flip to `stable`.

This spec does NOT govern the visual styling of `HeartPaymentModal` — see `drift/heart-payment-modal-bypasses-design-system` for the styling deviation.
