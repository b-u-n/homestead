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

## Example with custom color

```jsx
<MinkyPanel overlayColor="rgba(112, 68, 199, 0.15)">
  <Text>Purple tinted panel</Text>
</MinkyPanel>
```
