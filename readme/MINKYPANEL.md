# Minky Panel

## Usage

```jsx
import MinkyPanel from '../components/MinkyPanel';

<MinkyPanel>
  <Text>Your content here</Text>
</MinkyPanel>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| overlayColor | string | 'rgba(222, 134, 223, 0.25)' | Tint color |
| borderRadius | number | 20 | Corner radius |
| padding | number | 20 | Inner padding |
| paddingTop | number | 25 | Top padding |
| borderColor | string | 'rgba(92, 90, 88, 0.55)' | Stitched border color |
| borderInset | number | 0 | Inset distance for stitched border |

## Visual Structure

MinkyPanel consists of layered elements:
1. **Base color**: `#E8D4C8` (minky beige)
2. **Texture**: `slot-bg-2.jpeg` repeated at 40%, 80% opacity
3. **Color overlay**: The `overlayColor` prop tint
4. **Stitched border**: 2px dashed border via StitchedBorder component
5. **Emboss effect**: Highlight/shadow borders for 3D appearance

## Stitching

The stitched border uses StitchedBorder component with:
- `borderWidth: 2`
- `borderStyle: 'dashed'`
- `borderColor: 'rgba(92, 90, 88, 0.55)'`

## Example with custom color

```jsx
<MinkyPanel overlayColor="rgba(112, 68, 199, 0.15)">
  <Text>Purple tinted panel</Text>
</MinkyPanel>
```
