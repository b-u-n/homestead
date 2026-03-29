# Customization Table

The Customization Table is a Bazaar stall where users assign purchased items to replace platform assets (sprites, textures, etc.) on the map. Each user sees their own customized versions — the defaults remain for everyone else.

## Overview

Users purchase community-created art in the Bazaar's shop stalls. The Customization Table lets them apply those purchases to replace the default platform assets they see on the map. Customizations are per-user and per-asset — each platform asset can have one active replacement at a time.

## User Items (Library)

Purchases are stored in `Account.userItems`. Buying an item grants access to all approved revisions (past and future). The `ShopItem.platformAssetId` field links a shop item to a specific platform asset it can replace. Users can only apply items whose `platformAssetId` matches the target asset.

## Customization Model

Active customizations are stored on the Account:

```
Account.assetCustomizations: [{
  platformAssetId: String (required),    // Which asset is being replaced
  shopItemId: ObjectId ref ShopItem,     // Which purchased item provides the replacement
  revisionIndex: Number (required),      // Which specific revision is active
  contentUrl: String,                    // Cached URL for fast frontend loading
  itemTitle: String,                     // Cached for display
  appliedAt: Date
}]
```

One entry per `platformAssetId` (upsert — setting a new customization replaces the old one for that asset).

## Revision Locking

When a user applies a customization, they lock into a specific revision (by index). If the item creator later submits and gets a new revision approved, the user's map continues showing their selected version. They must return to the Customization Table to manually update to a newer revision.

The revision picker badges "Latest" on `currentApprovedRevisionIndex` and "Active" on the currently applied revision, making it easy to see when an update is available.

## WebSocket Events

### Purchases

| Event | Auth | Description |
|-------|------|-------------|
| `bazaar:purchases:mine` | Session | List user's purchased items. Enriches each with `platformAssetId` and `shopStatus` from ShopItem (batch query). Frontend filters by `platformAssetId`. |
| `bazaar:purchases:revisions` | Session | Get approved revisions for an owned item. Returns `{ revisions, currentApprovedRevisionIndex, title }`. Verifies ownership before returning data. |

### Customization

| Event | Auth | Description |
|-------|------|-------------|
| `bazaar:customization:set` | Session | Apply a revision to replace a platform asset. Validates ownership, revision approval status, and `platformAssetId` match. Upserts entry. Returns updated array. |
| `bazaar:customization:list` | Session | List user's active `assetCustomizations`. Called on connect to hydrate `CustomizationStore`. |
| `bazaar:customization:clear` | Session | Remove a customization for a specific `platformAssetId` (reverts to default). Returns updated array. |

All handlers follow the standard `validate`/`handler` pattern in `backend/src/flows/bazaar.js`.

## Frontend Flow

The Customization Table flow has three drops using the depth system for stacked modals:

```
Customization Table Flow (customizationTableFlow.js)
customizationTable:assetPicker (startAt — browse all platform assets)
  └─ customizationTable:itemPicker [depth 1] (pick from user's purchased items for that asset)
      └─ customizationTable:revisionPicker [depth 1] (pick a specific revision to apply)
```

### Drop Behavior

**AssetPicker (depth 0):** Grid of all platform assets from `platformAssets.js`. Category filter buttons at top. Customized assets show a "Customized" badge and the custom thumbnail alongside the original. Tapping a customized asset expands inline options: Change, Reset to Default, Cancel. Tapping an uncustomized asset goes straight to the item picker. "Reset to Default" calls `bazaar:customization:clear` directly.

**ItemPicker (depth 1):** Fetches `bazaar:purchases:mine` and filters to items matching the selected `platformAssetId`. Shows thumbnail + title + purchase date. Empty state directs users to the stalls. Tapping an item proceeds to the revision picker.

**RevisionPicker (depth 1):** Fetches `bazaar:purchases:revisions` for the selected item. Grid of approved revision thumbnails with "Latest" and "Active" badges. Tapping a revision selects it; a confirm button appears. Applying calls `bazaar:customization:set`, updates `CustomizationStore`, and navigates back to the asset picker.

## CustomizationStore (MobX)

`frontend/stores/CustomizationStore.js` — singleton MobX store loaded on WebSocket connect.

- `customizations`: Map<platformAssetId, { shopItemId, revisionIndex, contentUrl, itemTitle }>
- `getOverrideUrl(platformAssetId)` → contentUrl or null
- `hasCustomization(platformAssetId)` → boolean
- `version` counter — incremented on every change, used as a useEffect dependency in MapCanvas

Loaded via `CustomizationStore.loadFromServer()` in `frontend/services/websocket.js` after `SoundSettingsStore.loadFromServer()`.

## MapCanvas Integration

### Image Loading Override

In the entity image loading `useEffect` (MapCanvas.js), before the default image resolution logic, each entity's `platformAssetId` is checked against `CustomizationStore.getOverrideUrl()`. If a custom URL exists, it's used instead of the default image. The URL is resolved through `resolveAvatarUrl()` (which handles the backend proxy path).

If the custom image fails to load (`img.onerror`), it falls back to the entity's default image.

`CustomizationStore.version` is in the useEffect dependency array, so images reload whenever customizations change.

### Click Handler

The `customizationTable` flow string on the entity triggers `setIsCustomizationTableOpen(true)` in the click handler, following the same pattern as other flow entities (drawingBoard, mapSpritesStall, etc.).

## Platform Assets

Defined in `frontend/constants/platformAssets.js`. Each asset has:

- `id` — Unique identifier (e.g., `entity-campfire`, `bookshelf-emotions`, `texture-minky`)
- `category` — Grouping: Sprites, Bookshelves, Textures, Background Tiles, Emotes
- `name` — Display name
- `image` — Optional require() for thumbnail

Room entities reference platform assets via the `platformAssetId` field. This maps the clickable/visible entity on the map to its entry in the platform asset catalog, enabling customization.

### Currently Tagged Entities (Town Square)

| Entity ID | Platform Asset ID |
|-----------|-------------------|
| `wishing-well` | `entity-wishing-well` |
| `campfire` | `entity-campfire` |
| `grove-journal` | `entity-journal` |
| `help-wanted` | `entity-help-wanted` |
| `mailbox` | `entity-knapsack` |
| `sugarbee-cafe-door` | `entity-sugarbee-cafe` |
| `bazaar-door` | `entity-bazaar` |

More entities (library bookshelves, other rooms) can be tagged incrementally.

## Edge Cases

- **Broken custom image URL**: `img.onerror` falls back to the entity's default image
- **Superseded revision**: Customization still works (contentUrl cached on Account). Revision picker shows the version is outdated via badge comparison
- **Deleted ShopItem**: Customization renders from cached contentUrl. If the image fails, falls back to default
- **No matching purchases**: Item picker shows empty state directing users to shop stalls
- **Multiple items for same asset**: Only one customization per platformAssetId (upsert behavior)

## Key Files

| Purpose | File |
|---------|------|
| Account schema (assetCustomizations) | `/backend/src/models/Account.js` |
| Backend handlers | `/backend/src/flows/bazaar.js` |
| CustomizationStore | `/frontend/stores/CustomizationStore.js` |
| Flow definition | `/frontend/flows/customizationTableFlow.js` |
| Wrapper component | `/frontend/components/CustomizationTable.js` |
| Asset picker drop | `/frontend/components/drops/CustomizationAssetPicker.js` |
| Item picker drop | `/frontend/components/drops/CustomizationItemPicker.js` |
| Revision picker drop | `/frontend/components/drops/CustomizationRevisionPicker.js` |
| Platform asset catalog | `/frontend/constants/platformAssets.js` |
| Bazaar room (entity) | `/frontend/locations/rooms/bazaar.js` |
| MapCanvas (image override + click handler) | `/frontend/components/MapCanvas.js` |
| WebSocket (store loading) | `/frontend/services/websocket.js` |
