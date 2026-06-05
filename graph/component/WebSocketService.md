---
schema_version: 2
id: component/WebSocketService
type: component
title: WebSocketService
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/services/websocket.js
belongs_to:
  - concept/wire-protocol
source_doc:
  - doc/websockets
follows:
  - pattern/websocket-emit
emits:
  - auth:google
  - auth:logout
  - auth:verify
  - user:get
  - layers:list
  - layers:create
  - layers:join
  - layers:leave
  - layers:current
  - room:create
  - room:get
  - room:list
  - room:join
  - room:leave
  - map:move
  - map:emote
  - map:enter
  - map:leave
  - soundSettings:get
  - soundSettings:update
  - soundSettings:updateBatch
  - soundSettings:reset
  - soundSettings:resetAll
  - hearts:deposit
  - hearts:withdraw
  - hearts:getBalance
  - weepingWillow:posts:get
  - weepingWillow:posts:create
  - weepingWillow:posts:addResponse
  - wishingWell:posts:get
  - wishingWell:posts:create
  - wishingWell:posts:addResponse
  - wishingWell:posts:tip
  - notifications:get
  - notifications:history
  - notifications:unreadCount
  - notifications:markRead
  - notifications:markAllRead
  - notifications:dismiss
  - notifications:dismissAll
handles:
  - weepingWillow:newPost
  - weepingWillow:postUpdated
  - wishingWell:newPost
  - wishingWell:postUpdated
  - map:move
  - map:emote
  - map:enter
  - map:leave
  - notifications:new
---

## Purpose

The single Socket.IO client wrapper on the frontend. Every WebSocket event the app emits or listens to passes through this service. Provides `emit` (Promise-resolving) for request/response, `emitRaw` for the full envelope, and `socket.on/off` passthrough for broadcast subscriptions. Owns connection lifecycle, reconnect, and auth-token injection.

## Notes

`emits:` lists request/response events the frontend originates. `handles:` lists broadcast events the frontend listens for (registered via `.socket.on`). The two lists are the contract surface between this component and [[component/ServerSocketHandlers]] — they must round-trip identically.

The lists here mirror `md/WEBSOCKETS.md`. When that doc gains new events, this node's `emits:`/`handles:` arrays update to match. Individual flow specs (hearts, weepingWillow, etc.) will eventually govern subsets of these events; until then [[spec/websocket-protocol]] is the catch-all.
