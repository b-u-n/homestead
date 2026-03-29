# Emboss Effect & Styling Guidelines

How to create embossed/raised effects for UI elements in React Native.

## Components With Emboss Effects

- `MinkyPanel.js` - Content panels (built-in)
- `ButtonBase.js` / `WoolButton.js` - Buttons (built-in)
- `AvatarStamp.js` - Avatar images (built-in)
- `Modal.js` - Close/back buttons (built-in)

## The Emboss Technique

An embossed effect makes elements appear raised from the surface. It combines two techniques:

### 1. Drop Shadow (External)

Applied to the container to lift it off the page:

```js
container: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 3,  // Android
}
```

**Important**: The shadow is clipped by `overflow: 'hidden'`. If your shadow isn't visible, check that the parent container allows overflow or add padding to the parent.

### 2. Highlight/Shadow Border (Internal)

An overlay View with different colored borders simulating light from top-left:

```js
embossBorder: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 8,  // Match container
  borderTopWidth: 1,
  borderLeftWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.5)',
  borderLeftColor: 'rgba(255, 255, 255, 0.5)',
  borderRightWidth: 1,
  borderBottomWidth: 1,
  borderRightColor: 'rgba(0, 0, 0, 0.15)',
  borderBottomColor: 'rgba(0, 0, 0, 0.15)',
}
```

**Important**:
- Add `pointerEvents="none"` so it doesn't block touches
- The parent must have `position: 'relative'`
- Place as last child so it renders on top

## MinkyPanel

### Props

| Prop | Default | Description |
|------|---------|-------------|
| `overlayColor` | `rgba(222, 134, 223, 0.25)` | Color tint over the texture |
| `borderColor` | - | Stitched border color |
| `borderRadius` | `20` | Corner radius |
| `padding` | `20` | Content padding |
| `paddingTop` | `25` | Top padding |
| `style` | - | Additional container styles |

### Built-in Effects

- Drop shadow
- Emboss highlight/shadow border
- Stitched dashed border
- Tiled minky texture background

### Color Variants

```jsx
// Default pink
<MinkyPanel />

// Purple (matches purple button)
<MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)" />

// Blue
<MinkyPanel overlayColor="rgba(179, 230, 255, 0.25)" />
```

## ButtonBase / WoolButton

### Props

| Prop | Default | Description |
|------|---------|-------------|
| `variant` | `'primary'` | Color variant |
| `texture` | `'wool'` | `'wool'` or `'minky'` |
| `disabled` | `false` | Disabled state |
| `onPress` | - | Press handler |
| `style` | - | Additional container styles |

### Variants

- `primary` - Pink (default)
- `purple` - Purple (`rgba(112, 68, 199, 0.2)`)
- `secondary` / `blue` - Blue
- `green` - Green
- `coral` - Coral
- `discord` / `blurple` - Discord purple

### Built-in Effects

- Drop shadow
- Emboss highlight/shadow border
- Stitched dashed border
- Tiled wool/minky texture background

## Text on Colored Panels

When placing text on colored MinkyPanels (especially darker colors like purple), add a white text shadow for contrast/emboss effect:

```js
textStyle: {
  color: '#403F3E',
  textShadowColor: 'rgba(255, 255, 255, 0.62)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 1,
}
```

### Guidelines

- **Opacity**: `0.62` is a good balance - visible but not overpowering
- **Offset**: `{ width: 0, height: 1 }` - shadow below text creates "raised" look
- **Radius**: `1` - slight blur for softer effect
- **Color**: White (`rgba(255, 255, 255, ...)`) for dark text on colored backgrounds

### Example

```jsx
const styles = StyleSheet.create({
  panelText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

<MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)">
  <Text style={styles.panelText}>Readable text on purple panel</Text>
</MinkyPanel>
```

## Container Requirements

For shadows to be visible, the parent container needs room:

```jsx
// In Modal.js - content area allows shadow overflow
content: {
  flex: 1,
  overflow: 'visible',
},
contentContainer: {
  flexGrow: 1,
  paddingBottom: 8,  // Room for button shadow
},
```

## Adjusting the Effect

| What | How |
|------|-----|
| Stronger emboss | Increase border opacity (e.g., `0.7` instead of `0.5`) |
| More depth | Increase shadow opacity/radius |
| Inset effect | Swap highlight/shadow sides (dark top-left, light bottom-right) |
| Softer | Reduce all opacities |
