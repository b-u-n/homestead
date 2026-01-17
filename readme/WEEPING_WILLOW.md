# Weeping Willow

"Help Wanted" posts with heart bounties. Users offer hearts for assistance, and the first responder claims the bounty.

## Business Requirements

### Landing Page
Two distinct buttons:
1. **Ask for help** - Create a new help wanted post
2. **Help others** - Browse existing posts and respond

### Create Post
- User enters post content (max 5000 characters)
- User selects heart bounty (1-9 hearts from their active balance)
- Hearts are deducted from user's account on submission
- Post displays under user's username (internally tracked by MongoDB ObjectId)
- Real-time broadcast to all connected clients

### View Posts (List)
- Displays all posts with sort options
- Sort options: Unresponded, Most Popular, Most Hearts, Least Hearts, Newest, Oldest
- Each post shows: author name, avatar, bounty amount, content, response count
- Expandable to show all responses
- "RESPOND" button to add a response
- Real-time updates via WebSocket broadcasts

### Responding
- First responder wins the entire heart bounty
- Hearts go to responder's active balance (capped at 9), overflow to bank
- Cannot respond to your own posts
- Max 5000 characters

---

## Architecture

### Data Flow

```
User Creates Post
       ↓
Frontend: CreateWeepingWillowPost component
       ↓
WebSocket: weepingWillow:posts:create
       ↓
Backend: FlowEngine validates & deducts hearts
       ↓
MongoDB: WeepingWillowPost saved
       ↓
Broadcast: weepingWillow:newPost
       ↓
All Clients: PostsList refreshes
```

### Files

| Layer | File | Purpose |
|-------|------|---------|
| **Backend Model** | `/backend/src/models/WeepingWillowPost.js` | Mongoose schema |
| **Backend Flow** | `/backend/src/flows/weepingWillow.js` | WebSocket handlers |
| **Frontend Flow** | `/frontend/flows/weepingWillowFlow.js` | Navigation state machine |
| **Landing** | `/frontend/components/drops/WeepingWillowLanding.js` | Ask for help / Help others buttons |
| **Create** | `/frontend/components/drops/CreateWeepingWillowPost.js` | Post creation form (mobile + desktop) |
| **Confirmation** | `/frontend/components/drops/PostConfirmation.js` | Post submitted confirmation |
| **List** | `/frontend/components/drops/PostsList.js` | Posts listing (mobile + desktop) |
| **Respond** | `/frontend/components/drops/RespondToPost.js` | Response form (mobile + desktop, layout adapts) |
| **ViewPost** | `/frontend/components/drops/ViewPost.js` | Single post view (notification deep link) |

---

## WebSocket Events

See [WEBSOCKETS.md](./WEBSOCKETS.md) for full documentation.

### Quick Reference

| Event | Direction | Purpose |
|-------|-----------|---------|
| `weepingWillow:posts:get` | Request/Response | Fetch posts with sort options |
| `weepingWillow:posts:create` | Request/Response | Create new post (deducts hearts) |
| `weepingWillow:posts:addResponse` | Request/Response | Add response (awards hearts to first) |
| `weepingWillow:newPost` | Broadcast | Notifies all clients of new post |
| `weepingWillow:postUpdated` | Broadcast | Notifies all clients of post update |

---

## Data Model

### WeepingWillowPost

```javascript
{
  content: {
    type: String,
    required: true,
    maxLength: 5000
  },
  hearts: {
    type: Number,
    required: true,
    min: 1
  },
  authorId: {
    type: ObjectId,        // References Account._id
    ref: 'Account',
    required: true,
    index: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: String,
  responses: [{
    content: { type: String, required: true, maxLength: 5000 },
    responderId: { type: ObjectId, ref: 'Account', required: true },
    responderName: { type: String, required: true },
    responderAvatar: String,
    createdAt: { type: Date, default: Date.now }
  }],
  firstResponderId: ObjectId,  // null until first response, ref: Account
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}
```

**Indexes:**
- `createdAt` - For date sorting
- `hearts` - For value sorting
- `authorId` - For user's posts lookup
- Compound index on responses existence for "unresponded" filter

**Note:** Posts are tracked by Account ObjectId internally, but only display `authorName` to other users. This allows:
- Permanent linking of posts to accounts (survives session changes)
- Future account merging when anonymous users authenticate via OAuth

---

## Frontend Navigation Flow

```
weepingWillow:landing
    │
    ├── action: 'create' ──→ weepingWillow:create
    │                              │
    │                              ├── action: 'submitted' ──→ weepingWillow:confirmation
    │                              │                                │
    │                              │                                ├── action: 'list' ──→ weepingWillow:list
    │                              │                                └── action: 'done' ──→ (close flow)
    │                              │
    │                              └── action: 'back' ──→ weepingWillow:landing
    │
    └── action: 'view' ──→ weepingWillow:list
                               │
                               ├── action: 'respond' ──→ weepingWillow:respond
                               │                              │
                               │                              └── any ──→ weepingWillow:list
                               │
                               ├── action: 'create' ──→ weepingWillow:create
                               │
                               └── action: 'back' ──→ weepingWillow:landing
```

### Drops

| Drop ID | Component | Description |
|---------|-----------|-------------|
| `weepingWillow:landing` | WeepingWillowLanding | Two buttons: "Ask for help" and "Help others" |
| `weepingWillow:create` | CreateWeepingWillowPost | Heart selector + message textarea |
| `weepingWillow:confirmation` | PostConfirmation | Confirms submission, encourages helping others |
| `weepingWillow:list` | PostsList | Filterable/sortable list of posts |
| `weepingWillow:respond` | RespondToPost | Response textarea for a specific post |
| `weepingWillow:viewPost` | ViewPost | Single post view (for notification deep links) |

---

## Implementation Status

### Working
- [x] Post creation with heart bounty
- [x] Heart deduction from author
- [x] Heart count updates in UI after transactions
- [x] Post listing with filters and sorts
- [x] Response submission
- [x] First responder heart reward
- [x] Real-time broadcasts
- [x] Form state persistence
- [x] Post confirmation screen with encouragement to help others
- [x] Error notifications (minky red patch style)
- [x] Landing page with distinct buttons ("Ask for help" / "Help others")
- [x] Notification when someone responds to your post
- [x] Deep link navigation to specific post from notification

---

## Notifications

When someone responds to your Weeping Willow post, you receive a real-time notification. See [NOTIFICATIONS.md](./NOTIFICATIONS.md) for full documentation.

### Notification Trigger

A notification is created in the `posts:addResponse` handler after a response is successfully added:

```javascript
await createNotification(context.io, {
  recipientId: post.authorId,
  type: 'weepingWillow:response',
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

### Deep Linking

When a user clicks the notification:

1. `NotificationStore.setPendingNavigation()` stores the navigation data
2. The WeepingWillow flow opens with `startAt='weepingWillow:viewPost'`
3. `initialParams` contains `{ postId: '...' }`
4. The ViewPost component loads and displays the specific post

### ViewPost Drop

The `weepingWillow:viewPost` drop is specifically designed for notification deep links:

- Displays a single post with all responses
- Shows bounty badge on first responder
- Allows responding or navigating to the full posts list
- Navigates to `weepingWillow:list` or `weepingWillow:respond`

---

## Usage Examples

### Creating a Post (Frontend)

```javascript
import WebSocketService from '@/services/websocket';
import SessionStore from '@/stores/SessionStore';

const createPost = async (content, hearts) => {
  const result = await WebSocketService.emit('weepingWillow:posts:create', {
    sessionId: SessionStore.sessionId,
    content: content.trim(),
    hearts: hearts
  });
  return result;
};
```

### Listening for Updates (Frontend)

```javascript
useEffect(() => {
  const handleNewPost = () => loadPosts();
  const handleUpdate = () => loadPosts();

  WebSocketService.socket?.on('weepingWillow:newPost', handleNewPost);
  WebSocketService.socket?.on('weepingWillow:postUpdated', handleUpdate);

  return () => {
    WebSocketService.socket?.off('weepingWillow:newPost', handleNewPost);
    WebSocketService.socket?.off('weepingWillow:postUpdated', handleUpdate);
  };
}, []);
```

### Backend Handler Pattern

```javascript
// In /backend/src/flows/weepingWillow.js
'posts:create': {
  validate: (data) => {
    if (!data.sessionId) return { valid: false, error: 'Session ID required' };
    if (!data.content?.trim()) return { valid: false, error: 'Content required' };
    if (data.content.length > 500) return { valid: false, error: 'Content too long' };
    if (!data.hearts || data.hearts < 1) return { valid: false, error: 'Hearts required' };
    return { valid: true };
  },
  handler: async (data, context) => {
    // 1. Find user account
    // 2. Verify sufficient hearts
    // 3. Deduct hearts
    // 4. Create post
    // 5. Broadcast to all clients
    // 6. Return post data
  }
}
```
