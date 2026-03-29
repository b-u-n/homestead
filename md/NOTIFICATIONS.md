# Notifications

Real-time notification system for alerting users to events like responses to their posts.

## Overview

The notification system uses WebSockets to deliver real-time notifications. Notifications are stored in two places:

1. **Notification collection** - Permanent history of all notifications (never deleted)
2. **Account.activeNotifications** - Up to 10 most recent notifications for quick display

### Key Features

- Real-time delivery via WebSocket push
- Permanent history storage (never deleted)
- Up to 10 active notifications per user
- Deep linking to navigate directly to the source
- Dismiss removes from active list but keeps in history

---

## Architecture

### Data Flow

```
Event Occurs (e.g., new response on post)
       ↓
Backend Flow calls createNotification()
       ↓
1. Notification saved to Notification collection (permanent history)
2. Added to Account.activeNotifications (max 10, oldest overflow)
       ↓
WebSocket broadcast: notifications:new
       ↓
Frontend NotificationStore receives notification
       ↓
NotificationHeart shows unread badge with count
       ↓
User clicks notification
       ↓
Flow opens at specific drop with params
       ↓
User dismisses → removed from active list, stays in history
```

### Storage Architecture

| Location | Purpose | Max Items | Deletion |
|----------|---------|-----------|----------|
| `Notification` collection | Permanent history | Unlimited | Never |
| `Account.activeNotifications` | Quick display | 10 | Dismissed or overflowed |

### Files

| Layer | File | Purpose |
|-------|------|---------|
| **Backend Model** | `/backend/src/models/Notification.js` | Mongoose schema for history |
| **Backend Model** | `/backend/src/models/Account.js` | `activeNotifications` array |
| **Backend Flow** | `/backend/src/flows/notifications.js` | WebSocket handlers + createNotification |
| **Frontend Store** | `/frontend/stores/NotificationStore.js` | MobX store for state |
| **Frontend UI** | `/frontend/components/NotificationHeart.js` | Heart icon with dropdown |

---

## WebSocket Events

| Event | Direction | Input | Output | Notes |
|-------|-----------|-------|--------|-------|
| `notifications:get` | Request/Response | `{ sessionId }` | `{ notifications[], unreadCount }` | Get active notifications |
| `notifications:history` | Request/Response | `{ sessionId, limit?, offset? }` | `{ notifications[], total, hasMore }` | Get full history |
| `notifications:unreadCount` | Request/Response | `{ sessionId }` | `{ unreadCount }` | Lightweight count |
| `notifications:markRead` | Request/Response | `{ sessionId, notificationId }` | `{ notification, unreadCount }` | Mark as read |
| `notifications:markAllRead` | Request/Response | `{ sessionId }` | `{ unreadCount: 0 }` | Mark all as read |
| `notifications:dismiss` | Request/Response | `{ sessionId, notificationId }` | `{ unreadCount }` | Remove from active (keeps history) |
| `notifications:dismissAll` | Request/Response | `{ sessionId }` | `{ unreadCount: 0 }` | Clear active list |
| `notifications:new` | Broadcast | - | `{ recipientId, notification }` | Real-time push |

---

## Data Models

### Notification (History Collection)

```javascript
{
  recipientId: ObjectId,       // Account who receives the notification
  type: String,                // Notification type (enum)
  message: String,             // Human-readable message (max 200 chars)
  navigation: {                // Deep link data
    flow: String,              // Flow name (e.g., 'weepingWillow')
    dropId: String,            // Target drop ID
    params: Map                // Parameters for the drop
  },
  actor: {                     // Who triggered the notification
    accountId: ObjectId,
    name: String,
    avatar: String
  },
  read: Boolean,               // Read state
  createdAt: Date              // Timestamp
}
```

### Account.activeNotifications (Embedded Array)

```javascript
activeNotifications: [{
  notificationId: ObjectId,    // References Notification._id
  type: String,
  message: String,
  navigation: { flow, dropId, params },
  actor: { accountId, name, avatar },
  read: Boolean,
  createdAt: Date
}]
// Max 10 items - oldest overflow stays only in Notification collection
```

### Notification Types

| Type | Description | Navigation |
|------|-------------|------------|
| `weepingWillow:response` | Someone responded to your help request | Opens viewPost drop |
| `weepingWillow:bounty` | You earned a bounty for responding | Opens viewPost drop |
| `wishingWell:tip` | Someone tipped your wish | Opens viewPost drop |
| `system` | System notification | No navigation |

---

## Creating Notifications

Use the `createNotification` helper from the notifications flow:

```javascript
const { createNotification } = require('./notifications');

// Inside a handler
await createNotification(context.io, {
  recipientId: post.authorId,           // Who gets it (Account ObjectId)
  type: 'weepingWillow:response',       // Notification type
  message: `${responderName} responded to your help request`,
  navigation: {
    flow: 'weepingWillow',
    dropId: 'weepingWillow:viewPost',
    params: new Map([['postId', post._id.toString()]])
  },
  actor: {
    accountId: responder._id,
    name: responderName,
    avatar: responderAvatar
  }
});
```

This will:
1. Save to Notification collection (permanent history)
2. Add to Account.activeNotifications (max 10)
3. Broadcast via WebSocket to recipient

---

## Frontend Integration

### NotificationHeart Component

Add to your layout next to other header elements:

```javascript
import NotificationHeart from './NotificationHeart';

<View style={styles.menuContainer}>
  <NotificationHeart
    style={{ marginRight: 10 }}
    onNotificationClick={handleNotificationClick}
  />
  <HamburgerMenu />
</View>
```

### Handling Navigation

```javascript
const handleNotificationClick = (notification, nav) => {
  if (nav && nav.flow === 'weepingWillow') {
    setWeepingWillowStartAt(nav.dropId);
    setWeepingWillowParams(nav.params || {});
    setIsWeepingWillowOpen(true);
  }
};
```

### NotificationStore Methods

| Method | Description |
|--------|-------------|
| `init()` | Initialize store, listen for WebSocket events |
| `loadNotifications()` | Fetch active notifications from server |
| `markRead(id)` | Mark single notification as read |
| `markAllRead()` | Mark all as read |
| `dismissNotification(id)` | Remove from active list (keeps in history) |
| `dismissAll()` | Clear active list |
| `setPendingNavigation(notification)` | Set navigation for click handling |

---

## UI Behavior

1. **Heart icon** in top-right corner shows unread count badge
2. **Clicking heart** opens dropdown panel with notifications
3. **Clicking notification** navigates to source and marks as read
4. **Clicking ✕** dismisses notification (removes from active, keeps in history)
5. **"Dismiss all"** clears active list
6. **Clicking outside** closes the dropdown

---

## Design Decisions

1. **Two-tier storage**: Active notifications on Account for fast access, full history in separate collection

2. **Never delete**: Notifications are permanent history - dismiss only removes from active display

3. **Max 10 active**: Keeps UI clean, older notifications overflow to history-only

4. **Mark read on click**: Automatically marks as read when user clicks to navigate

5. **Dismiss vs Delete**: "Dismiss" removes from active list but notification stays in history forever
