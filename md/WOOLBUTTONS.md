# Wool Buttons

## Usage

```jsx
import WoolButton from '../components/WoolButton';

<WoolButton onPress={handlePress} variant="primary">
  Button Text
</WoolButton>
```

## Variants

- `primary` (default) - pink/purple
- `secondary` - sky blue
- `purple` - deep purple for emphasis
- `blue` - blue accent
- `green` - forest green
- `coral` - warm coral/peach
- `discord` / `blurple` - Discord blue

```jsx
<WoolButton variant="primary" onPress={fn}>Save</WoolButton>
<WoolButton variant="secondary" onPress={fn}>Cancel</WoolButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Button content (string or elements) |
| `onPress` | function | required | Press handler |
| `variant` | string | `'primary'` | Color variant |
| `size` | string | `'large'` | `'small'`, `'medium'`, or `'large'` |
| `disabled` | boolean | `false` | Disable button |
| `focused` | boolean | `false` | Selected/active state (white stitched border) |
| `overlayColor` | string | `null` | Override variant color |
| `style` | object | `{}` | Container style overrides |
| `contentStyle` | object | `{}` | Inner content style overrides |
| `aspectRatio` | number | - | Forces aspect ratio (e.g., `1` for square) |

## Select/Toggle Pattern

Use `focused` to indicate selected state. When `focused={true}`, the stitched border turns white.

```jsx
// Single-select
<WoolButton variant="purple" size="small" focused={isSelected} onPress={handleSelect}>
  {label}
</WoolButton>

// Multi-select with checkmark
<WoolButton variant="purple" size="small" focused={isChecked} onPress={handleToggle}>
  {(isChecked ? '\u2713  ' : '') + label}
</WoolButton>
```

## Custom Overlay Color

Override the variant's theme color for muted or custom-colored buttons:

```jsx
// Muted blue (used for Previous/Back buttons)
<WoolButton variant="purple" overlayColor="rgba(100, 130, 195, 0.25)" onPress={handleBack}>
  Previous
</WoolButton>
```

See [BUTTONS.md](./BUTTONS.md) for full button system documentation including MinkyPanel option pills and stitched checkbox indicators.
