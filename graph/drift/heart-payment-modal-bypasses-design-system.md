---
schema_version: 2
id: drift/heart-payment-modal-bypasses-design-system
type: drift
title: HeartPaymentModal bypasses Modal, MinkyPanel, and design tokens
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/HeartPaymentModal
source_doc:
  - doc/hearts
---

## Symptom

`frontend/components/HeartPaymentModal.js` does not follow the project's modal / panel / token conventions:

- Uses React Native's `RNModal` directly instead of the standard `component/Modal` wrapper. `CLAUDE.md` Modal Pattern: "always use the standard `Modal` component located at `frontend/components/Modal.js`."
- Builds its own panel via raw `View` + custom border + `backgroundColor: 'rgba(255, 240, 245, 0.98)'` instead of `component/MinkyPanel`. The CLAUDE.md design-system section names MinkyPanel as the standard content-panel.
- Inlines hex literals (`#7044C7`, `#E63946`, `#403F3E`, `#5C5A58`, plus several `rgba(...)`) instead of referencing `token/color-primary-text` and friends — violates `spec/design-tokens` R1.
- Uses `fontFamily: 'SuperStitch'` for the title instead of `'ChubbyTrail'` (the CLAUDE.md header font); `'SuperStitch'` appears only in `md/ART_STYLE.md` and is part of the open font-name divergence drift.
- Buttons are raw `Pressable` with custom styles instead of `component/WoolButton` / `component/ButtonBase`.

Net effect: the modal works but looks visually distinct from the rest of the app — the project's textile aesthetic is absent.

## Resolution

Rewrite the modal to:

1. Wrap content in `component/Modal` with `title="SEND HEARTS"` (uppercase per the title convention).
2. Use `component/MinkyPanel` for the info-box, source toggle, and heart-selector backgrounds.
3. Replace all hex literals with references to design tokens (`token/color-primary-text`, etc.). Once `spec/design-tokens` R1 is enforced project-wide, the modal will pick up themed values automatically via `component/ThemeStore`.
4. Use `component/WoolButton` for source toggle, confirm, and cancel.
5. Use the canonical header font `font-header` (ChubbyTrail) — resolves SuperStitch reference.

The heart-picker logic itself is fine and follows `spec/heart-balance-and-spending` R1 and R6 — only the styling shell needs to change.

## Audit log

| Date       | Agent                  | Note                                                                 |
|------------|------------------------|----------------------------------------------------------------------|
| 2026-05-22 | claude (user-currency) | Drift recorded after spot-check of HeartPaymentModal.js source.      |
