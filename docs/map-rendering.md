# Map Rendering System

This document describes the map canvas rendering system used for rooms and sections in Homestead.

## Overview

The `MapCanvas` component (`frontend/components/MapCanvas.js`) handles rendering of all map locations including sections and rooms. It draws entities, navigation buttons, doors, and decorations on an HTML5 canvas.

## Entity Configuration

Entities are defined in room/section configuration files located in `frontend/locations/rooms/` and `frontend/locations/sections/`.

### Basic Entity Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the entity |
| `type` | string | Yes | Entity type: `'interactive'`, `'decoration'`, etc. |
| `x` | number | Yes | X position on canvas |
| `y` | number | Yes | Y position on canvas |
| `width` | number | Yes | Width of the entity |
| `height` | number | Yes | Height of the entity |
| `label` | string | Yes | Display label for the entity |
| `description` | string | No | Tooltip/description text |

### Image Support

Entities can display images instead of the default styled box:

```javascript
{
  id: 'help-wanted',
  type: 'interactive',
  x: 100,
  y: 100,
  width: 160,
  height: 64,
  label: 'Help Wanted',
  image: require('../../assets/images/help-wanted.png')
}
```

Images are loaded asynchronously and cached. The image will scale to fit the entity's width (maintaining square aspect ratio for the image itself).

### Title Display (showTitle)

By default, entity labels are displayed below images or centered in boxes. Use `showTitle: false` to hide the label:

```javascript
{
  id: 'journal',
  type: 'interactive',
  x: 200,
  y: 150,
  width: 112,
  height: 84,
  label: 'Journal',
  image: require('../../assets/images/journal.png'),
  showTitle: false  // Label will not be displayed
}
```

### Z-Index (Rendering Order)

The `zIndex` property controls the drawing order of entities. Lower values are drawn first (behind), higher values are drawn on top.

```javascript
// Background decoration (drawn behind everything)
{
  id: 'willow-decor-1',
  type: 'decoration',
  x: 80,
  y: 120,
  width: 180,
  height: 180,
  label: 'Weeping Willow',
  image: require('../../assets/images/weeping-willow.png'),
  showTitle: false,
  zIndex: -1  // Negative = behind default items
}

// Interactive element (default z-index)
{
  id: 'help-wanted',
  type: 'interactive',
  x: 100,
  y: 100,
  width: 160,
  height: 64,
  label: 'Help Wanted',
  // zIndex defaults to 0 if not specified
}

// Overlay element (drawn on top)
{
  id: 'notification',
  type: 'overlay',
  x: 50,
  y: 50,
  width: 40,
  height: 40,
  label: 'Alert',
  zIndex: 10  // Positive = in front of default items
}
```

**Z-Index Guidelines:**
- `-1` or lower: Background decorations
- `0` (default): Standard interactive elements, doors, navigation
- `1` or higher: Overlays, notifications, priority elements

## Back Button Configuration

Rooms can have a back button to return to their parent section:

```javascript
backButton: {
  id: 'back-to-town-square',
  x: 320,
  y: 20,
  width: 100,
  height: 50,
  label: 'Home',
  navigateTo: '/homestead/explore/map/town-square',
  image: require('../../assets/images/map-back-button.png'),
  showTitle: false
}
```

The back button supports all the same properties as entities including `image`, `showTitle`, and `zIndex`.

## Room Definition Example

```javascript
// frontend/locations/rooms/weeping-willow.js
export default (width, height) => ({
  name: 'Weeping Willows',
  type: 'room',
  parentSection: 'town-square',

  backgroundSounds: [
    'weepingWillow',
  ],

  backButton: {
    id: 'back-to-town-square',
    x: 320,
    y: 20,
    width: 100,
    height: 50,
    label: 'Home',
    navigateTo: '/homestead/explore/map/town-square',
    image: require('../../assets/images/map-back-button.png'),
    showTitle: false
  },

  entities: [
    // Background decorations first (with negative zIndex)
    {
      id: 'willow-decor-1',
      type: 'decoration',
      x: 80,
      y: 120,
      width: 180,
      height: 180,
      label: 'Weeping Willow',
      image: require('../../assets/images/weeping-willow.png'),
      showTitle: false,
      zIndex: -1
    },
    // Interactive elements (default zIndex: 0)
    {
      id: 'help-wanted',
      type: 'interactive',
      x: width / 2 - 80,
      y: height / 2 - 80,
      width: 160,
      height: 64,
      label: 'Help Wanted',
      flow: 'weepingWillow',
      image: require('../../assets/images/help-wanted.png'),
      showTitle: false
    }
  ]
});
```

## Debug Mode

Rooms can enable debug mode to display labels centered on all decoration entities. This is useful for positioning and z-index adjustments.

```javascript
export default (width, height) => ({
  name: 'Weeping Willows',
  type: 'room',
  debugMode: true,  // Enable debug labels on decorations
  // ...
});
```

When `debugMode: true`:
- All `type: 'decoration'` entities will show their label centered on the entity
- Labels appear in white boxes with red borders
- Labels are rendered on top of all entities regardless of z-index
- Useful for identifying and repositioning decorations

Set `debugMode: false` (or remove it) to disable debug labels in production.

## Implementation Details

The rendering system in `MapCanvas.js`:

1. Collects all drawable items (backButton, navigation, doors, entities)
2. Sorts them by `zIndex` (ascending order)
3. Draws each item using the `drawButton` helper function
4. Items with images are drawn using `ctx.drawImage()`
5. Items without images get a styled box with dashed border
6. Labels are drawn below images or centered in boxes (unless `showTitle: false`)
