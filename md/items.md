# Unified Item System

All user items live in the `Account.userItems` array. This includes shop purchases, player-created items, and game rewards.

## Item Types (storeType)

| storeType | Portable | Source | Description |
|-----------|----------|--------|-------------|
| `map-sprite` | No | Bazaar shop | Decorative map sprites |
| `toy` | Yes | Bazaar shop (future) | Collectible toys |
| `emoji` | Yes | Bazaar shop (future) | Custom emojis |
| `decoration` | No | Bazaar shop (future) | UI decorations |
| `avvie` | No | Bazaar shop (future) | Custom avatars |
| `spell` | Yes | Bazaar shop (future) | Avatar prompts/spells |
| `sketch` | Yes | Knapsack / Pixel Pals | Player-created pixel art |

## Portability

"Portable" items show in the knapsack. Non-portable items show in the Customization Table.

Computed from `storeType`, not stored:

```js
// backend/src/utils/itemHelpers.js
const PORTABLE_TYPES = ['sketch', 'toy', 'emoji', 'spell'];
function isPortable(storeType) {
  return PORTABLE_TYPES.includes(storeType);
}
```

Frontend mirrors this in `frontend/stores/InventoryStore.js`.

## userItems Schema

```js
Account.userItems: [{
  shopItemId: ObjectId,      // Ref to ShopItem (null for non-shop items)
  title: String,
  storeType: String,         // Item type (see table above)
  subtype: String,           // e.g., 'plushie' for toys
  mediaType: String,         // 'image', 'text', 'video', 'prompt'
  contentUrl: String,        // Image URL (for shop items or generated PNGs)
  textContent: String,       // For text/prompt media types
  tags: [String],
  data: Mixed,               // Flexible payload (pixel data for sketches)
  purchasedAt: Date,
  updatedAt: Date
}]
```

## Knapsack

The knapsack shows portable items. Server-backed via `backend/src/flows/knapsack.js`.

### WebSocket Events

| Event | Purpose |
|-------|---------|
| `knapsack:items:list` | Get portable items (filters by `isPortable`) |
| `knapsack:items:all` | Get ALL userItems |
| `knapsack:items:create` | Create new item (e.g., blank sketch with `storeType: 'sketch'`) |
| `knapsack:items:update` | Update item data. Auto-generates PNG for sketches via `sharp`. |
| `knapsack:items:remove` | Delete a portable item |
| `knapsack:items:submitToShop` | Submit sketch to Bazaar shop with visibility choice |

### Pixel Sketches

Sketches store pixel data in `data`:
```js
data: { width: 32, height: 32, pixels: [null, '#FF0000', ...] }
```

When saved via `knapsack:items:update`, a lossless PNG is auto-generated server-side and stored as `contentUrl`.

## Private Items

`ShopItem.visibility`: `'public'` (default) or `'private'`.

- Private items go through moderation (content safety)
- Only visible to the owner in the shop listing
- Cannot be purchased by other users
- Acts as a personal gallery

## Sketch → Shop Pipeline

1. Player creates sketch in knapsack or completes a Pixel Pals board
2. Calls `knapsack:items:submitToShop` with `visibility` ('public' or 'private')
3. PNG generated from pixel data via `pixelImageService`
4. `ShopItem` created with pending revision
5. `ModerationQueue` entry created
6. After approval: visible in shop (public) or personal gallery (private)

## Game Board → Shop Pipeline

1. Board auto-completes when every pixel is filled
2. PNG generated, `ShopItem` created with `sourceBoard` reference and `participantIds`
3. Enters moderation queue
4. After approval: contributors buy at 3 hearts, others at normal `getPrice()` pricing

## Key Files

| Component | Path |
|-----------|------|
| Account model (userItems) | `backend/src/models/Account.js` |
| ShopItem model (visibility, sourceBoard, participantIds) | `backend/src/models/ShopItem.js` |
| Item portability helper | `backend/src/utils/itemHelpers.js` |
| Knapsack backend flow | `backend/src/flows/knapsack.js` |
| PNG generation | `backend/src/services/pixelImageService.js` |
| InventoryStore | `frontend/stores/InventoryStore.js` |
| InventoryScreen | `frontend/screens/InventoryScreen.js` |
| Sketch editor drop | `frontend/components/drops/PixelSketchEditor.js` |
| Sketch flow | `frontend/flows/pixelSketchFlow.js` |
