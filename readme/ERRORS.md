# Error System

This document describes the error handling architecture for Homestead.

## Overview

The error system supports two types of errors:

| Type | Behavior | Use Case |
|------|----------|----------|
| **Non-blocking** | Toast notification, auto-dismiss after 5.4s | Validation errors, minor failures |
| **Blocking** | Modal overlay, requires user dismissal | Critical failures, session issues |

## Error Flow

```
Backend returns error
        ↓
Frontend receives { success: false, error: string, blocking?: boolean }
        ↓
ErrorStore.addError(message, { blocking })
        ↓
    ┌───┴───┐
    ↓       ↓
Non-blocking    Blocking
(Toast)         (Modal)
    ↓              ↓
Auto-dismiss   User must
after 5.4s     click dismiss
```

## Visual Design

Both error types use the "minky red patch" style:

- **Background**: Red-tinted slot texture
- **Overlay**: `rgba(180, 50, 50, 0.85)`
- **Border**: Dashed/stitched, `rgba(255, 100, 100, 0.6)`
- **Text**: White with shadow
- **Sound**: Error sound plays on display

### Non-blocking (Toast Stack)

```
┌─────────────────────────────┐
│ ⚠️ Error 3 (newest)      ✕ │  ← Tap anywhere to dismiss
├─────────────────────────────┤
│ ⚠️ Error 2               ✕ │
├─────────────────────────────┤
│ ⚠️ Error 1 (oldest)      ✕ │
└─────────────────────────────┘
      [ Dismiss All (3) ]        ← Appears with 2+ errors
```

- All errors visible (no limit)
- Newest on top
- Tap anywhere on error to dismiss
- "Dismiss All" clears entire stack
- Auto-dismiss after 5.4 seconds

### Blocking (Modal)

```
    ╔═══════════════════════════╗
    ║      ⚠️ Error             ║
    ║                           ║
    ║   Error message here...   ║
    ║                           ║
    ║      [ Dismiss ]          ║
    ╚═══════════════════════════╝
```

- Centered with dimmed backdrop
- User MUST dismiss to continue
- No auto-dismiss
- Blocks all interaction

---

## Configuration

### Frontend Error Config

**File:** `/frontend/config/errors.js`

Network-related errors that can be determined client-side:

```javascript
export const ERROR_CONFIG = {
  // Network errors (frontend-determined)
  'NETWORK_OFFLINE': {
    message: 'You appear to be offline',
    blocking: true
  },
  'WEBSOCKET_DISCONNECTED': {
    message: 'Connection lost. Reconnecting...',
    blocking: false
  },
  'REQUEST_TIMEOUT': {
    message: 'Request timed out. Please try again.',
    blocking: false
  },

  // Validation errors (always non-blocking)
  'VALIDATION_ERROR': {
    blocking: false
  }
};
```

### Backend Error Response

Backend should return blocking status for server-determined errors:

```javascript
// Non-blocking (default)
{
  success: false,
  error: 'Not enough hearts'
}

// Blocking
{
  success: false,
  error: 'Session expired',
  blocking: true
}
```

### Error Categories

| Category | Blocking | Examples |
|----------|----------|----------|
| **Validation** | No | Empty content, too long, invalid input |
| **Resource** | No | Not enough hearts, post not found |
| **Network** | Depends | Offline (yes), timeout (no) |
| **Auth** | Yes | Session expired, unauthorized |
| **Critical** | Yes | Server error, data corruption |

---

## ErrorStore API

### Adding Errors

```javascript
import ErrorStore from '@/stores/ErrorStore';

// Non-blocking (default)
ErrorStore.addError('Not enough hearts');

// With options
ErrorStore.addError('Session expired', {
  blocking: true,
  duration: 0  // No auto-dismiss for blocking
});

// With custom duration
ErrorStore.addError('Saved!', {
  duration: 3000  // 3 seconds
});
```

### Error Object Structure

```javascript
{
  id: string,           // Unique ID
  message: string,      // Display message
  blocking: boolean,    // Requires dismissal?
  timestamp: number,    // When added
  duration: number      // Auto-dismiss time (0 = never)
}
```

### Methods

| Method | Description |
|--------|-------------|
| `addError(message, options?)` | Add new error |
| `removeError(id)` | Remove specific error |
| `dismissAll()` | Clear all errors |
| `hasErrors` | Boolean - any errors? |
| `hasBlockingError` | Boolean - any blocking errors? |
| `errorCount` | Number of errors |
| `blockingErrors` | Array of blocking errors |
| `nonBlockingErrors` | Array of non-blocking errors |

---

## Component Usage

### Handling WebSocket Errors

```javascript
try {
  const result = await WebSocketService.emit('weepingWillow:posts:create', data);

  if (!result.success) {
    ErrorStore.addError(result.error, {
      blocking: result.blocking
    });
    return;
  }

  // Success handling
} catch (error) {
  // Network-level error
  ErrorStore.addError('Connection failed', { blocking: false });
}
```

### Validation Errors

```javascript
// Always non-blocking
if (!content.trim()) {
  ErrorStore.addError('Please enter a message');
  return;
}

if (content.length > 500) {
  ErrorStore.addError('Message must be 500 characters or less');
  return;
}
```

---

## Sound

Error notifications play a sound effect when displayed.

**Sound file:** `/frontend/assets/sounds/error.mp3`

Sound respects user's sound settings (can be muted).

---

## Files

| File | Purpose |
|------|---------|
| `/frontend/stores/ErrorStore.js` | State management |
| `/frontend/components/ErrorContainer.js` | Renders all errors |
| `/frontend/components/ErrorNotification.js` | Non-blocking toast |
| `/frontend/components/BlockingErrorModal.js` | Blocking modal |
| `/frontend/config/errors.js` | Frontend error config |
| `/frontend/assets/sounds/error.mp3` | Error sound |

---

## Backend Integration

### Returning Errors from Flows

```javascript
// In flow handler
handler: async (data, context) => {
  if (!account) {
    return {
      success: false,
      error: 'Account not found',
      blocking: false  // Optional, defaults to false
    };
  }

  if (sessionExpired) {
    return {
      success: false,
      error: 'Session expired. Please log in again.',
      blocking: true
    };
  }

  // ...
}
```

### Error Codes (Future)

Consider adding error codes for i18n and consistent handling:

```javascript
{
  success: false,
  error: 'Not enough hearts',
  errorCode: 'INSUFFICIENT_HEARTS',
  blocking: false
}
```

---

## Accessibility

- Errors announced to screen readers via `accessibilityLiveRegion`
- Dismiss buttons have `accessibilityLabel`
- Blocking modals trap focus
- Color not sole indicator (icon + text)
