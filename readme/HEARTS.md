# Hearts System

## Overview

Hearts are the currency used for posting and responding in features like Weeping Willow. Users have:
- **Active Hearts** (0-9): Available for spending
- **Heart Bank** (unlimited): Overflow storage

## Current Issues (as of analysis)

### Issue 1: Backend doesn't return updated heart count

When hearts are spent or earned, the backend doesn't include the updated heart count in responses:

**`weepingWillow:posts:create`** (backend/src/flows/weepingWillow.js:125-129):
```javascript
return {
  success: true,
  message: 'Your request has been posted!',
  data: post  // Missing: hearts, heartBank
};
```

**`weepingWillow:posts:addResponse`** (backend/src/flows/weepingWillow.js:209-218):
```javascript
return {
  success: true,
  message: heartsAwarded > 0 ? `...` : 'Response added!',
  data: {
    post,
    heartsAwarded  // Missing: hearts, heartBank
  }
};
```

### Issue 2: Frontend doesn't update ProfileStore after transactions

**`CreateWeepingWillowPost.js`** and **`RespondToPost.js`** don't call `profileStore.setHearts()` or `profileStore.updateHearts()` after successful operations.

### Issue 3: WebSocket emit() pattern mismatch

The `WebSocketService.emit()` method (frontend/services/websocket.js:52-67):
- On success: resolves with `response.data` (not the full response)
- On failure: rejects with an Error

But frontend components check `if (result.success)` which is incorrect since `result` is `response.data`, not the full response. The success case should just proceed without checking `.success`.

### Issue 4: Heart selector shows all 9 hearts regardless of availability

In `CreateWeepingWillowPost.js`, the heart selector always renders 9 hearts. Unavailable hearts are dimmed but still shown, which can be confusing.

## Data Flow

### Current Flow (broken)

```
User Profile Load:
  1. Frontend calls WebSocketService.emit('user:get', { sessionId })
  2. Backend queries Account, returns { hearts: account.hearts, ... }
  3. Frontend stores in ProfileStore.hearts
  4. UserStatus.js displays profileStore.heartsArray

Post Creation:
  1. User selects hearts from FormStore (can exceed available!)
  2. Frontend validates against profileStore.hearts (might be stale)
  3. Backend validates against account.hearts (authoritative)
  4. Backend deducts hearts, saves account
  5. Backend returns { success, data: post } -- NO hearts count
  6. Frontend doesn't update ProfileStore
  7. UI still shows old heart count until page refresh
```

### Recommended Flow

```
Post Creation:
  1. Frontend validates against profileStore.hearts
  2. Backend validates against account.hearts (authoritative)
  3. Backend deducts hearts, saves account
  4. Backend returns { success, data: { post, hearts, heartBank } }
  5. Frontend updates ProfileStore with new counts
  6. UI immediately reflects change

Response with Hearts Award:
  1. Backend awards hearts to responder
  2. Backend returns { success, data: { post, heartsAwarded, hearts, heartBank } }
  3. Frontend updates ProfileStore
  4. UI immediately reflects change
```

## Recommended Fixes

### Fix 1: Backend returns updated heart counts

In all handlers that modify hearts, include the updated counts:

```javascript
// weepingWillow:posts:create
return {
  success: true,
  message: 'Your request has been posted!',
  data: {
    post,
    hearts: account.hearts,
    heartBank: account.heartBank
  }
};

// weepingWillow:posts:addResponse
return {
  success: true,
  message: heartsAwarded > 0 ? `...` : 'Response added!',
  data: {
    post,
    heartsAwarded,
    hearts: responder.hearts,
    heartBank: responder.heartBank
  }
};
```

### Fix 2: Frontend updates ProfileStore after transactions

```javascript
// CreateWeepingWillowPost.js
try {
  const result = await WebSocketService.emit(`${flowName}:posts:create`, payload);

  // Update hearts from response
  if (result.hearts !== undefined) {
    profileStore.setHearts(result.hearts);
  }
  if (result.heartBank !== undefined) {
    profileStore.setHeartBank(result.heartBank);
  }

  FormStore.resetForm('createPost');
  onComplete({ action: 'submitted' });
} catch (error) {
  ErrorStore.addError(error.message || 'Connection error');
}
```

### Fix 3: Remove incorrect success checks

Since `emit()` throws on failure, success is implied:

```javascript
// WRONG
const result = await WebSocketService.emit(...);
if (result.success) { ... }

// RIGHT
try {
  const result = await WebSocketService.emit(...);
  // Success - result is response.data
  ...
} catch (error) {
  // Failure
  ...
}
```

### Fix 4: Optimistic UI updates (optional enhancement)

For better UX, update ProfileStore optimistically before the request:

```javascript
// Optimistic deduct
const previousHearts = profileStore.hearts;
profileStore.updateHearts(-hearts);

try {
  const result = await WebSocketService.emit(...);
  // Confirm with server value
  profileStore.setHearts(result.hearts);
} catch (error) {
  // Rollback on failure
  profileStore.setHearts(previousHearts);
  ErrorStore.addError(error.message);
}
```

## Files to Modify

1. **backend/src/flows/weepingWillow.js** - Return hearts/heartBank in responses
2. **frontend/components/drops/CreateWeepingWillowPost.js** - Update ProfileStore, fix success check
3. **frontend/components/drops/RespondToPost.js** - Update ProfileStore, fix success check
4. **frontend/components/drops/CreatePost.js** - Same fixes if used elsewhere

## Testing

After fixes, verify:
1. Create post with 3 hearts -> UI shows 6 hearts remaining immediately
2. Respond to post as first responder -> UI shows hearts added immediately
3. Refresh page -> Hearts match what UI showed
4. Try to spend more hearts than available -> Error message with correct count
