---
schema_version: 2
id: component/PositivityBoard
type: component
title: PositivityBoard
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/PositivityBoard.js
belongs_to:
  - concept/wishing-well
source_doc:
  - doc/wishingwell
handles:
  - wishingWell:newPost
  - wishingWell:postUpdated
---

## Purpose

Single-screen wishing-well board. Sort buttons at top (Newest / Oldest / Most Hearts / Least Hearts; mobile renders as 2x2 grid, desktop as horizontal row), scrollable post list with accordion expand (one open at a time), compose box pinned at bottom. Expanded posts show full content, Tip Hearts button, all responses, and inline reply input. All interaction happens here — no outbound navigation in the flow.

## Notes

Sibling `ViewPost` drop handles notification deep links and routes back here on any action. Form state persisted via `FormStore`; tipping opens `HeartPaymentModal`.
