---
schema_version: 2
id: spec/emboss-effect
type: spec
title: Emboss Effect
status: stable
last_audited: 2026-05-22
tags: [design-system, ui]
source_doc:
  - doc/emboss
  - doc/art-style
  - doc/colors
governs:
  - component/MinkyPanel
  - component/ButtonBase
  - component/StitchedBorder
references:
  - spec/design-tokens
  - token/color-emboss-button-text
  - token/color-emboss-content-text
  - token/color-emboss-title-text
  - token/color-emboss-border-highlight
  - token/color-emboss-border-shadow
  - pattern/emboss-text-shadow
  - pattern/emboss-border-overlay
---

## Rules

### R1: Raised surfaces compose two techniques — drop shadow AND emboss border

The "raised from the page" feel requires both: (a) an external `shadowColor: '#000'` drop shadow on the container, and (b) an internal overlay View with highlight-top-left / shadow-bottom-right borders (`pattern/emboss-border-overlay`). Either alone is insufficient.

**Why:** The external shadow lifts the element off the page; the internal directional border simulates light on the element itself. Together they read as a physical tile.
**Evidence:** `md/EMBOSS.md` "The Emboss Technique" sections 1 and 2; implemented in `ButtonBase.js` lines 246–289 and in `MinkyPanel.js`.
**Test:** Render a raised surface with only one of the two — it reads as flat-with-shadow or flat-with-outline rather than raised.

### R2: The emboss border overlay MUST have `pointerEvents="none"` and be the last child

The overlay sits absolutely over the container's content. If it captures touches, the underlying `Pressable` stops working. If it isn't the last child, content paints on top and hides the highlight/shadow lines.

**Why:** Two specific footguns that produce silent breakage — the button stops responding to taps, or the emboss disappears under content.
**Evidence:** `md/EMBOSS.md` "Important" callouts under section 2.
**Test:** Tap-test any button after edits to the emboss layer.

### R3: Text on colored panels MUST carry the emboss text shadow

Text on a `MinkyPanel` (especially darker overlays like purple) gets a white text shadow per `pattern/emboss-text-shadow`. Three tiers: content (`token/color-emboss-content-text` 0.35), button (`token/color-emboss-button-text` 0.62, auto-applied), title (`token/color-emboss-title-text` 1.0, stronger offset).

**Why:** Dark text on a colored ground without the white shadow loses the embossed character of the system. Tier choice matters — using button-tier on flat content text overshoots.
**Evidence:** `md/EMBOSS.md` "Text on Colored Panels"; `md/ART_STYLE.md` "Emboss Effect" two-level system.
**Test:** Manual visual review.

### R4: Button text emboss is automatic — do NOT apply it manually inside a button

`ButtonBase` applies `token/color-emboss-button-text` automatically via the `Text` component re-exported by `WoolButton`/`MinkyButton`. Applying it again on top of that doubles the shadow and produces visible smearing.

**Why:** Per `md/ART_STYLE.md`: "Button emboss is handled automatically by ButtonBase — don't apply it manually." Two shadows stack additively in React Native.
**Evidence:** `ButtonBase.js` `textStyles.wool` / `textStyles.minky` definitions.
**Test:** Grep for `textShadow` styles inside button-children components — each is suspect.

### R5: Container of a raised surface must NOT clip the drop shadow

The parent must allow `overflow: 'visible'` (or provide enough padding) so the external drop shadow renders. `overflow: 'hidden'` clips shadows in React Native.

**Why:** A drop shadow clipped by a parent is invisible; surface reads as flat. `md/EMBOSS.md` calls this out specifically for `Modal` content containers.
**Evidence:** `md/EMBOSS.md` "Container Requirements".
**Test:** Render a button in a tight `overflow: hidden` parent — shadow disappears.

## Notes

`md/COLORS.md` documents a stronger third tier (`textShadowColor: 'rgba(255, 255, 255, 1)'` with 2px offset/radius) for titles that `md/ART_STYLE.md` does not. The token (`token/color-emboss-title-text`) captures the value but Phase 2 should reconcile the docs.
