# Pixel Pals

Collaborative pixel art game in the Games Parlor. Players create boards and contribute pixels according to game mode rules. The flow opens fullscreen (`size: 'fullscreen'` on the flow definition).

## Game Modes

### Free Mode
Unlimited drawing with no restrictions. Personal boards only.

- No pixel budget, no cooldowns, no turn order
- Only available when `boardType: 'personal'`
- Backend sets `pixelsRemaining` to 99999999
- Skips all eligibility checks and credit tracking entirely

### Chain Mode
Turn-based drawing. Players take turns in order.

- `chainOrder` array tracks player sequence (join order)
- `currentChainIndex` points to whose turn it is
- Only the current player can draw; others see "Waiting for [name]"
- After drawing, index advances to next player (wraps around)
- Budget: `pixelsPerTurn` per turn

### Daily Drop
Time-based pixel budget. Everyone gets pixels on a schedule.

- `dropInterval`: `'hourly'`, `'daily'`, or `'weekly'`
- Budget refreshes automatically when the interval elapses
- Tracked via `PixelPalsPlayer.boardStates[].lastBudgetRefresh`
- Budget: `pixelsPerTurn` per refresh

### Live Canvas
Free-for-all with cooldown between draws.

- `liveCooldownSeconds`: 30-600 seconds between draw actions
- Pixels refresh every action (no cumulative budget)
- Tracked via `PixelPalsPlayer.boardStates[].lastDrawTime`
- Budget: `pixelsPerTurn` per action

## Board Types

- **Shared** (default): Anyone can draw according to game mode rules
- **Personal**: Only the creator can draw. Others cannot see personal boards in the listing.

Personal boards are filtered out of `pixelPals:boards:list` for non-owners (both backend and frontend).

## Board Sizes

Gated by feature level (see `md/FEATURES.md`):

| Size | Feature Level |
|------|--------------|
| 16x16 | 0 (everyone) |
| 32x32 | 0 (default) |
| 48x48 | 1 |
| Custom (8-64) | 3 |

## Pixels Per Turn

The creator picks from three options computed from board size:
- **1/8** of total pixels (e.g., 128 for 32x32)
- **1/4** of total pixels (e.g., 256 for 32x32)
- **1/2** of total pixels (e.g., 512 for 32x32)

Default is 1/8. Options scale dynamically with the selected board size. Hidden in free mode.

There is no backend max cap on `pixelsPerTurn`.

## Credit System

Drawing costs credits, but repainting an already-painted pixel in the same cycle is free.

- `touchedPixels` on `PixelPalsPlayer.boardStates[]` tracks which `"x,y"` positions have been painted this credit cycle
- Only new positions cost credits; repaints cost 0
- Each contribution records `creditsCost` (actual credits consumed) and `newPositions` (which positions were new)
- **Undo** refunds exactly `creditsCost` from the last contribution and removes `newPositions` from `touchedPixels`
- Free mode skips all credit tracking entirely (`creditCost` always 0, `touchedPixels` not updated)

## Board Completion

Boards complete **automatically** when every pixel is filled (`board.pixels.every(p => p !== null)`). There is no manual complete action.

When the last pixel is placed:
1. PNG generated server-side via `sharp` (`pixelImageService.savePixelArtPNG`)
2. Board status set to `'completed'`, `imageUrl` stored
3. `ShopItem` created with PNG revision (`status: 'pending'`), `sourceBoard` reference, `participantIds`
4. `ModerationQueue` entry created
5. Contributors notified via `createNotification`
6. Draw response includes `autoCompleted: true`
7. After mod approval, item appears in the Bazaar shop

## Purchasing Completed Boards

- Normal pricing via `getPrice(purchaseCount)` (starts at 9 hearts)
- **Participant discount**: Contributors pay only 3 hearts
- `ShopItem.participantIds` tracks contributors
- `ShopItem.sourceBoard` links back to the `PixelBoard`

## UI Layout

Three layout modes detected automatically. Mode detection uses `uxStore.isPortrait` (MobX observable, set via resize listener in MapCanvas) for immediate correctness, and `containerSize` (from `onLayout`) for sizing calculations.

### Orientation Change Handling

`containerSize` is initialized to `null`. On first render (and after each orientation change), the component renders an empty `<View onLayout={...} />` until a real measurement arrives. When `isPortraitMode` changes (detected synchronously during render via a ref comparison), `containerSize` resets to `null`, forcing re-measurement before the new layout renders. This prevents a frame of stale dimensions from the previous orientation.

### Desktop
- **Left panel** (~1/6 width): tool buttons (Draw/Paint/Pick/Erase/Undo) with SVG icons, pixel budget, current color swatch, 12 color wheels in 4x3 grid, mini bitmap preview, save button
- **Grid area** (~5/6 width): pixel grid sized to `min(fitWidth, fitHeight)` so it always fits on screen
- Color wheel popup overlay positioned over the clicked pixel (`position: absolute` inside grid container)
- Mouse cursors: custom SVG cursors per tool

### Mobile Landscape
- Uses the **same layout as desktop** (left panel + grid)
- Touch handlers added to grid cells: `onTouchStart` opens wheel in Draw mode, paints in Paint mode
- `onTouchMove`/`onTouchEnd` support drag-painting
- Wheel overlay positioned relative to grid (same as desktop)

### Mobile Portrait
- **Scrollable grid** (80% height, minus 16px gap): full-width pixels, scrollable in both axes if grid exceeds viewport. Minimum cell size 32px for finger taps.
- Tapping a pixel opens the color wheel immediately.
- **Bottom panel** (20% height): two sections in a row:
  - **Left column**: tool buttons (horizontal row) + color wheels grid
  - **Right column**: minimap with viewport indicator
- **Color wheel popup**: `position: fixed`, positioned over the tapped pixel (clamped to screen edges). Tap backdrop to dismiss. Drag on wheel to preview colors.
- **Scroll-through behavior**: a global `touchmove` listener (attached for the entire portrait session, not gated on wheel state) handles both color picking and scrolling:
  - **Inside wheel radius**: `preventDefault` is called, touch is used to pick colors from the wheel canvas.
  - **Outside wheel radius**: wheel is dismissed (keeping the last picked color), and the gesture transitions to **manual scroll mode** — subsequent `touchmove` deltas are applied to the grid's `scrollLeft`/`scrollTop` since native scroll can't be re-enabled mid-gesture after `preventDefault`.
  - **On `touchEnd`**: manual scroll mode is cleared. If the wheel is still open and >600ms have passed since it opened, the picked color is painted to the target pixel and the wheel dismisses.
  - The `blockWheel` listener only blocks mouse-wheel events while the wheel overlay is active (checked via ref).

### Minimap (Mobile Portrait)
- Displays a `PixelThumbnail` of the full board inside a stitched dashed border (`2px dashed rgba(92, 90, 88, 0.55)`), sized to fill the bottom-right panel.
- **Viewport indicator**: a white dashed rectangle (`2px dashed rgba(255, 255, 255, 0.85)`) overlaid on the thumbnail showing the currently visible portion of the grid. Position and size are computed from the scroll container's `scrollLeft`/`scrollTop`/`clientWidth`/`clientHeight`/`scrollWidth`/`scrollHeight`.
- **Click/tap to navigate**: clicking or tapping the minimap scrolls the grid to center on the corresponding position.
- **Drag to pan**: `touchStart` and `touchMove` on the minimap continuously update the grid scroll position, allowing drag-panning. `preventDefault` is called to avoid conflicting with page scroll.

### Landing Page
- **Filter bar** at top: type (All/Shared/Mine/Pixel Art), size (Any/16/32/48), mode (Any/Free/Chain/Daily/Live)
- **4-column thumbnail grid** filling the width (dynamic thumb size = container width / 4), centered
- Personal boards show "Solo" badge overlay
- "New Board" button at bottom
- Opens fullscreen (no title bar)

### Create Board (Modal)
- Opens as `size: 'medium'` overlay at `depth: 1` on top of the landing
- Title, size picker, board type, game mode, mode-specific options, pixels-per-turn

## Tools

- **Draw**: Left-click opens color wheel overlay on that pixel. Pick color by dragging over the wheel. Drag the center square to start painting.
- **Paint**: Left-click+drag paints directly with current color. No wheel popup.
- **Pick**: Click a pixel to adopt its color.
- **Erase**: Click+drag to erase (set pixels to null).
- **Undo**: Reverts last stroke. Does not cost credits.

### Shortcuts
- **Double-click** a cell: toggle between Draw and Paint modes
- **Right-click** a filled cell: pick that color (if in Erase mode, switches to Paint)
- **Right-click** an empty cell: switch to Erase mode

## Color System

### Color Wheels (left panel)
12 wheels in a 4x3 grid, each wrapped in a circular `MinkyPanel` with stitched border at 20% opacity:

| Row | Wheels |
|-----|--------|
| 1 | Creams, Vibrants Light, Vibrants, Coral |
| 2 | Rust, Gold, Sage, Sky Blue |
| 3 | Purple, Pink, Vibrants Dark, Darks |

Click a wheel to select it. The selected wheel is used for the popup overlay.

### Popup Wheel Overlay
- Opens on left-click in Draw mode, centered on the clicked pixel
- Drag over the wheel to preview colors
- Release to commit the color to that pixel
- Drag the center square to start painting and close the overlay
- Click elsewhere to close and adopt the preview color
- Auto-fades after 12 seconds

### Symmetry Phantoms
Empty pixels show a 10% opacity ghost of their horizontal mirror (x-axis flip). Helps visualize symmetrical compositions.

## Data Models

### PixelBoard (`backend/src/models/PixelBoard.js`)
```
title, width, height, pixels[],
boardType ('shared'|'personal'),
gameMode ('chain'|'daily-drop'|'live-canvas'|'free'),
pixelsPerTurn, dropInterval, liveCooldownSeconds,
chainOrder[{ userId, name }], currentChainIndex,
creator { id, name, avatar, color },
contributions[{ user, pixels[{x,y,color}], creditsCost, newPositions[], createdAt }],
contributorStats[{ userId, totalPixels, lastContributedAt, contributionCount, nextCreditAt, creditNotified }],
imageUrl, status ('active'|'completed'|'archived'),
createdAt, updatedAt
```

### PixelPalsPlayer (`backend/src/models/PixelPalsPlayer.js`)
```
accountId,
boardStates[{
  boardId, pixelsRemaining, lastDrawTime,
  lastBudgetRefresh, joinedChainAt, touchedPixels[]
}],
savedColors[]
```

## WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `pixelPals:boards:list` | C→S | List active boards (filters personal by session). Accepts `sessionId`, `filter`. |
| `pixelPals:board:get` | C→S | Get full board with pixel data |
| `pixelPals:board:create` | C→S | Create board. Accepts `title`, `size`, `boardType`, `gameMode`, `pixelsPerTurn`, `dropInterval`, `liveCooldownSeconds`. Sets initial budget for creator. |
| `pixelPals:board:draw` | C→S | Place pixels. Accepts `pixels[]`, `isUndo`. Returns `pixelsRemaining`, `autoCompleted`, `gameMode`, chain state. |
| `pixelPals:player:status` | C→S | Get player's board state. Accepts `boardId`. Grants initial budget on first visit. Free mode always returns 99999999. |
| `pixelPals:player:colors:save` | C→S | Save color to palette (max 20) |
| `pixelPals:player:colors:remove` | C→S | Remove saved color |
| `pixelPals:board:pixelsUpdated` | S→C | Broadcast: pixels placed (includes `isUndo` flag) |
| `pixelPals:board:created` | S→C | Broadcast: new board created |
| `pixelPals:board:completed` | S→C | Broadcast: board auto-completed |

## Frontend Flow

```
pixelPals:landing ─── viewBoard ──→ pixelPals:canvas
       │
       └── createBoard ──→ pixelPals:create (depth 1, medium modal)
                                │
                                └── created ──→ pixelPals:canvas
```

Flow-level `size: 'fullscreen'`. Create drop overrides with `size: 'medium'`.

## Key Files

| Component | Path |
|-----------|------|
| Backend flow | `backend/src/flows/pixelPals.js` |
| PixelBoard model | `backend/src/models/PixelBoard.js` |
| PixelPalsPlayer model | `backend/src/models/PixelPalsPlayer.js` |
| PNG generation | `backend/src/services/pixelImageService.js` |
| Frontend flow | `frontend/flows/pixelPalsFlow.js` |
| Store | `frontend/stores/PixelPalsStore.js` |
| Landing drop | `frontend/components/drops/PixelPalsLanding.js` |
| Create drop | `frontend/components/drops/PixelPalsCreate.js` |
| Canvas drop | `frontend/components/drops/PixelPalsCanvas.js` |
| Pixel Editor (reusable) | `frontend/components/PixelEditor.js` |
| Color Wheel (reusable) | `frontend/components/ColorWheel.js` |
| Wrapper | `frontend/components/PixelPals.js` |
| Games Parlor room | `frontend/locations/rooms/games-parlor.js` |
