# Wishing Well

Positivity board where users share uplifting messages. Free to post, with heart tipping and inline expandable replies.

## Business Requirements

### Single-Screen Board
- All interaction happens on one screen (no multi-step navigation)
- Sort buttons at top, scrollable post list, compose box pinned at bottom
- Posts expand accordion-style (one at a time) to show full content, replies, and inline reply input

### Creating Posts
- User enters positive message (max 500 characters)
- Posts are free (no heart cost)
- Post displays under user's username
- Real-time broadcast to all connected clients

### Viewing Posts
- Sort options: Newest, Oldest, Most Hearts, Least Hearts
- Mobile: 2x2 grid of sort buttons
- Desktop: horizontal row of sort buttons
- Each collapsed post shows: author avatar, name, heart count, content preview (3 lines), time ago, response count
- Click to expand/collapse (accordion)

### Expanded Posts
- Full content (no truncation)
- Tip Hearts button (opens HeartPaymentModal)
- All responses listed with avatar, name, time ago, content
- Inline reply input with character count (max 5000)

### Tipping
- HeartPaymentModal for selecting amount and source (active/bank)
- `wishingWell:posts:tip` with sessionId, postId, amount, source

### Responding
- Inline reply input within expanded post
- Max 5000 characters
- Form state persisted via FormStore

---

## Architecture

### Data Flow

```
User Creates Post
       |
Frontend: PositivityBoard compose box
       |
WebSocket: wishingWell:posts:create
       |
Backend: Validates & saves
       |
MongoDB: WishingWellPost saved
       |
Broadcast: wishingWell:newPost
       |
All Clients: PositivityBoard refreshes
```

### Files

| Layer | File | Purpose |
|-------|------|---------|
| **Backend Model** | `/backend/src/models/WishingWellPost.js` | Mongoose schema |
| **Backend Flow** | `/backend/src/flows/wishingWell.js` | WebSocket handlers |
| **Frontend Flow** | `/frontend/flows/wishingWellFlow.js` | Navigation state machine (2 drops) |
| **Board** | `/frontend/components/drops/PositivityBoard.js` | Main single-screen board |
| **ViewPost** | `/frontend/components/drops/ViewPost.js` | Single post view (notification deep link) |
| **Wrapper** | `/frontend/components/WishingWell.js` | FlowEngine wrapper |

---

## WebSocket Events

See [WEBSOCKETS.md](./WEBSOCKETS.md) for full documentation.

### Quick Reference

| Event | Direction | Purpose |
|-------|-----------|---------|
| `wishingWell:posts:get` | Request/Response | Fetch posts with sort options |
| `wishingWell:posts:create` | Request/Response | Create new post (free) |
| `wishingWell:posts:tip` | Request/Response | Tip hearts to a post author |
| `wishingWell:posts:addResponse` | Request/Response | Add response to a post |
| `wishingWell:newPost` | Broadcast | Notifies all clients of new post |
| `wishingWell:postUpdated` | Broadcast | Notifies all clients of post update |

---

## Data Model

### WishingWellPost

```javascript
{
  content: {
    type: String,
    required: true,
    maxLength: 500
  },
  authorId: {
    type: ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: String,
  tips: [{
    tipperId: { type: ObjectId, ref: 'Account', required: true },
    amount: { type: Number, required: true },
    source: { type: String, enum: ['active', 'bank'] },
    createdAt: { type: Date, default: Date.now }
  }],
  totalTips: {
    type: Number,
    default: 0
  },
  responses: [{
    content: { type: String, required: true, maxLength: 5000 },
    responderId: { type: ObjectId, ref: 'Account', required: true },
    responderName: { type: String, required: true },
    responderAvatar: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}
```

---

## Frontend Navigation Flow

```
wishingWell:board (start)
    |
    +-- Self-contained, no outbound navigation
    |   Sort, expand/collapse, reply, tip all inline

wishingWell:viewPost (notification deep link entry)
    |
    +-- action: 'viewAll' --> wishingWell:board
    +-- action: 'respond' --> wishingWell:board
    +-- fallback -----------> wishingWell:board
```

### Drops

| Drop ID | Component | Description |
|---------|-----------|-------------|
| `wishingWell:board` | PositivityBoard | Main single-screen positivity board |
| `wishingWell:viewPost` | ViewPost | Single post view for notification deep links |

---

## Implementation Status

### Working
- [x] Single-screen positivity board (PositivityBoard)
- [x] Sort buttons (Newest, Oldest, Most Hearts, Least Hearts)
- [x] Responsive sort layout (2x2 grid mobile, horizontal row desktop)
- [x] Scrollable post list with accordion expand
- [x] Collapsed post cards (avatar, name, hearts, preview, time, response count)
- [x] Expanded post cards (full content, tip button, responses, inline reply)
- [x] Compose box pinned at bottom
- [x] Post creation (free, max 500 chars)
- [x] Heart tipping via HeartPaymentModal
- [x] Inline response submission (max 5000 chars)
- [x] Form state persistence via FormStore
- [x] Real-time updates via WebSocket broadcasts
- [x] Notification deep link support (viewPost drop)
- [x] Accessibility (FontSettingsStore scaled text)

---

## Notifications & Deep Linking

When someone responds to your Wishing Well post, you receive a notification. See [NOTIFICATIONS.md](./NOTIFICATIONS.md) for full documentation.

### Deep Linking

When a user clicks a notification:

1. `NotificationStore.setPendingNavigation()` stores the navigation data
2. The WishingWell flow opens with `startAt='wishingWell:viewPost'`
3. `initialParams` contains `{ postId: '...' }`
4. The ViewPost component loads and displays the specific post
5. Any action navigates back to `wishingWell:board`

### ViewPost Drop

The `wishingWell:viewPost` drop handles notification deep links:

- Displays a single post with all responses
- Action buttons navigate to the main board
