# User Settings System

This document describes how user settings are stored and synchronized between the frontend and backend.

## Architecture Overview

User settings follow a consistent pattern:

1. **Local Storage First**: Settings are stored locally (localStorage on web, AsyncStorage on native) for immediate access
2. **Server Sync**: Settings are synced to the MongoDB database when the user is authenticated
3. **Server Takes Precedence**: When loading, server settings merge with and override local settings
4. **MobX Stores**: Frontend uses MobX observable stores for reactive updates

## Database Schema

Settings are stored in the `Account` model (`backend/src/models/Account.js`).

### Sound Settings

```javascript
soundSettings: {
  type: Map,
  of: {
    volume: { type: Number, min: 0, max: 1 },
    enabled: { type: Boolean },
  },
  default: new Map()
}
```

**Structure**: Map of sound key -> { volume?, enabled? }

**Example**:
```json
{
  "campfire": { "volume": 0.5, "enabled": false },
  "emote": { "volume": 0.8 },
  "notification": { "enabled": true }
}
```

### Theme Settings

```javascript
themeSettings: {
  globalSettings: {
    minkyColor: { type: String, default: null },
    woolColors: {
      type: Map,
      of: {
        default: { type: String },
        selected: { type: String },
        hover: { type: String },
      },
      default: new Map()
    }
  },
  flowSettings: {
    type: Map,
    of: {
      enabled: { type: Boolean, default: false },
      minkyColor: { type: String },
      woolColors: {
        type: Map,
        of: {
          default: { type: String },
          selected: { type: String },
          hover: { type: String },
        }
      }
    },
    default: new Map()
  }
}
```

**Structure**:
- `globalSettings`: Applied globally unless overridden
  - `minkyColor`: rgba() color string for MinkyPanel overlays
  - `woolColors`: Map of variant -> { default, selected, hover } colors
- `flowSettings`: Per-flow overrides (e.g., weepingWillow, wishingWell)
  - `enabled`: Whether to use flow-specific colors
  - `minkyColor`: Flow-specific MinkyPanel color
  - `woolColors`: Flow-specific button colors

**Example**:
```json
{
  "globalSettings": {
    "minkyColor": "rgba(255, 200, 200, 0.25)",
    "woolColors": {
      "primary": {
        "default": "rgba(255, 200, 200, 0.25)",
        "selected": "rgba(255, 200, 200, 0.4)",
        "hover": "rgba(255, 200, 200, 0.35)"
      }
    }
  },
  "flowSettings": {
    "weepingWillow": {
      "enabled": true,
      "minkyColor": "rgba(179, 230, 255, 0.25)",
      "woolColors": {
        "purple": {
          "default": "rgba(100, 100, 200, 0.3)",
          "selected": "rgba(100, 100, 200, 0.5)"
        }
      }
    }
  }
}
```

## WebSocket Events

### Sound Settings

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `soundSettings:get` | client -> server | `{}` | `{ success, settings }` |
| `soundSettings:update` | client -> server | `{ soundKey, settings }` | `{ success, settings }` |
| `soundSettings:updateBatch` | client -> server | `{ settings }` | `{ success, settings }` |
| `soundSettings:reset` | client -> server | `{ soundKey }` | `{ success, settings }` |
| `soundSettings:resetAll` | client -> server | `{}` | `{ success, settings }` |

### Theme Settings

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `themeSettings:get` | client -> server | `{}` | `{ success, globalSettings, flowSettings }` |
| `themeSettings:update` | client -> server | `{ globalSettings?, flowSettings? }` | `{ success, globalSettings, flowSettings }` |
| `themeSettings:resetAll` | client -> server | `{}` | `{ success, globalSettings, flowSettings }` |
| `themeSettings:resetFlow` | client -> server | `{ flowName }` | `{ success, globalSettings, flowSettings }` |

## Frontend Stores

### SoundSettingsStore

**Location**: `frontend/stores/SoundSettingsStore.js`

**Local Storage Key**: `@homestead:soundSettings`

**Key Methods**:
- `getVolume(soundKey, defaultVolume)` - Get effective volume for a sound
- `isEnabled(soundKey)` - Check if a sound is enabled
- `updateSound(soundKey, settings)` - Update sound settings
- `resetSound(soundKey)` - Reset a sound to defaults
- `resetAll()` - Reset all sounds
- `loadFromServer()` - Sync from server
- `rehydrate()` - Load from local storage on startup

### ThemeStore

**Location**: `frontend/stores/ThemeStore.js`

**Local Storage Key**: `@homestead:themeSettings`

**Key Methods**:
- `getMinkyColor(flowName, variant)` - Get effective MinkyPanel color
- `getWoolColor(variant, state, flowName)` - Get effective button color for state
- `setGlobalMinkyColor(color)` - Update global MinkyPanel color
- `setGlobalWoolColors(variant, colors)` - Update global button colors
- `setFlowEnabled(flowName, enabled)` - Enable/disable flow theming
- `setFlowMinkyColor(flowName, color)` - Set flow-specific MinkyPanel color
- `setFlowWoolColors(flowName, variant, colors)` - Set flow-specific button colors
- `resetFlow(flowName)` - Reset flow settings
- `resetAll()` - Reset all theme settings
- `loadFromServer()` - Sync from server
- `rehydrate()` - Load from local storage on startup

## Default Colors

### MinkyPanel Variants

| Variant | Color |
|---------|-------|
| primary | `rgba(222, 134, 223, 0.25)` (pink) |
| secondary | `rgba(179, 230, 255, 0.25)` (blue) |
| purple | `rgba(112, 68, 199, 0.2)` |
| green | `rgba(110, 200, 130, 0.25)` |
| coral | `rgba(255, 160, 130, 0.25)` |

### WoolButton Variants

Each variant has three states: `default`, `selected`, `hover`

| Variant | Default | Selected | Hover |
|---------|---------|----------|-------|
| primary | `rgba(222, 134, 223, 0.25)` | `rgba(222, 134, 223, 0.4)` | `rgba(222, 134, 223, 0.35)` |
| secondary | `rgba(179, 230, 255, 0.25)` | `rgba(179, 230, 255, 0.4)` | `rgba(179, 230, 255, 0.35)` |
| purple | `rgba(78, 78, 188, 0.27)` | `rgba(78, 78, 188, 0.45)` | `rgba(78, 78, 188, 0.38)` |
| blue | `rgba(179, 230, 255, 0.25)` | `rgba(179, 230, 255, 0.4)` | `rgba(179, 230, 255, 0.35)` |
| green | `rgba(110, 200, 130, 0.32)` | `rgba(110, 200, 130, 0.5)` | `rgba(110, 200, 130, 0.42)` |
| coral | `rgba(255, 160, 130, 0.35)` | `rgba(255, 160, 130, 0.5)` | `rgba(255, 160, 130, 0.45)` |
| discord/blurple | `rgba(130, 140, 255, 0.35)` | `rgba(130, 140, 255, 0.5)` | `rgba(130, 140, 255, 0.45)` |

### Flow Defaults

| Flow | MinkyPanel Color | WoolButton Variant |
|------|------------------|-------------------|
| weepingWillow | `rgba(179, 230, 255, 0.25)` (blue) | blue |
| wishingWell | `rgba(222, 134, 223, 0.25)` (pink) | primary |

## Color Resolution Order

### MinkyPanel
1. Explicit `overlayColor` prop (highest priority)
2. Flow-specific override (if enabled)
3. Global override
4. Flow default color
5. Variant default color (lowest priority)

### WoolButton
1. Disabled state (always uses gray)
2. Flow-specific override for variant+state (if enabled)
3. Global override for variant+state
4. Default color for variant+state

## Component Integration

Components automatically pick up theme colors via:

1. **FlowContext**: Provides `flowName` to nested components
2. **ThemeStore**: MobX store with `getMinkyColor()` and `getWoolColor()`
3. **observer()**: MobX observer wrapper for reactive updates

### MinkyPanel Usage

```jsx
// Automatic flow-aware theming
<MinkyPanel variant="purple">
  Content
</MinkyPanel>

// Explicit color (overrides theme)
<MinkyPanel overlayColor="rgba(255, 0, 0, 0.3)">
  Red panel
</MinkyPanel>
```

### ButtonBase Usage

```jsx
// Automatic theming with hover/selected states
<ButtonBase
  variant="purple"
  selected={isActive}
  onPress={handlePress}
>
  Click me
</ButtonBase>
```

## Files Reference

### Frontend
- `frontend/stores/SoundSettingsStore.js` - Sound settings MobX store
- `frontend/stores/ThemeStore.js` - Theme settings MobX store
- `frontend/components/MinkyPanel.js` - Panel component (uses ThemeStore)
- `frontend/components/ButtonBase.js` - Button component (uses ThemeStore)
- `frontend/components/FlowEngine.js` - Provides FlowContext

### Backend
- `backend/src/models/Account.js` - Account schema with soundSettings and themeSettings
- `backend/src/routes/soundSettings.js` - Sound settings WebSocket handlers
- `backend/src/routes/themeSettings.js` - Theme settings WebSocket handlers
- `backend/src/server.js` - Registers route handlers
