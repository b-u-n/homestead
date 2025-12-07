# Menus

Dropdown menu components used throughout the application. Both menus share a consistent visual style with platform-specific behavior.

## Overview

| Component | File | Purpose |
|-----------|------|---------|
| HamburgerMenu | `/frontend/components/HamburgerMenu.js` | Settings menu (layers, sound, logout) |
| NotificationHeart | `/frontend/components/NotificationHeart.js` | Notification panel with unread badge |

---

## Shared Architecture

### Visual Style

Both menus use a layered approach for the cozy, handcrafted aesthetic:

1. **Button Background** - Tiled `button-bg.png` texture
2. **Color Overlay** - Semi-transparent tint for identity
3. **Stitched Border** - Decorative border via `StitchedBorder` component
4. **Content** - Icon or menu items

```
┌─────────────────────────┐
│  Tiled Background       │  ← button-bg.png (opacity 0.8-0.9)
│  ┌───────────────────┐  │
│  │  Color Overlay    │  │  ← rgba tint
│  │  ┌─────────────┐  │  │
│  │  │  Stitched   │  │  │  ← StitchedBorder
│  │  │  Content    │  │  │
│  │  └─────────────┘  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Platform-Specific Rendering

Background textures require different approaches per platform:

**Web:**
```javascript
<div
  style={{
    backgroundImage: `url(${buttonBgImage})`,
    backgroundRepeat: 'repeat',
    backgroundSize: '20%',  // Tile size
    pointerEvents: 'none',
    opacity: 0.8,
  }}
/>
```

**Native:**
```javascript
<ImageBackground
  source={buttonBgImage}
  style={styles.buttonBgImage}
  imageStyle={{ opacity: 0.8, borderRadius: 8 }}
  resizeMode="repeat"
/>
```

### Close-on-Outside-Click

Both menus close when clicking outside. Implementation differs by platform:

**Web - Global Click Listener:**
```javascript
useEffect(() => {
  if (!isOpen || Platform.OS !== 'web') return;

  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  // Delay to avoid catching the opening click
  const timeoutId = setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);

  return () => {
    clearTimeout(timeoutId);
    document.removeEventListener('click', handleClickOutside);
  };
}, [isOpen]);
```

**Native - Backdrop Pressable:**
```javascript
{Platform.OS !== 'web' && (
  <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
)}
```

The web approach uses a global listener because fixed-position backdrops don't capture clicks reliably due to canvas stacking contexts.

---

## HamburgerMenu

Settings and navigation menu with a three-line hamburger icon.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `style` | ViewStyle | Additional styles for container |

### Features

- Displays current layer name
- Switch Layers button (opens LayerSelectModal)
- Sound Settings button (opens SoundSettingsModal)
- Logout button (only when authenticated)

### Color Theme

- **Overlay:** `rgba(222, 134, 223, 0.25)` (pink tint)
- **Menu Overlay:** `rgba(222, 134, 223, 0.15)`
- **Icon Lines:** `#403F3E`

### Button Variants

Uses `WoolButton` component with different variants:

| Button | Variant | Purpose |
|--------|---------|---------|
| Switch Layers | `secondary` | Layer selection |
| Sound Settings | `blue` | Audio controls |
| Logout | `coral` | Destructive action |

### Styles

```javascript
hamburgerButton: {
  width: 50,
  height: 50,
  borderRadius: 8,
}

menu: {
  position: 'absolute',
  top: 55,           // Below button
  right: 0,          // Aligned right
  minWidth: 180,
  zIndex: 9999,
}
```

---

## NotificationHeart

Notification panel with heart icon and unread count badge.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `style` | ViewStyle | Additional styles for container |
| `onNotificationClick` | Function | Called with `(notification, nav)` when notification clicked |

### Features

- Heart icon with unread count badge
- Scrollable notification list (max 10 active)
- Click notification to navigate to source
- Dismiss individual or all notifications
- Relative timestamps ("2m ago", "1h ago")

### Color Theme

- **Overlay:** `rgba(255, 107, 107, 0.2)` (coral/red tint)
- **Panel Overlay:** `rgba(255, 107, 107, 0.1)`
- **Badge:** `#7044C7` (purple)
- **Unread Background:** `rgba(255, 107, 107, 0.15)`

### Badge

Shows unread count in upper-right corner:

```javascript
badge: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#7044C7',
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  borderWidth: 2,
  borderColor: '#FFFFFF',
}
```

- Shows count 1-9
- Shows "9+" for 10 or more
- Hidden when count is 0

### Notification Item Structure

```
┌──────────────────────────────────────┐
│ [Avatar] Message text here...    [✕] │
│          2m ago                      │
└──────────────────────────────────────┘
```

- **Avatar:** 32x32, actor's avatar or heart placeholder
- **Message:** Max 2 lines, Comfortaa font
- **Time:** Relative timestamp
- **Dismiss:** ✕ button to remove from active list

### Panel Styles

```javascript
panel: {
  position: 'absolute',
  top: 55,
  right: 0,
  width: 320,
  maxHeight: 400,
  zIndex: 9999,
}

notificationList: {
  maxHeight: 320,
}
```

---

## Typography

Both menus use the app's custom fonts:

| Element | Font | Size |
|---------|------|------|
| Layer name | ChubbyTrail | 16 |
| Layer label | Comfortaa | 11 |
| Header title | ChubbyTrail | 18 |
| Notification message | Comfortaa | 13 |
| Notification time | Comfortaa | 11 |
| Empty state | Comfortaa | 14 |

---

## Z-Index Hierarchy

| Element | z-index |
|---------|---------|
| Container | 1000 |
| Backdrop (native) | 9998 |
| Menu/Panel | 9999 |

---

## Shadow Styles

Consistent shadow treatment for depth:

**Button:**
```javascript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.25,
shadowRadius: 4,
elevation: 3,
```

**Menu/Panel:**
```javascript
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 8,
```

---

## Usage

```javascript
import HamburgerMenu from './HamburgerMenu';
import NotificationHeart from './NotificationHeart';

// In your layout
<View style={styles.menuContainer}>
  <NotificationHeart
    style={{ marginRight: 10 }}
    onNotificationClick={(notification, nav) => {
      // Handle navigation to notification source
      if (nav.flow === 'weepingWillow') {
        openWeepingWillow(nav.dropId, nav.params);
      }
    }}
  />
  <HamburgerMenu />
</View>
```

---

## Adding a New Menu

To create a new dropdown menu following this pattern:

1. **Create component** with `useState` for open state and `useRef` for container
2. **Add global click listener** (copy the useEffect pattern)
3. **Structure button** with background texture, overlay, and StitchedBorder
4. **Structure dropdown** with same layering (texture, overlay, border, content)
5. **Add native backdrop** for non-web platforms
6. **Apply consistent shadows** and z-index values

```javascript
const NewMenu = ({ style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Copy the global click listener useEffect

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      {/* Button */}
      <Pressable onPress={() => setIsOpen(!isOpen)} style={styles.button}>
        {/* Background texture */}
        {/* Color overlay with StitchedBorder */}
        {/* Icon */}
      </Pressable>

      {isOpen && (
        <>
          {/* Native backdrop */}
          {Platform.OS !== 'web' && (
            <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
          )}

          {/* Dropdown */}
          <View style={styles.dropdown}>
            {/* Background texture */}
            {/* Overlay with StitchedBorder */}
            {/* Content */}
          </View>
        </>
      )}
    </View>
  );
};
```
