# Style Documentation Index

This document catalogs all style-related documentation in the codebase.

## Component Styles

| Document | Description |
|----------|-------------|
| [BUTTONS.md](./BUTTONS.md) | Button system architecture - ButtonBase, WoolButton, MinkyButton, variants, auto-styled text |
| [WOOLBUTTONS.md](./WOOLBUTTONS.md) | Quick reference for WoolButton usage and variants |
| [MINKYPANEL.md](./MINKYPANEL.md) | MinkyPanel component props and usage |
| [BADGES.md](./BADGES.md) | Badge styling patterns - hearts, notifications, counts, positioning |
| [TEXTBOX.md](./TEXTBOX.md) | Auto-expanding textarea pattern for forms |

## Visual Effects

| Document | Description |
|----------|-------------|
| [EMBOSS.md](./EMBOSS.md) | Emboss effect techniques - drop shadows, highlight/shadow borders, text shadows |
| [COLORS.md](./COLORS.md) | Color reference - panel overlays, button variants, text colors, emboss shadows |

## Quick Reference

### Core Components
- **WoolButton** - Fuzzy wool texture buttons for primary actions
- **MinkyButton** - Soft minky texture buttons for secondary actions/cards
- **MinkyPanel** - Content panels with tiled texture background
- **StitchedBorder** - Dashed border decoration for cottagecore aesthetic

### Standard Text Color
```js
color: '#403F3E'  // Primary text
color: '#5C5A58'  // Muted text
```

### Emboss Text Shadow
```js
textShadowColor: 'rgba(255, 255, 255, 0.62)',
textShadowOffset: { width: 0, height: 1 },
textShadowRadius: 1,
```

### Button Variants
`primary` | `secondary` | `purple` | `blue` | `green` | `coral` | `discord`

### Panel Overlay Colors
- Default Pink: `rgba(222, 134, 223, 0.25)`
- Purple: `rgba(112, 68, 199, 0.2)`
- Blue: `rgba(179, 230, 255, 0.25)`
