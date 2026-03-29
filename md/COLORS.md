# Color Reference

Color values used throughout the app for consistency.

## MinkyPanel Overlay Colors

| Name | Value | Use Case |
|------|-------|----------|
| Default Pink | `rgba(222, 134, 223, 0.25)` | Default MinkyPanel color |
| Light Purple | `rgba(112, 68, 199, 0.15)` | Previously used in PostsList cards |
| Purple | `rgba(112, 68, 199, 0.2)` | RespondToPost panels, badges |
| Light Blue | `rgba(179, 230, 255, 0.25)` | Create post button area |

## Button Overlay Colors (ButtonBase variants)

| Variant | Value |
|---------|-------|
| primary | `rgba(222, 134, 223, 0.25)` |
| secondary | `rgba(179, 230, 255, 0.25)` |
| purple | `rgba(78, 78, 188, 0.27)` |
| blue | `rgba(179, 230, 255, 0.25)` |
| green | `rgba(110, 200, 130, 0.32)` |
| coral | `rgba(255, 160, 130, 0.35)` |
| discord/blurple | `rgba(130, 140, 255, 0.35)` |

## Text Colors

| Name | Value | Use Case |
|------|-------|----------|
| Primary Text | `#403F3E` | Main text color |
| Primary Text 82% | `rgba(64, 63, 62, 0.82)` | Titles with emboss effect |
| Muted Text | `#5C5A58` | Secondary/muted text |

## Emboss Text Shadow

For text on colored panels:
```js
textShadowColor: 'rgba(255, 255, 255, 0.62)',
textShadowOffset: { width: 0, height: 1 },
textShadowRadius: 1,
```

For titles (stronger effect):
```js
textShadowColor: 'rgba(255, 255, 255, 1)',
textShadowOffset: { width: 0, height: 2 },
textShadowRadius: 2,
```

## Avatar/Badge Colors

| Name | Value | Use Case |
|------|-------|----------|
| Purple Stitching | `#7044C7` | Avatar borders in purple panels |
| Pink Stitching | `#DE86DF` | Avatar borders in pink panels |
