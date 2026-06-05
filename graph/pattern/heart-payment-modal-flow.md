---
schema_version: 2
id: pattern/heart-payment-modal-flow
type: pattern
title: Heart Payment Modal Flow
status: stable
last_audited: 2026-05-22
tags: [currency, modal, ui-pattern]
source_doc:
  - doc/hearts
references:
  - spec/heart-balance-and-spending
---

## Pattern

A self-contained modal that gathers a heart-spending decision before the caller commits the transaction. The contract:

1. **Inputs (props):** `visible`, `onClose`, `onComplete({ amount, source })`, `paymentInfo: { recipient, purpose }`.
2. **State:** Local `amount` (1–9) and `source` (`'active'` or `'bank'`).
3. **Reactive reads:** `profileStore.hearts` and `profileStore.heartBank` via MobX `observer`.
4. **Validation:** Amount is clamped to `min(9, availableHearts)` for the chosen source; the 1–9 picker dims and disables unavailable slots (three-tier opacity per `spec/heart-balance-and-spending` R6).
5. **Confirm:** Calls `onComplete({ amount, source })`. The CALLER is responsible for the actual WebSocket emit and the post-transaction `ProfileStore` update (R3, R4 of the spec).

## When to use

- Any action that spends user hearts where the user must choose Active vs Bank and an amount (1–9)
- Use as a dedicated modal, NOT as a drop inside a flow (it lives outside the FlowEngine)
- For non-modal heart-spending (e.g., fixed-cost purchases), prefer a simpler confirm dialog

## Notes

The current sole instance is `component/HeartPaymentModal`. It is `status: drifting` because it bypasses the design system (raw `RNModal`, hex literals) — see `drift/heart-payment-modal-bypasses-design-system`. The pattern itself (modal-with-picker-and-source-toggle) is correct; the styling needs to be brought in line.

The post-transaction store update is intentionally NOT in this pattern — different callers spend hearts for different reasons (post creation, response award, future shop purchases) and the response shape varies. The caller closes the loop.
