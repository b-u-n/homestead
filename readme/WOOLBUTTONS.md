# Wool Buttons

## Usage

```jsx
import WoolButton from '../components/WoolButton';

<WoolButton
  title="Button Text"
  onPress={handlePress}
/>
```

## Variants

- `primary` (default) - pink/purple
- `secondary` - sky blue
- `accent` - yellow/orange
- `green` - forest green
- `blurple` - Discord blue
- `coral` - warm coral/peach
- `candy` - bright rosy pink

```jsx
<WoolButton title="Save" variant="primary" />
<WoolButton title="Cancel" variant="secondary" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Button text |
| onPress | function | required | Press handler |
| variant | string | 'primary' | Color variant |
| disabled | boolean | false | Disable button |
