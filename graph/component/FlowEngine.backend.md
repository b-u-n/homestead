---
schema_version: 2
id: component/FlowEngine.backend
type: component
title: FlowEngine (backend)
status: stable
last_audited: 2026-05-22
surface: backend
file: /backend/src/utils/FlowEngine.js
belongs_to:
  - concept/activity-system
source_doc:
  - doc/flows
---

## Purpose

Backend half of the Flow Engine. Registers WebSocket handlers under the flow namespace (`<flow>:<verb>`), validates incoming input via per-handler `validate(data)`, executes `handler(data, { socket, io, flowName, eventName, user })`, and standardizes response shape via optional `formatOutput`.

## Notes

Paired with [[component/FlowEngine.frontend]]. Governed by [[spec/flow-engine]] — R5 is the backend contract. The pairing is a transactional one: frontend emits via `WebSocketService`; the backend handler matches the event name to its registered flow handler.
