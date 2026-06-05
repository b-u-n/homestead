---
schema_version: 2
id: component/HeartPaymentModal
type: component
title: HeartPaymentModal
status: drifting
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/HeartPaymentModal.js
belongs_to:
  - concept/heart-economy
follows:
  - pattern/heart-payment-modal-flow
uses:
  - component/Heart
source_doc:
  - doc/hearts
---

## Purpose

Standalone modal for selecting a heart payment amount (1–9) and source (Active vs Bank) before confirming a heart-spending action. Renders a heart picker, displays the recipient + purpose in an info box, and calls `onComplete({ amount, source })` on confirm. Reads `profileStore.hearts` and `profileStore.heartBank` reactively (MobX observer).

## Notes

`status: drifting` because the component bypasses the design system — it uses React Native's `RNModal` directly instead of `component/Modal`, inlines hex literals (`#7044C7`, `#E63946`, `#403F3E`, etc.) instead of referencing `token/color-primary-text`, and uses raw `View` + custom styles instead of `component/MinkyPanel` / `component/WoolButton`. See `drift/heart-payment-modal-bypasses-design-system`.

Heart-balance behavior follows `spec/heart-balance-and-spending` R1 (1–9 picker) and R6 (three-tier opacity for available/selected/unavailable). The store-update-on-confirm side is the caller's responsibility — see R3/R4 of that spec.
