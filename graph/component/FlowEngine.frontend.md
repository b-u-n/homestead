---
schema_version: 2
id: component/FlowEngine.frontend
type: component
title: FlowEngine (frontend)
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/FlowEngine.js
follows:
  - pattern/drop-composition
  - pattern/deep-link-mid-flow
  - pattern/depth-overlay-modal
belongs_to:
  - concept/activity-system
uses:
  - component/Modal
pairs_with:
  - component/FlowEngine.backend
source_doc:
  - doc/flows
  - doc/drops
---

## Purpose

Frontend half of the Flow Engine. Renders the current drop inside a `Modal`, manages per-depth navigation history, accumulates drop output, and supports deep-link entry (`startAt` + `initialParams`). The declarative state machine that powers every multi-step modal flow in the UI.

## Notes

Paired with [[component/FlowEngine.backend]] via WebSocket events that follow the flow namespace. Governed by [[spec/flow-engine]] — R1–R4, R6 are the frontend-facing rules; R5 is the backend contract on the paired node.
