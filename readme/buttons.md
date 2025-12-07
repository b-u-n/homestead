# Button System

This document explains the unified button system for creating consistent, textured buttons throughout the app.

## Overview

The button system uses a **ButtonBase** component that handles:
- Textured backgrounds (wool, minky)
- Color variants (primary, secondary, purple, blue, green, coral, discord)
- Flexible content (text, images, or custom layouts)
- **Automatic text styling** via context
- Accessibility
- Disabled states

## Button Components

### WoolButton

Fuzzy wool texture. Use for primary actions and forms.

```javascript
import WoolButton, { Text } from '../components/WoolButton';

// Text only
<WoolButton onPress={handleSubmit} variant="primary">
  Submit
</WoolButton>

// Image and text - use the exported Text component for auto-styling
<WoolButton onPress={handleHelp} variant="purple">
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <Image source={helpIcon} style={{ width: 32, height: 32 }} />
    <Text>Ask for help</Text>
  </View>
</WoolButton>

// Image only (square)
<WoolButton onPress={handleAction} aspectRatio={1}>
  <Image source={icon} style={{ width: 100, height: 100 }} />
</WoolButton>
```

### MinkyButton

Soft minky texture. Use for secondary actions, slots, and cards.

```javascript
import MinkyButton, { Text } from '../components/MinkyButton';

// Same API as WoolButton
<MinkyButton onPress={handleView} variant="secondary">
  View Details
</MinkyButton>
```

## Auto-Styled Text

Import `Text` from the button component to get automatic styling based on the button's texture:

```javascript
import WoolButton, { Text } from '../components/WoolButton';
import MinkyButton, { Text } from '../components/MinkyButton';

// Text inside WoolButton uses NeedleworkGood font with shadow
<WoolButton onPress={fn}>
  <View style={styles.row}>
    <Image source={icon} />
    <Text>Label</Text>
  </View>
</WoolButton>

// Text inside MinkyButton uses Comfortaa font
<MinkyButton onPress={fn}>
  <View style={styles.row}>
    <Image source={icon} />
    <Text>Label</Text>
  </View>
</MinkyButton>
```

The `Text` component reads the texture from context, so it automatically uses the right font:
- **wool**: NeedleworkGood, with text shadow
- **minky**: Comfortaa, clean look

You can still override styles if needed:

```javascript
<Text style={{ fontSize: 20 }}>Larger text</Text>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Button content (text string or React elements) |
| `onPress` | Function | - | Press handler |
| `variant` | String | `'primary'` | Color variant (see below) |
| `disabled` | Boolean | `false` | Disables the button |
| `style` | Object | `{}` | Container style overrides |
| `contentStyle` | Object | `{}` | Inner content style overrides |
| `aspectRatio` | Number | - | Forces aspect ratio (e.g., `1` for square) |
| `accessibilityLabel` | String | - | Screen reader label (auto-generated for text content) |
| `accessibilityHint` | String | - | Screen reader hint |

## Variants

| Variant | Use Case |
|---------|----------|
| `primary` | Default pink/purple tint |
| `secondary` | Light blue tint |
| `purple` | Deep purple for emphasis |
| `blue` | Blue accent |
| `green` | Success/positive actions |
| `coral` | Warm accent |
| `discord` / `blurple` | Discord-themed |

## Content Patterns

### Text Only

Pass a string as children. Default text styling is applied automatically.

```javascript
<WoolButton onPress={fn}>Submit</WoolButton>
```

### Image + Text

Use the exported `Text` component for automatic styling.

```javascript
import WoolButton, { Text } from '../components/WoolButton';

<WoolButton onPress={fn} variant="purple">
  <View style={styles.buttonContent}>
    <Image source={icon} style={styles.buttonIcon} />
    <Text style={{ fontSize: 18 }}>Button Label</Text>
  </View>
</WoolButton>

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  buttonIcon: {
    width: 32,
    height: 32,
  },
});
```

### Image Only

Use `aspectRatio` for consistent sizing.

```javascript
<WoolButton onPress={fn} aspectRatio={1}>
  <Image source={icon} style={{ width: 80, height: 80 }} />
</WoolButton>
```

### Multiple Images (Grid)

Wrap in a View with flex layout.

```javascript
<MinkyButton onPress={fn} aspectRatio={1}>
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
    <Image source={img1} style={{ width: 40, height: 40 }} />
    <Image source={img2} style={{ width: 40, height: 40 }} />
    <Image source={img3} style={{ width: 40, height: 40 }} />
    <Image source={img4} style={{ width: 40, height: 40 }} />
  </View>
</MinkyButton>
```

## Architecture

```
ButtonBase (texture, variant, disabled logic)
├── WoolButton (texture="wool")
└── MinkyButton (texture="minky")
```

**ButtonBase** handles:
- Background texture rendering (platform-specific: web div vs native ImageBackground)
- Color overlay based on variant
- Stitched border decoration
- Text vs custom children detection
- Accessibility attributes
- Disabled opacity

## Best Practices

1. **Use the right texture**: Wool for forms/actions, Minky for cards/slots
2. **Consistent spacing**: Use `gap: 12` for icon+text layouts
3. **Standard icon sizes**: 24px for inline, 32px for prominent, 80-100px for image-only buttons
4. **Always set accessibilityLabel** for image-only buttons
5. **Use aspectRatio** for square/fixed-ratio buttons instead of fixed dimensions
