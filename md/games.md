# Games Parlor

Room on the town square (above the Bazaar) where players find collaborative and creative games.

## Location

- **Town Square** → Games Parlor door (left side, above Bazaar)
- Room: `frontend/locations/rooms/games-parlor.js`
- Registered in MapCanvas LOCATIONS as `'games-parlor'`
- Door asset: `frontend/assets/images/games-parlor.jpeg`
- Game entity asset: `frontend/assets/images/pixel-pals.png`

## Available Games

### Pixel Pals
Collaborative pixel art. See `md/pixelpals.md`.

- Four game modes: Free, Chain, Daily Drop, Live Canvas
- Shared or personal boards
- Completed boards auto-submit to the Bazaar shop
- Contributors get 3-heart discount on purchase
- Fullscreen UI with left panel tools + color wheels

## Architecture

Games follow the standard flow pattern:
1. **Room entity** in `games-parlor.js` with `flow: 'gameName'`
2. **Wrapper component** wraps FlowEngine (e.g., `PixelPals.js`)
3. **Frontend flow** defines drops and navigation
4. **Drop components** handle UI, calling stores/WebSocket
5. **Backend flow** handles game logic and persistence
6. **Models** store game state (boards, player state, etc.)

### Fullscreen Flows
Games can use `size: 'fullscreen'` on the flow definition. This removes the modal title bar, sets 100% dimensions, no border radius, and shows only a small close button in the top-right corner. Individual drops can override with their own `size` (e.g., `'medium'` for the create board dialog).

The FlowEngine falls back to `flowDefinition.size` if a drop doesn't specify its own.

### MinkyPanel Circular Mode
The color wheels use `MinkyPanel` with `shape="circular"` which sets `borderRadius: 9999` and equal padding. This gives each wheel a stitched textile backing.

## Key Files

| Component | Path |
|-----------|------|
| Games Parlor room | `frontend/locations/rooms/games-parlor.js` |
| Town Square (door) | `frontend/locations/sections/town-square.js` |
| MapCanvas registration | `frontend/components/MapCanvas.js` |
| Modal (fullscreen support) | `frontend/components/Modal.js` |
| FlowEngine (size fallback) | `frontend/components/FlowEngine.js` |
| MinkyPanel (circular shape) | `frontend/components/MinkyPanel.js` |
