# Layers System

Layers are parallel instances of the game world that allow players to be grouped separately. Players on different layers cannot see or interact with each other, even when in the same room location.

## Overview

- **Purpose**: Reduce crowding, create themed communities, or provide quiet spaces
- **Visibility**: Players only see others on their same layer
- **Persistence**: Layer selection is saved per account and persisted in localStorage
- **Default**: New users are prompted to select a layer; "Hopeful" is the default

## Initial Layers

| Layer Name | Description | Default |
|------------|-------------|---------|
| Hopeful | A bright and optimistic layer for positive vibes | Yes |
| Quiet | A peaceful layer for those who prefer solitude | No |

## Architecture

### Database Model

**Location**: `/backend/src/models/Layer.js`

```javascript
{
  name: String,          // Unique layer name
  description: String,   // Layer description
  order: Number,         // Display order in selection UI
  isDefault: Boolean,    // Whether this is the default layer
  isActive: Boolean,     // Whether layer is joinable
  maxPlayers: Number,    // Max capacity (0 = unlimited)
  createdBy: ObjectId,   // Admin who created it
  createdAt: Date,
  updatedAt: Date
}
```

### Account Model Updates

**Location**: `/backend/src/models/Account.js`

Added fields:
- `permissions: ['admin', 'moderator', 'creator']` - Role-based access
- `currentLayer: ObjectId` - Reference to current layer

## API Endpoints

### WebSocket Events

| Event | Direction | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `layers:list` | Client → Server | List all active layers with player counts | No |
| `layers:join` | Client → Server | Join a specific layer | Yes |
| `layers:leave` | Client → Server | Leave current layer | Yes |
| `layers:current` | Client → Server | Get current layer info | Yes |
| `layers:create` | Client → Server | Create new layer | Yes (Admin) |

### Request/Response Examples

#### layers:list
```javascript
// Request
socket.emit('layers:list', {}, callback);

// Response
{
  success: true,
  layers: [
    {
      _id: "...",
      name: "Hopeful",
      description: "A bright and optimistic layer",
      playerCount: 12,
      isDefault: true
    }
  ]
}
```

#### layers:join
```javascript
// Request
socket.emit('layers:join', { layerId: "..." }, callback);

// Response
{
  success: true,
  layer: { /* layer object with playerCount */ }
}
```

#### layers:create (Admin only)
```javascript
// Request
socket.emit('layers:create', {
  name: "New Layer",
  description: "Description here",
  order: 3,
  isDefault: false,
  maxPlayers: 50
}, callback);

// Response
{
  success: true,
  layer: { /* created layer */ }
}
```

## Impact on Systems

### Map/Movement System

**File**: `/backend/src/routes/map.js`

All map events now include layer filtering:

- `map:move` - Only broadcast to players on same layer
- `map:emote` - Only broadcast to players on same layer
- `map:enter` - Only send existing players list from same layer, only broadcast to same layer
- `map:leave` - Only broadcast to players on same layer
- `disconnect` - Clean up for all rooms, broadcast leave to same layer

The `broadcastToRoom()` function was updated to accept a `senderLayerId` parameter:

```javascript
function broadcastToRoom(io, roomId, event, data, excludeSocketId = null, senderLayerId = null) {
  // Only send to players on same layer
  const targetLayerId = targetSocket.layerId || null;
  if (senderLayerId === null || targetLayerId === null || senderLayerId === targetLayerId) {
    targetSocket.emit(event, data);
  }
}
```

### Player Data Storage

Each player's data in `roomPlayers` now includes `layerId`:

```javascript
roomPlayers.get(roomId).set(socket.id, {
  x, y, avatarUrl, avatarColor, username, layerId
});
```

### Sound System

**No direct impact** - Sounds are client-side only. Each player hears sounds based on their local state (entering rooms, entity proximity, etc.). Layer changes don't affect sound playback.

However, if a sound were to be triggered by another player's action (e.g., hearing someone else's footsteps), those events would only be received from players on the same layer.

### WebSocket Service

**File**: `/frontend/services/websocket.js`

Added methods:
- `listLayers()` - Get all layers with player counts
- `joinLayer(layerId)` - Join a layer
- `leaveLayer()` - Leave current layer
- `getCurrentLayer()` - Get current layer info
- `createLayer(data)` - Create new layer (admin)

### State Management

**File**: `/frontend/stores/LayerStore.js`

MobX store for layer state:
- `currentLayer` - Current layer object
- `layers` - List of available layers
- `hasSelectedLayer` - Whether user has selected a layer this session
- Persistence to localStorage

## UI Components

### LayerSelectModal

**File**: `/frontend/components/LayerSelectModal.js`

Modal shown before map loads:
- Lists all layers with player counts
- Pre-selects default or previously selected layer
- Wool button styling for each layer option

### HamburgerMenu

**File**: `/frontend/components/HamburgerMenu.js`

Replaced the logout button with a hamburger menu:
- Shows current layer name
- "Switch Layers" button opens LayerSelectModal
- "Logout" button for authenticated users

### Map Layout

**File**: `/frontend/app/homestead/explore/map/_layout.tsx`

Updated to:
1. Wait for WebSocket connection
2. Check if user has selected a layer
3. Show LayerSelectModal if no layer selected
4. Only render map routes after layer is selected

## Permissions System

**File**: `/backend/src/middleware/permissions.js`

Utility functions:
- `hasPermission(account, permission)` - Check if account has permission
- `isAdmin(account)` - Check for admin role
- `isModerator(account)` - Check for moderator or higher
- `isCreator(account)` - Check for creator or higher
- `requirePermission(permission)` - WebSocket middleware
- `requirePermissionREST(permission)` - REST middleware

Currently, only `layers:create` requires admin permission.

## Seeding Initial Layers

Run the seed script to create initial layers:

```bash
cd backend
node src/seeds/layers.js
```

This creates "Hopeful" (default) and "Quiet" layers.

## Flow Diagram

```
User enters /homestead/explore/map
        ↓
   Connect WebSocket
        ↓
   Check LayerStore.hasSelectedLayer?
        ↓
    No → Show LayerSelectModal
        ↓
   User selects layer
        ↓
   socket.emit('layers:join')
        ↓
   LayerStore.setCurrentLayer()
        ↓
   socket.layerId set on server
        ↓
   Render map (MapCanvas)
        ↓
   map:enter includes layerId
        ↓
   Only see players on same layer
```

## Adding New Layers

1. **Via Seed Script**: Add to `/backend/src/seeds/layers.js`
2. **Via Admin API**: Use `layers:create` event with admin account
3. **Via Database**: Insert directly into `layers` collection

## Future Considerations

- Layer-specific chat channels
- Layer capacity warnings
- Admin ability to move players between layers
- Layer-specific events or decorations
- Temporary/event layers with expiration
