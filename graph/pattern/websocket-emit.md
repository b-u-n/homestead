---
schema_version: 2
id: pattern/websocket-emit
type: pattern
title: WebSocket Emit (Request/Response)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/websockets
references:
  - spec/websocket-protocol
  - spec/error-handling
---

## Pattern

Frontend emit:

```javascript
try {
  const result = await WebSocketService.emit('namespace:action', payload);
  if (!result.success) {
    ErrorStore.addError(result.error, { blocking: result.blocking });
    return;
  }
  // use result.data
} catch (error) {
  ErrorStore.addError('Connection failed', { blocking: false });
}
```

Backend handler (registered via FlowEngine):

```javascript
{
  validate: (data) => ({ valid: !!data.required, error: 'required missing' }),
  handler: async (data, { socket, io, user }) => {
    // business logic
    return { success: true, /* payload */ };
    // or: return { success: false, error: '...', blocking: false };
  },
  formatOutput: (result) => result
}
```

Round trip: client awaits the Promise, server responds via callback envelope `{ success, ...data, error?, blocking? }`.

## When to use

Any request/response interaction across the wire. Use this — not raw `socket.emit` or REST — for any operation that has a single client→server→client roundtrip. Broadcast-style updates (server→all-clients) use the listener pattern (`socket.on/off`) instead.

## Notes

This is THE canonical wire pattern. The contract is enforced by [[spec/websocket-protocol]] R3 and R4; error routing by [[spec/error-handling]] R5. Cleanup of any listeners attached alongside an emit is covered by R5 of the protocol spec.
