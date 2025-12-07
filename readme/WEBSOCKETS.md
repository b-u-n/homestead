# WebSocket Architecture

This document provides a comprehensive overview of how WebSockets are used across the Homestead platform.

## Overview

The platform uses **Socket.IO** for real-time bidirectional communication. The architecture follows a **Flow-based pattern** where events are organized into logical domains (flows) with declarative handlers.

### Key Patterns

1. **Request/Response** - Client emits event, server responds via callback
2. **Broadcast** - Server emits to all connected clients (or filtered subset)
3. **Room-based** - Events scoped to specific rooms (e.g., map areas)
4. **Layer-based** - Events filtered by game layer (players only see same-layer activity)

---

## Server Configuration

**File:** `/backend/src/server.js`

```javascript
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

- **Port:** 9000 (default)
- **Transport:** WebSocket only
- **CORS:** All origins allowed

---

## FlowEngine

**File:** `/backend/src/utils/FlowEngine.js`

The FlowEngine provides a declarative way to define WebSocket handlers with built-in validation, middleware support, and output formatting.

### Handler Structure

```javascript
{
  name: 'flowName',
  handlers: {
    'eventName': {
      validate: (data) => ({ valid: true/false, error: 'message' }),
      handler: async (data, context) => { /* business logic */ },
      formatOutput: (result) => ({ /* formatted response */ })
    }
  }
}
```

### Context Object

Handlers receive a context object:

```javascript
{
  socket,      // Socket.IO socket instance
  io,          // Socket.IO server instance
  flowName,    // Name of the flow
  eventName,   // Name of the event
  user: null   // Populated by middleware
}
```

---

## Frontend WebSocket Service

**File:** `/frontend/services/websocket.js`

### Connection

```javascript
import WebSocketService from '@/services/websocket';

// Connect (called once at app startup)
WebSocketService.connect();
```

### Emitting Events

```javascript
// Promise-based emit (most common)
const data = await WebSocketService.emit('event:name', payload);

// Raw emit (includes full response metadata)
const response = await WebSocketService.emitRaw('event:name', payload);
```

### Listening for Broadcasts

```javascript
// Subscribe
WebSocketService.socket.on('event:name', (data) => {
  // Handle broadcast
});

// Unsubscribe (important for cleanup!)
WebSocketService.socket.off('event:name', handler);
```

---

## Event Reference

### Authentication (`/backend/src/routes/auth.js`)

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `auth:google` | `{ googleToken }` | `{ user, token }` | Google OAuth login |
| `auth:logout` | `{}` | `{ success: true }` | Clears session |
| `auth:verify` | `{ token }` | `{ user }` | JWT verification |

---

### Users (`/backend/src/routes/users.js`)

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `user:get` | `{ sessionId }` | `{ avatar, hearts, energy, maxHearts, ... }` | Get user profile |
| `user:create` | User data | `{ user }` | TODO: Not implemented |
| `user:update` | User data | `{ data }` | TODO: Not implemented |
| `user:delete` | User data | `{ success }` | TODO: Not implemented |

---

### Layers (`/backend/src/routes/layers.js`)

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `layers:list` | `{}` | `{ layers: [...] }` | Lists active layers with playerCount |
| `layers:create` | `{ name, description?, order?, isDefault?, maxPlayers? }` | `{ layer }` | Admin only |
| `layers:join` | `{ layerId }` | `{ layer }` | Joins layer, leaves previous |
| `layers:leave` | `{}` | `{ success }` | Leaves current layer |
| `layers:current` | `{}` | `{ layer? }` | Returns current layer or null |

---

### Rooms (`/backend/src/routes/rooms.js`)

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `room:create` | Room data | `{ room }` | Temporary implementation |
| `room:get` | `{ id }` | `{ room }` | Temporary implementation |
| `room:list` | `{}` | `{ data: [] }` | Returns empty array |
| `room:join` | `{ roomId }` | `{ success }` | Joins Socket.IO room |
| `room:leave` | `{ roomId }` | `{ success }` | Leaves Socket.IO room |

---

### Map (`/backend/src/routes/map.js`)

| Event | Input | Output | Broadcasts | Notes |
|-------|-------|--------|-----------|-------|
| `map:move` | `{ roomId, x, y, avatarUrl, avatarColor, username }` | `{ success }` | `map:move` | Position update |
| `map:emote` | `{ roomId, emote, x, y, avatarUrl, avatarColor, username }` | `{ success }` | `map:emote` | Emote (4.2s display) |
| `map:enter` | `{ roomId, x, y, avatarUrl, avatarColor, username }` | `{ socketId, roomId, existingPlayers[] }` | `map:enter`, `map:leave` | Enter room |
| `map:leave` | `{ roomId }` | `{ socketId, roomId }` | `map:leave` | Leave room |

**Broadcast filtering:** Map events only broadcast to players in the same room AND layer.

---

### Sound Settings (`/backend/src/routes/soundSettings.js`)

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `soundSettings:get` | `{}` | `{ settings: Map }` | Get all settings |
| `soundSettings:update` | `{ soundKey, settings }` | `{ settings }` | Update single sound |
| `soundSettings:updateBatch` | `{ settings: {...} }` | `{ settings }` | Batch update |
| `soundSettings:reset` | `{ soundKey }` | `{ settings }` | Reset single sound |
| `soundSettings:resetAll` | `{}` | `{ settings }` | Reset all to defaults |

---

### Hearts (`/backend/src/flows/hearts.js`)

| Event | Input | Output | Notes |
|-------|-------|--------|-------|
| `hearts:deposit` | `{ sessionId, amount }` | `{ hearts, heartBank }` | Move active → bank |
| `hearts:withdraw` | `{ sessionId, amount }` | `{ hearts, heartBank, dailyWithdrawalsRemaining }` | Move bank → active (1/day, max 9) |
| `hearts:getBalance` | `{ sessionId }` | `{ hearts, heartBank, dailyWithdrawalsRemaining }` | Check balance |

**Heart Economy:**
- **Active Hearts:** Max 9, used for immediate rewards/bounties
- **Heart Bank:** Unlimited storage, requires daily withdrawal

---

### Weeping Willow (`/backend/src/flows/weepingWillow.js`)

"Help Wanted" posts with heart bounties. First responder wins the bounty.

| Event | Input | Output | Broadcasts | Notes |
|-------|-------|--------|-----------|-------|
| `weepingWillow:posts:get` | `{ filter?, sort? }` | `{ data: posts[] }` | - | Max 50 posts |
| `weepingWillow:posts:create` | `{ sessionId, content, hearts }` | `{ data: post }` | `weepingWillow:newPost` | Deducts hearts from author |
| `weepingWillow:posts:addResponse` | `{ sessionId, postId, content }` | `{ post, heartsAwarded }` | `weepingWillow:postUpdated` | First responder wins bounty |

**Filters:** `'new'` (7 days), `'unresponded'`, or none for all
**Sorts:** `'value-asc'`, `'value-desc'`, `'date-asc'`, `'date-desc'`

#### Post Model

```javascript
{
  content: String,           // Max 500 chars
  hearts: Number,            // Bounty (min 1)
  authorSessionId: String,   // Links to Account
  authorName: String,
  authorAvatar: String,
  responses: [{
    content: String,
    responderSessionId: String,
    responderName: String,
    responderAvatar: String,
    createdAt: Date
  }],
  firstResponderSessionId: String,  // Who won the bounty
  createdAt: Date
}
```

#### Frontend Usage

```javascript
// Create a post
await WebSocketService.emit('weepingWillow:posts:create', {
  sessionId: SessionStore.sessionId,
  content: 'I need help with...',
  hearts: 3  // Bounty offered
});

// List posts
const { data } = await WebSocketService.emit('weepingWillow:posts:get', {
  filter: 'unresponded',
  sort: 'date-desc'
});

// Respond to a post
await WebSocketService.emit('weepingWillow:posts:addResponse', {
  sessionId: SessionStore.sessionId,
  postId: '...',
  content: 'Here is my response...'
});

// Listen for real-time updates
WebSocketService.socket.on('weepingWillow:newPost', loadPosts);
WebSocketService.socket.on('weepingWillow:postUpdated', loadPosts);
```

---

### Wishing Well (`/backend/src/flows/wishingWell.js`)

Free positive message posts with optional tipping.

| Event | Input | Output | Broadcasts | Notes |
|-------|-------|--------|-----------|-------|
| `wishingWell:posts:get` | `{ filter?, sort? }` | `{ data: posts[] }` | - | Max 50 posts |
| `wishingWell:posts:create` | `{ sessionId, content }` | `{ data: post }` | `wishingWell:newPost` | FREE (no hearts) |
| `wishingWell:posts:addResponse` | `{ sessionId, postId, content }` | `{ post }` | `wishingWell:postUpdated` | No rewards |
| `wishingWell:posts:tip` | `{ sessionId, postId, amount, source }` | `{ post, tipperBalance }` | `wishingWell:postUpdated` | Tip hearts to author |

**source:** `'active'` or `'bank'`

#### Post Model

```javascript
{
  content: String,
  authorSessionId: String,
  authorName: String,
  authorAvatar: String,
  responses: [...],
  tips: [{
    amount: Number,
    tipperSessionId: String,
    tipperName: String,
    tipperAvatar: String,
    createdAt: Date
  }],
  totalTips: Number,  // Sum of all tips
  createdAt: Date
}
```

---

## Frontend Component Patterns

### Real-time List Updates

```javascript
// PostsList.js pattern
useEffect(() => {
  loadPosts();

  // Subscribe to broadcasts
  WebSocketService.socket?.on(`${flowName}:newPost`, loadPosts);
  WebSocketService.socket?.on(`${flowName}:postUpdated`, loadPosts);

  // Cleanup on unmount
  return () => {
    WebSocketService.socket?.off(`${flowName}:newPost`, loadPosts);
    WebSocketService.socket?.off(`${flowName}:postUpdated`, loadPosts);
  };
}, [filter, sort]);
```

### Form Submission

```javascript
// CreateWeepingWillowPost.js pattern
const handleSubmit = async () => {
  try {
    await WebSocketService.emit('weepingWillow:posts:create', {
      sessionId: SessionStore.sessionId,
      content: content.trim(),
      hearts: selectedHearts
    });
    FormStore.resetForm('createPost');
    onComplete({ action: 'submitted' });
  } catch (error) {
    ErrorStore.setError(error.message);
  }
};
```

---

## Key Design Decisions

1. **Session-based identification:** Uses `sessionId` for user lookup (supports multiple concurrent sessions)
2. **Form persistence:** FormStore preserves drafts across navigation
3. **Layer isolation:** Map events filtered by layer (players only see same-layer activity)
4. **Asymmetric heart economy:** Active hearts capped at 9, bank unlimited but requires daily withdrawal
5. **Broadcast for real-time:** All clients receive newPost/postUpdated events to refresh lists
