---
schema_version: 2
id: component/NotificationStore
type: component
title: NotificationStore
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/stores/NotificationStore.js
source_doc:
  - doc/notifications
uses:
  - component/WebSocketService
emits:
  - notifications:get
  - notifications:history
  - notifications:unreadCount
  - notifications:markRead
  - notifications:markAllRead
  - notifications:dismiss
  - notifications:dismissAll
handles:
  - notifications:new
---

## Purpose

MobX store that owns the active notification list, the unread count, and pending navigation state. `init()` connects the `notifications:new` listener and loads the initial active list. Exposes `loadNotifications`, `markRead`, `markAllRead`, `dismissNotification`, `dismissAll`, `setPendingNavigation` — each maps 1:1 to a backend WebSocket event.

## Notes

Filters incoming `notifications:new` broadcasts by `recipientId` per [[spec/notification-system]] R4. Mirrors `Account.activeNotifications` (max 10) in-memory; full history is fetched on demand via `notifications:history`.
