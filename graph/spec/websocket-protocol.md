---
schema_version: 2
id: spec/websocket-protocol
type: spec
title: WebSocket Protocol
status: stable
last_audited: 2026-05-22
tags: [wire-protocol, realtime]
source_doc:
  - doc/websockets
governs:
  - component/WebSocketService
  - component/ServerSocketHandlers
---

## Rules

### R1: All real-time communication uses Socket.IO with a FlowEngine handler shape

Server is one `socketIo(server, ...)` instance on port 9000. Every handler is registered through `/backend/src/utils/FlowEngine.js` with the canonical shape: `{ validate, handler, formatOutput }`. No raw `socket.on` outside the FlowEngine for business events.

**Why:** A single registration path gives uniform validation, error formatting, and middleware (auth, permissions). Ad-hoc `socket.on` calls bypass these and produce inconsistent client behavior.
**Evidence:** `/backend/src/utils/FlowEngine.js` and every file under `/backend/src/flows/`.
**Test:** Grep `/backend/src` for `socket.on(` outside `FlowEngine.js` or connection-level handlers; expect none for business events.

### R2: Event names MUST be namespaced `flow:action` (or `flow:resource:action`)

`auth:google`, `hearts:deposit`, `weepingWillow:posts:create`, `notifications:new`. Colons separate the flow namespace from the action; no underscores or dots. Broadcast event names follow the same scheme (`weepingWillow:newPost`, `map:enter`).

**Why:** Namespacing prevents collision between unrelated flows and makes the wire surface grep-able. The frontend can filter listeners by namespace prefix.
**Evidence:** Every event table in `md/WEBSOCKETS.md`.
**Test:** A new event whose name lacks `:` fails review.

### R3: Frontend talks to the wire only through `WebSocketService`

`WebSocketService.emit(event, data)` returns a Promise resolving to the handler's response data. `WebSocketService.emitRaw` is for the full envelope. Listeners attach via `WebSocketService.socket.on/off`. No component directly imports `socket.io-client`.

**Why:** Single chokepoint for reconnection, auth-token injection, error normalization, and timeout handling. Direct `socket.io-client` use sidesteps all of that.
**Evidence:** `/frontend/services/websocket.js`. All examples in `md/WEBSOCKETS.md` go through `WebSocketService`.
**Test:** Grep `/frontend` for `socket.io-client` imports outside `services/websocket.js`; expect none.

### R4: Handlers MUST return `{ success: boolean, ...data, error?, blocking? }`

Success responses include the data fields documented per event. Error responses set `success: false`, include `error: string`, and optionally `blocking: true` for auth/critical failures. See [[spec/error-handling]].

**Why:** Frontend `WebSocketService.emit` and `ErrorStore` both assume this envelope. Returning bare data or throwing breaks the error pipeline.
**Evidence:** `md/WEBSOCKETS.md` "Backend Error Response" section; every flow handler in `/backend/src/flows/`.
**Test:** A handler returning `{ data: ... }` without `success` fails the contract — frontend will treat the response as falsy-success.

### R5: Listeners MUST unsubscribe on unmount

`useEffect` that calls `WebSocketService.socket.on(event, fn)` MUST return a cleanup that calls `WebSocketService.socket.off(event, fn)`. The PostsList pattern in `md/WEBSOCKETS.md` is the canonical example.

**Why:** Repeated remounts otherwise stack handlers and produce N× refresh storms. The bug is silent on a single screen but explodes during navigation.
**Evidence:** PostsList pattern in `md/WEBSOCKETS.md`.
**Test:** Mount + unmount a listener 10 times, then broadcast once; expect 1 callback invocation, not 10.

### R6: Map and room broadcasts filter by room AND layer

Map events (`map:move`, `map:emote`, `map:enter`, `map:leave`) only reach sockets in the same `roomId` AND the same layer. Players on different layers do not see each other even in the same room.

**Why:** Layer isolation is a core gameplay rule; cross-layer leakage would break the design intent.
**Evidence:** `md/WEBSOCKETS.md` § Map broadcast filtering.
**Test:** Two clients in same room, different layers; emit `map:move` from one, second client receives no event.

### R7: Authenticated handlers MUST resolve the user via session, not socket identity

Handlers that need the acting user call into the session lookup (typically `SessionStore.sessionId` on the frontend, decoded server-side) rather than treating `socket.id` as identity. Same human may have multiple concurrent sockets.

**Why:** Socket identity is per-connection; identity is per-account. Conflating them breaks multi-tab and reconnect.
**Evidence:** `md/WEBSOCKETS.md` § Key Design Decisions #1.
**Test:** Open two tabs as the same user; both should receive notifications routed by `recipientId`.

## Notes

Full event reference (Authentication, Users, Layers, Rooms, Map, Hearts, etc.) lives in `md/WEBSOCKETS.md` per R6. Individual flow specs (hearts, weepingWillow, wishingWell) will get their own spec nodes when those clusters are populated.

Some handlers in the source doc are marked `TODO: Not implemented` (e.g. `user:create`, `user:update`, `user:delete`). Each such unimplemented handler is captured as its own drift — see [[drift/users-crud-handlers-unimplemented]].
