---
schema_version: 2
id: spec/notification-system
type: spec
title: Notification System
status: stable
last_audited: 2026-05-22
tags: [notifications, realtime]
source_doc:
  - doc/notifications
governs:
  - component/NotificationHeart
  - component/NotificationStore
references:
  - spec/websocket-protocol
---

## Rules

### R1: Notifications are stored in two places — permanent `Notification` collection and embedded `Account.activeNotifications`

Every created notification is saved to the `Notification` Mongoose collection (unlimited, never deleted) AND mirrored into the recipient's `Account.activeNotifications` array (max 10, oldest overflows out).

**Why:** Two tiers buy fast-access read path (no join for the badge dropdown) and complete audit history (no data loss). Either tier alone fails: collection-only is too slow for the badge; embedded-only loses overflow.
**Evidence:** `md/NOTIFICATIONS.md` § Storage Architecture; `/backend/src/models/Notification.js`; `/backend/src/models/Account.js`.
**Test:** Create 11 notifications for one account; expect `Notification.find({recipientId})` returns 11 and `Account.activeNotifications.length === 10`.

### R2: `Account.activeNotifications` is hard-capped at 10 with FIFO overflow

When a new notification is pushed, if the array length exceeds 10 the oldest entry is removed from the embedded array. The overflowed entry remains in the `Notification` collection.

**Why:** UI shows the heart dropdown as a small panel; unbounded growth degrades both render and document size. 10 is the documented limit in `md/NOTIFICATIONS.md`.
**Evidence:** `md/NOTIFICATIONS.md` § Storage Architecture; § Design Decisions #3.
**Test:** Push 12 notifications; oldest 2 are not in `activeNotifications` but are in `Notification` collection.

### R3: Dismiss removes from active, never from history

`notifications:dismiss` and `notifications:dismissAll` MUST only touch `Account.activeNotifications`. The `Notification` collection is append-only from the user's perspective.

**Why:** History is the audit log; if dismiss deleted history, a user couldn't recover or review past events. The contract is explicit: "Notifications are permanent history".
**Evidence:** `md/NOTIFICATIONS.md` § Overview, § Design Decisions #5.
**Test:** Dismiss a notification, then call `notifications:history`; the dismissed notification still appears.

### R4: New notifications broadcast via `notifications:new` with `{ recipientId, notification }`

The push event is room-less but client-side filtered by `recipientId`. Frontend `NotificationStore` only acts on broadcasts whose `recipientId` matches the current session.

**Why:** Single broadcast channel is simpler than per-user rooms and works across multi-tab. Filtering client-side trades a tiny amount of wasted traffic for protocol simplicity.
**Evidence:** `md/NOTIFICATIONS.md` § WebSocket Events table.
**Test:** Two accounts connected; create a notification for account A; account B's `NotificationStore` ignores the broadcast.

### R5: Notification navigation is declarative: `{ flow, dropId, params }`

Every notification carries a `navigation` object describing where a click should take the user. Frontend `onNotificationClick` reads the object and opens the named flow at the named drop with the params. Notifications without nav (e.g. `type: system`) are display-only.

**Why:** Deep-linking from notification to source is the whole UX value-add. Encoding the destination structurally (not as a URL) keeps it Flow-Engine-native.
**Evidence:** `md/NOTIFICATIONS.md` § Data Models, § Frontend Integration.
**Test:** Click a `weepingWillow:response` notification; the WeepingWillow flow opens at `weepingWillow:viewPost` with the post ID param.

### R6: Use `createNotification` helper, never write notifications inline

Backend flow handlers MUST call `createNotification(io, {...})` from `/backend/src/flows/notifications.js` rather than writing to the `Notification` collection or pushing to `Account.activeNotifications` directly.

**Why:** The helper enforces the three-step contract (save history → push active → broadcast). Inline writes skip steps and produce silently-broken notifications (e.g. saved but never broadcast).
**Evidence:** `md/NOTIFICATIONS.md` § Creating Notifications.
**Test:** Grep `/backend/src/flows/` for direct writes to `Notification` or `activeNotifications` outside `notifications.js`; expect none.

## Notes

Notification types are enumerated in `md/NOTIFICATIONS.md` (`weepingWillow:response`, `weepingWillow:bounty`, `wishingWell:tip`, `system`). Adding a new type requires updating both the helper's allowed-types validation and the frontend's navigation handler.
