# Feature Level System

Progressive feature access based on a numeric level on each account. Features that require a level above the player's are **invisible** (not locked or grayed out - they simply don't exist in the UI).

## How It Works

1. Each account has a `featureLevel` (Number, default 0)
2. Features are defined in `backend/src/config/featureLevels.js` mapping feature IDs to required levels
3. Backend checks access via `hasFeature(account, featureId)` from `backend/src/utils/featureAccess.js`
4. Frontend checks access via `FeatureStore.has(featureId)` (MobX store loaded on connect)

## Feature Level Config

```javascript
// backend/src/config/featureLevels.js
module.exports = {
  'pixelPals:size:16x16': 0,    // everyone
  'pixelPals:size:32x32': 0,    // everyone
  'pixelPals:size:48x48': 1,    // level 1+
  'pixelPals:size:custom': 3,   // level 3+
};
```

## Adding a New Gated Feature

1. Add the feature ID and required level to `backend/src/config/featureLevels.js`
2. In backend handlers: `if (!hasFeature(account, 'myFeature:id')) return { success: false, error: '...' }`
3. In frontend components: `if (!FeatureStore.has('myFeature:id')) return null` (or don't render the option)

## Setting a Player's Level

Currently admin-only via WebSocket:

```javascript
// Admin calls this event
WebSocketService.emit('features:setLevel', {
  sessionId: adminSessionId,
  targetAccountId: 'player-account-id',
  level: 1
});
```

Or directly via the helper function in backend code:

```javascript
const { setFeatureLevel } = require('./utils/featureAccess');
await setFeatureLevel(accountId, 3);
```

## WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `features:mine` | Client → Server | Get list of feature IDs the player has access to |
| `features:setLevel` | Client → Server | Admin-only: set a player's feature level |

## Frontend Usage

```jsx
import FeatureStore from '../stores/FeatureStore';
import { observer } from 'mobx-react-lite';

const MyComponent = observer(() => {
  return (
    <View>
      {FeatureStore.has('pixelPals:size:48x48') && (
        <Button>48x48 Board</Button>
      )}
    </View>
  );
});
```

## Integration Notes

- Feature levels will integrate with payment systems later
- The `setFeatureLevel` function is the single point of control
- Level 0 is the default (free tier) - all base features should require level 0
- Keep the feature config flat (no nesting) for simplicity
- Feature IDs use colon-separated namespacing: `{area}:{category}:{item}`

## Key Files

- Config: `backend/src/config/featureLevels.js`
- Helpers: `backend/src/utils/featureAccess.js`
- Backend flow: `backend/src/flows/features.js`
- Frontend store: `frontend/stores/FeatureStore.js`
- Account field: `Account.featureLevel` in `backend/src/models/Account.js`
