---
schema_version: 2
id: pattern/socket-emit-await
type: pattern
title: WebSocket Emit + Await
status: stable
last_audited: 2026-05-22
tags: [websocket, async]
source_doc:
  - doc/claude
  - doc/architecture
references:
  - spec/architecture-overview
---

## Pattern

The frontend calls one of two methods on `WebSocketService`:

```js
import WebSocketService from '../services/websocket';

// Common case — resolves with response.data, rejects with response.error
const data = await WebSocketService.emit('feature:event', { foo: 'bar' });

// Raw case — resolves with the full ack payload (socketId, roomId, etc.)
const full = await WebSocketService.emitRaw('feature:event', { foo: 'bar' });
```

Both wrap `socket.emit(event, data, ackCallback)` in a Promise. The backend handler must invoke its `callback({ success, data?, error? })` for the promise to resolve.

Server-pushed broadcasts (e.g. `weepingWillow:newPost`) use raw listeners:

```js
WebSocketService.socket.on('weepingWillow:newPost', (post) => { /* ... */ });
```

Errors are routed through `ErrorStore` (see [[pattern/error-store-broadcast]]).

## When to use

- Every stateful interaction with the backend (auth, profile, posts, hearts, activities, inventory, mood, etc.) — see R1 in [[spec/architecture-overview]].
- NOT for one-shot file uploads or asset fetches — those use HTTP routes under `backend/src/routes/`.

## Notes

`emit` unwraps `response.data` automatically and rejects on `response.success === false`. `emitRaw` is for the small number of callers that need top-level fields like `socketId`. The handler callback contract (`{ success, data?, error? }`) is the wire-side complement to [[pattern/error-store-broadcast]] on the frontend.

Backend handlers wired via the FlowEngine (`backend/src/utils/FlowEngine.js`) automatically pass `(data, callback)` to the registered handler; the handler returns `{ success, data }` or throws (the engine packages exceptions into `{ success: false, error }`).
