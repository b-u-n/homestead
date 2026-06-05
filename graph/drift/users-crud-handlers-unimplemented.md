---
schema_version: 2
id: drift/users-crud-handlers-unimplemented
type: drift
title: User CRUD handlers (create / update / delete) listed but unimplemented
status: open
last_audited: 2026-05-22
cause: unimplemented
auto_accept_after: 90
drifts_from:
  - spec/websocket-protocol
affects:
  - component/ServerSocketHandlers
source_doc:
  - doc/websockets
---

## Symptom

`md/WEBSOCKETS.md` § Users lists three handlers as part of the wire surface but explicitly marks them `TODO: Not implemented`:

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `user:create` | User data | `{ user }` | TODO: Not implemented |
| `user:update` | User data | `{ data }` | TODO: Not implemented |
| `user:delete` | User data | `{ success }` | TODO: Not implemented |

These violate [[spec/websocket-protocol]] R1 implicitly: an event name is in the public wire surface, but there is no FlowEngine handler registered for it. A frontend caller emitting `user:create` either:
- Receives a timeout (no handler responds), OR
- Receives whatever default Socket.IO does when no handler exists (silent drop).

Either failure mode is worse than the event not being documented at all — the doc creates the expectation that the contract exists.

## Resolution

Two paths, choose one:

1. **Implement** — add real handlers in `/backend/src/routes/users.js` that satisfy whatever the frontend needs (user lifecycle is currently driven by `auth:google` + `user:get`; CRUD may not be needed at all).
2. **Remove from doc** — if these handlers are not on the roadmap, delete the three rows from `md/WEBSOCKETS.md` so the wire surface document reflects reality. The cluster of features the app actually exposes (Google OAuth + session lookup) does not require frontend-initiated user CRUD.

Path 2 is the likely correct choice given the auth model. Until decided, this drift documents the gap.

If unresolved by 2026-08-20, `status` auto-flips to `accepted`.

## Audit log

| Date       | Agent                | Note                                                                                          |
|------------|----------------------|-----------------------------------------------------------------------------------------------|
| 2026-05-22 | claude (cluster init)| Recorded during wire-platform-auth cluster buildout. WEBSOCKETS.md TODOs unchanged.            |
