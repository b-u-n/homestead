---
schema_version: 2
id: component/NotificationHeart
type: component
title: NotificationHeart
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/NotificationHeart.js
source_doc:
  - doc/notifications
  - doc/badges
belongs_to:
  - concept/heart-economy
  - concept/badge-system
follows:
  - pattern/badge-positioning-overlay
uses:
  - component/NotificationStore
  - component/Heart
  - component/MinkyPanel
handles:
  - notifications:new
---

## Purpose

The heart icon in the top-right of the layout that surfaces real-time notifications. Renders an unread-count badge driven by [[component/NotificationStore]]; opens a dropdown panel showing active notifications on click. Each notification entry routes the user to the source via the navigation object (flow + dropId + params).

## Notes

Subscribes to the `notifications:new` broadcast through [[component/WebSocketService]] (indirectly via NotificationStore). Click handler is provided by the parent layout — the component does not own navigation routing, only the click event.
