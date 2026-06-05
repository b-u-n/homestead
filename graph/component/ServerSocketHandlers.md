---
schema_version: 2
id: component/ServerSocketHandlers
type: component
title: Server Socket Handlers
status: stable
last_audited: 2026-05-22
surface: backend
file:
  - /backend/src/server.js
  - /backend/src/utils/FlowEngine.js
  - /backend/src/routes/auth.js
  - /backend/src/routes/users.js
  - /backend/src/routes/layers.js
  - /backend/src/routes/rooms.js
  - /backend/src/routes/map.js
  - /backend/src/routes/soundSettings.js
  - /backend/src/flows/hearts.js
  - /backend/src/flows/weepingWillow.js
  - /backend/src/flows/wishingWell.js
  - /backend/src/flows/notifications.js
  - /backend/src/flows/admin.js
  - /backend/src/flows/moderation.js
belongs_to:
  - concept/wire-protocol
source_doc:
  - doc/websockets
follows:
  - pattern/websocket-emit
handles:
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
emits:
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

Aggregate node representing the backend wire surface: every `flows/` and `routes/` module that registers handlers through `/backend/src/utils/FlowEngine.js`, plus the connection-level setup in `/backend/src/server.js`. Treated as one cluster node rather than 14 file-level nodes because the contract surface (event names + envelope) is what matters at this granularity; per-flow specs will split this when those clusters are populated.

## Notes

`handles:` is everything the backend accepts from the wire; `emits:` is everything it broadcasts back. The two arrays are the inverse of [[component/WebSocketService]]'s lists — round-trip equality is the wire contract.

Several handlers under `users.js` (`user:create`, `user:update`, `user:delete`) are listed in `md/WEBSOCKETS.md` as `TODO: Not implemented`. See [[drift/users-crud-handlers-unimplemented]]. They are included in `handles:` here because the wire surface declares them; the drift node tracks the unimplemented status.
