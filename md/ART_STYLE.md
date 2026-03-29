# Art Style Guide

Contributor guide for the Homestead cottagecore textile aesthetic.

## Philosophy

Everything in Homestead feels handmade, warm, and soft — like a cozy blanket. Think embroidery, wool textures, stitched borders, and gentle pastel colors. The visual language evokes craft, care, and comfort.

## Color Palette

### Base
- **Base background**: `#E8D4C8`

### Overlays (applied with transparency over content panels)
- **Pink** (default MinkyPanel): `rgba(222, 134, 223, 0.25)`
- **Purple** (step content panels): `rgba(112, 68, 199, 0.2)`
- **Blue scrollbar selected**: `rgba(135, 180, 210, 0.55)`
- **Blue scrollbar unselected**: `rgba(100, 130, 195, 0.25)`
- **Green**: `rgba(76, 175, 80, 0.3)`
- **Coral**: `rgba(255, 111, 97, 0.3)`

### Text
- **Primary text**: `#2D2C2B` — never full black
- **Secondary text**: `#454342`

### Borders
- **Dashed border**: `rgba(92, 90, 88, 0.55)` — always dashed, never solid

## Emboss Effect

White text shadows create a soft embossed / letterpress look. Two levels:

### Content text emboss (body text, titles, labels)
```
textShadowColor: 'rgba(255, 255, 255, 0.35)'
textShadowOffset: { width: 0, height: 1 }
textShadowRadius: 1
```

### Button text emboss (WoolButton / MinkyButton internals)
```
textShadowColor: 'rgba(255, 255, 255, 0.62)'
textShadowOffset: { width: 0, height: 1 }
textShadowRadius: 1
```

Button emboss is handled automatically by ButtonBase — don't apply it manually. Content text emboss should be on all Comfortaa body text in StyleSheet definitions.

## Fonts

| Font | Usage |
|------|-------|
| **SuperStitch** | Headers, button labels |
| **Comfortaa** | Body text |
| **NeedleworkGood** | Specialty elements, some buttons |
| **ChubbyTrail** | Large decorative headers |

## Textures

- **Wool** (`button-bg.png`): Used on WoolButton backgrounds
- **Minky** (`slot-bg-2.jpeg`): Used on MinkyPanel content panels

These textures give UI elements a tactile, handcrafted quality.

## UI Components

### MinkyPanel
Textured content panel with rounded corners and subtle overlay color.
- Default: pink `rgba(222, 134, 223, 0.25)`
- Purple variant: `rgba(112, 68, 199, 0.2)`

### WoolButton
Textured button with wool background.
- Variants: primary, secondary, purple, blue, green, coral, discord
- `focused` prop adds white stitched border for selected state

### StitchedBorder
Dashed border component that resembles hand-stitching.

## "On Brand" Checklist

**Good:**
- Warm, soft, handmade feel
- Pastel or muted color palette
- Textile / craft textures (wool, minky, embroidery)
- Gentle, calming, supportive tone
- Rounded corners and soft edges
- Fits cottagecore / cozy cabin aesthetic
- Map sprites must have transparent backgrounds (PNG)

**Not good:**
- Harsh neon colors
- Sharp geometric shapes
- Clinical / sterile / corporate look
- Dark, gritty, or unsettling imagery
- Hard drop shadows or glossy effects
- Full black text or backgrounds

## Asset Specifications

### Map Sprites
- **Format**: PNG only (transparent backgrounds required for sprites)
- **Max size**: 5MB
- **Resolution**: 200x200 to 800x800px recommended
- **Transparency**: Welcome — transparent backgrounds blend well with the game world

### General Images
- **Format**: PNG only
- **Max size**: 5MB
- **Color space**: sRGB
- Keep file sizes reasonable — optimize before uploading

## Submission Tips

1. Look at existing Homestead art for reference — match the warmth and softness
2. Muted, warm tones work better than bright saturated colors
3. Add subtle texture if possible — flat digital art can feel out of place
4. Map sprites should look like they belong in a cozy fantasy village
5. When in doubt, simpler is better — the platform aesthetic is gentle, not busy
