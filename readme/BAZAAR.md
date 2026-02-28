# Bazaar

The Bazaar is a multi-stall shop and contributor submission system. Contributors submit content through the Drawing Board, which goes through moderator review before being listed in a shop stall. Items are purchased with hearts. Admins can separately approve items for platform use.

## Stall Types

Items are tagged with a `storeType` that determines which stall they appear in.

| Stall | Status | Description |
|-------|--------|-------------|
| `map-sprite` | Active | Decorative items for the game world |
| `toy` | Future | Collectible toys (subtypes: plushie, etc.) |
| `emoji` | Future | Custom emojis |
| `decoration` | Future | UI decorations |
| `avvie` | Future | Custom avatars |
| `spell` | Future | Prompts applied to a user's avatar |

## Media Types

| mediaType | Content | Used By |
|-----------|---------|---------|
| `image` | PNG/JPG uploaded as base64 | map-sprite, toy, emoji, decoration, avvie |
| `text` | Text content | emoji (text-based), decoration |
| `video` | Video files as base64 (future) | decoration, toy |
| `prompt` | Text prompt (applied to avvie) | spell |

Phase 1 implements **image** uploads. The schema supports all types from day one.

## Core Workflow

1. Contributor opens Drawing Board → reads intro explaining the process
2. Browses **platform asset catalog** to propose updates, or submits new art
3. Selects which **stall** the item should go to (map-sprite for now)
4. Uploads content + fills title/description
5. **Moderator reviews** the revision — approves or returns it
6. On approval, item is **listed in the selected stall** for purchase with hearts
7. Items not approved for platform use remain in shop as **map sprites** (the failsafe)
8. **Anyone can comment**; comments go through mod review queue
9. Contributors can **submit revisions** — shop shows last approved revision until new one is approved
10. If a **pending revision already exists** when re-submitting, the pending review is cancelled (status → `superseded`) and replaced with the new revision
11. Revisions to **platform-approved** items → **sent directly to admin review** (not mod queue)
12. **Mods can request platform approval** for items they think deserve it
13. **Admin can approve** any item for platform use, then manually submits a PR
14. **Owner notified** on purchases, approvals, comments

### Key Safety Rule

Shop always displays the **last mod-approved revision**. New unreviewed revisions never replace displayed content.

## Pricing

All items start at **9 hearts**. Price increases with `purchaseCount`:

| Tier | Every N purchases | +1 heart | Max at tier end |
|------|-------------------|----------|-----------------|
| 1 | Every 5 | +1 | 18 (after 45 purchases) |
| 2 | Every 15 | +1 | 24 (after 135 total) |
| 3 | Every 40 | +1 | 32 (after 455 total) |
| 4 | Every 90 | +1 | 34 (after 635 total) |
| 5 | After 4000 more | — | 36 (after 4635 total) |

```javascript
function getPrice(purchaseCount) {
  if (purchaseCount < 45) return 9 + Math.floor(purchaseCount / 5);
  if (purchaseCount < 135) return 18 + Math.floor((purchaseCount - 45) / 15);
  if (purchaseCount < 455) return 24 + Math.floor((purchaseCount - 135) / 40);
  if (purchaseCount < 635) return 32 + Math.floor((purchaseCount - 455) / 90);
  if (purchaseCount < 4635) return 34;
  return 36;
}
```

## Models

### ShopItem

```
{
  title: String (required, max 100),
  description: String (max 2000),
  storeType: String (required, enum: map-sprite, toy, emoji, decoration, avvie, spell),
  subtype: String (optional — e.g. 'plushie' for toys),
  mediaType: String (required, enum: image, text, video, prompt) default 'image',
  tags: [String],
  platformAssetId: String (null if new art, else ID from platform asset catalog),
  intendedPlatformUse: String (enum: texture, icon, illustration, ui-element, background, other, null),
  user: userSchema (id, name, avatar, color),

  revisions: [{
    contentUrl: String (for image/video — GCS URL),
    textContent: String (for text/prompt media types),
    note: String (max 1000),
    status: String (enum: pending, approved, returned, superseded) default 'pending',
    reviewedBy: userSchema,
    reviewNote: String (max 1000),
    reviewedAt: Date,
    createdAt: Date
  }],
  currentApprovedRevisionIndex: Number (default null),

  shopStatus: String (enum: not-listed, in-shop) default 'not-listed',
  platformStatus: String (enum: none, pending-platform-approval, approved-for-platform) default 'none',
  platformApprovedBy: userSchema,

  purchaseCount: Number (default 0),
  purchasedBy: [{ user: userSchema, purchasedAt: Date }],
  comments: [{ content: String (max 5000), user: userSchema, visible: Boolean (default false), createdAt: Date }],

  createdAt: Date,
  updatedAt: Date
}
```

### ModerationQueue

Shared queue for all moderated content across the platform.

```
{
  contentType: String (enum: bazaar-revision, bazaar-comment),
  itemType: String (the storeType — e.g. 'map-sprite', 'emoji'),
  contentId: ObjectId (the ShopItem ID),
  revisionIndex: Number (for bazaar-revision),
  commentIndex: Number (for bazaar-comment),
  referenceTitle: String (quick display without lookup),
  submittedBy: userSchema,
  status: String (enum: pending, approved, returned, flagged-for-admin, superseded),
  priority: String (enum: normal, escalated) default 'normal',
  reviewedBy: userSchema,
  reviewNote: String (max 1000),
  flaggedBy: [{ user: userSchema, reason: String, createdAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### ModerationAction

Audit log of all mod/admin actions.

```
{
  actor: userSchema,
  actionType: String (enum: approve-revision, return-revision, flag-for-admin,
                       approve-comment, return-comment,
                       request-platform-approval,
                       approve-for-platform, return-for-platform),
  contentType: String,
  contentId: ObjectId,
  revisionIndex: Number,
  note: String (max 1000),
  createdAt: Date
}
```

### Account.userItems (added to Account model)

```
userItems: [{
  shopItemId: ObjectId,
  title: String,
  storeType: String,
  subtype: String,
  mediaType: String,
  contentUrl: String,
  textContent: String,
  tags: [String],
  purchasedAt: Date
}]
```

## WebSocket Events

### Bazaar Flow (`bazaar:*`)

| Event | Auth | Description |
|-------|------|-------------|
| `bazaar:shop:list` | Any | List in-shop items filtered by `storeType`. Returns approved revision content, computed price. |
| `bazaar:submission:get` | Any | Get single item with all revisions, comments, computed price |
| `bazaar:submission:create` | Session | Create ShopItem with revision[0], add ModerationQueue entry |
| `bazaar:submissions:mine` | Session | List current user's submissions |
| `bazaar:submission:comment` | Session | Add comment, add ModerationQueue entry |
| `bazaar:submission:revise` | Session (owner) | New revision. Supersedes pending revision if exists. Platform-approved items go to admin queue. |
| `bazaar:submission:purchase` | Session | Compute price, deduct hearts, add to purchasedBy + buyer's userItems, notify owner |
| `bazaar:assets:list` | Any | Return platform asset catalog |

Broadcasts: `bazaar:newSubmission`, `bazaar:submissionUpdated`, `bazaar:newPurchase`

### Moderation Flow (`moderation:*`)

| Event | Auth | Description |
|-------|------|-------------|
| `moderation:queue:list` | Mod+ | List queue items filtered by contentType, itemType, status |
| `moderation:queue:get` | Mod+ | Get single queue item with full content |
| `moderation:revision:approve` | Mod+ | Approve revision, update shop listing, notify owner |
| `moderation:revision:return` | Mod+ | Return revision with note, notify owner |
| `moderation:comment:approve` | Mod+ | Mark comment visible |
| `moderation:comment:return` | Mod+ | Remove comment |
| `moderation:item:flag` | Mod+ | Flag for admin review |
| `moderation:item:requestPlatformApproval` | Mod+ | Request platform approval, notify admins |
| `moderation:actions:list` | Mod+ | List recent ModerationAction entries |

Broadcasts: `moderation:queueUpdated`

### Admin Flow (`admin:*`)

| Event | Auth | Description |
|-------|------|-------------|
| `admin:queue:list` | Admin | List items by category |
| `admin:actions:list` | Admin | Full mod action audit log |
| `admin:submission:approveForPlatform` | Admin | Approve for platform use |
| `admin:submission:returnForPlatform` | Admin | Return for platform with note |
| `admin:escalated:list` | Admin | List escalated items (revisions to platform-approved art) |
| `admin:escalated:approveRevision` | Admin | Approve escalated revision |
| `admin:escalated:returnRevision` | Admin | Return escalated revision |

Broadcasts: `admin:queueUpdated`

## Notifications

| Trigger | Recipient | Type |
|---------|-----------|------|
| Revision approved | Item owner | `bazaar:revisionApproved` |
| Revision returned | Item owner | `bazaar:revisionReturned` |
| Comment added | Item owner | `bazaar:comment` |
| Item purchased | Item owner | `bazaar:purchase` |
| Approved for platform | Item owner | `bazaar:platformApproved` |
| Returned for platform | Item owner | `bazaar:platformReturned` |
| Revision on platform-approved art | All admins | `bazaar:escalatedToAdmin` |
| New queue item | Moderators | `moderation:newItem` |
| New escalation | Admins | `admin:newEscalation` |

## TODO

- [ ] Fix moderation and admin permissions for production — currently dev mode grants all permissions via `middleware/permissions.js` (`isDev` flag). Need to assign real `moderator`/`admin` permissions to accounts before deploying.

## File Storage

Images are uploaded to **Google Cloud Storage** (bucket: `GCS_BUCKET_NAME` env var, uniform bucket-level access). Credentials at `backend/config/gcs-credentials.json` (gitignored).

Filenames follow the pattern:

```
bazaar_{userId}_{timestamp}_{randomHex}.{ext}
```

- Max 5MB for images
- Files are **not** public — served through backend proxy at `/api/bazaar-content/:filename`
- `saveImage()` returns a relative path like `/api/bazaar-content/bazaar_xxx.png`
- `resolveAvatarUrl()` on the frontend also rewrites old GCS public URLs through the proxy

## Frontend Flow Structure

The bazaar uses separate flows triggered by individual map entities in the bazaar room.

### Drawing Board Flow (`drawingBoardFlow.js`)
```
drawingBoard:intro (startAt — intro explaining the process)
  ├─ drawingBoard:assetCatalog (browse platform assets)
  │   └─ drawingBoard:submit (upload form, pre-filled with asset)
  ├─ drawingBoard:submit (upload form for new art)
  │   └─ drawingBoard:assetPicker [depth 1] (select asset to replace → returns to submit)
  ├─ drawingBoard:mySubmissions (own submissions + statuses)
  │   └─ drawingBoard:submissionDetail [depth 1] (details/revisions/comments/revise)
  └─ drawingBoard:styleGuide (art reference)
```

### Map Sprites Stall Flow (`mapSpritesStallFlow.js`)
```
mapSpritesStall:shop (startAt — item listing)
  └─ mapSpritesStall:itemDetail [depth 1] (view/buy/comment)
```

Each flow is opened by its own entity in the bazaar room and rendered in its own FlowEngine modal. Titles and back buttons are handled by FlowEngine — drops should not render their own headers.

## Key Files

| Purpose | File |
|---------|------|
| ShopItem model | `/backend/src/models/ShopItem.js` |
| ModerationQueue model | `/backend/src/models/ModerationQueue.js` |
| ModerationAction model | `/backend/src/models/ModerationAction.js` |
| Bazaar backend flow | `/backend/src/flows/bazaar.js` |
| Moderation backend flow | `/backend/src/flows/moderation.js` |
| Admin backend flow | `/backend/src/flows/admin.js` |
| GCS upload service | `/backend/src/services/shopContentService.js` |
| Pricing utility | `/backend/src/utils/bazaarPricing.js` |
| Drawing Board frontend flow | `/frontend/flows/drawingBoardFlow.js` |
| Map Sprites Stall frontend flow | `/frontend/flows/mapSpritesStallFlow.js` |
| Drawing Board wrapper | `/frontend/components/DrawingBoard.js` |
| Map Sprites Stall wrapper | `/frontend/components/MapSpritesStall.js` |
| Moderation frontend flow | `/frontend/flows/moderationFlow.js` |
| Admin frontend flow | `/frontend/flows/adminFlow.js` |
| Platform asset catalog | `/frontend/constants/platformAssets.js` |
| Bazaar room | `/frontend/locations/rooms/bazaar.js` |
| Art style guide | `/readme/ART_STYLE.md` |
