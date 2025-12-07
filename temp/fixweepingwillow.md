# Weeping Willow Posts - Architecture Analysis

## Architecture Overview

The app has **two distinct post systems**:
1. **Weeping Willow** - "Help Wanted" posts with paid heart bounties
2. **Wishing Well** - Free positive message posts with optional tipping

Both use WebSocket real-time communication, MongoDB persistence, and React Native frontend.

---

## What's Working

| Feature | Backend | Frontend | Method |
|---------|---------|----------|--------|
| Post creation | `weepingWillow:posts:create` flow handler | `CreateWeepingWillowPost` component | WebSocket via FlowEngine |
| Post viewing | `weepingWillow:posts:get` with filters/sorts | `PostsList` component | WebSocket request |
| Responses | `weepingWillow:posts:addResponse` | `RespondToPost` component | WebSocket + broadcast |
| Heart bounty deduction | Deducts from author on create | Heart selector (1-9) | Account model update |
| First responder reward | Awards all bounty hearts | Shows reward box | Account hearts/heartBank |
| Real-time updates | Broadcasts `newPost`/`postUpdated` | Listens in PostsList | WebSocket events |
| Form persistence | N/A | `FormStore` | localStorage/AsyncStorage |
| Tipping (Wishing Well) | `wishingWell:posts:tip` | `TippablePostsList` + modal | Heart transfer |

---

## What's Incomplete/Not Working

| Issue | Location | Notes |
|-------|----------|-------|
| **Empty migration files** | `/backend/db/migrations/` | No schema migrations defined |
| **Old unused routes file** | `/backend/src/routes/wishingWell.js` | Has hardcoded staff IDs, post approval logic - appears dead code |
| **Generic CreatePost unused** | `/frontend/components/drops/CreatePost.js` | Replaced by specific components |
| **TippablePostsList responses** | Frontend | Doesn't show response UI (only tips) |
| **No tests** | Both | No post-related test coverage |

---

## Key Data Models

### WeepingWillowPost (`/backend/src/models/WeepingWillowPost.js`)
- `content` - string, max 500 chars, required
- `hearts` - number (bounty), min 1
- `authorSessionId` - string, indexed
- `authorName` - string
- `authorAvatar` - string (optional)
- `responses[]` - embedded array of response objects
- `firstResponderSessionId` - tracks who claimed the bounty
- `createdAt` - Date, indexed

### WishingWellPost (`/backend/src/models/WishingWellPost.js`)
- Same as above but with `tips[]` array and `totalTips` sum instead of bounty

---

## Architecture Pattern

```
Frontend Component → FormStore (state) → WebSocket.emit('flowName:action')
                                              ↓
                                         FlowEngine
                                              ↓
                                    Flow Handler (validates, updates MongoDB)
                                              ↓
                                    WebSocket.broadcast (real-time update)
                                              ↓
                                    All connected clients receive update
```

---

## Key Files

### Backend
- `/backend/src/flows/weepingWillow.js` - main handlers
- `/backend/src/models/WeepingWillowPost.js` - schema
- `/backend/src/utils/FlowEngine.js` - WebSocket routing

### Frontend
- `/frontend/components/drops/PostsList.js` - viewing
- `/frontend/components/drops/CreateWeepingWillowPost.js` - creation
- `/frontend/components/drops/RespondToPost.js` - responses
- `/frontend/flows/weepingWillowFlow.js` - navigation flow

---

## Business Requirements (To Implement)

1. **Two distinct buttons**: CREATE and LIST posts
2. **Create Post**:
   - Takes heart bounties
   - Uses WebSocket to post
   - Displays under person's username
   - Internally tracks as MongoDB ObjectId
   - Only displays username to others
3. **List Page**:
   - Uses WebSockets
   - Shows all posts with filters/sorts
   - Ensure buttons are distinct on landing page

---

## Documentation To Create

1. `readme/WEEPING_WILLOW.md` - Full feature documentation
2. `readme/WEBSOCKETS.md` - WebSocket implementation overview with:
   - Platform-wide overview
   - Each endpoint with data payloads
   - Triggers and events
   - Weeping Willow specific setup
3. `readme/TESTING.md` - Testing configurations
