---
schema_version: 2
id: spec/button-system
type: spec
title: Button System
status: stable
last_audited: 2026-05-22
tags: [design-system, ui]
source_doc:
  - doc/buttons
  - doc/woolbuttons
governs:
  - component/ButtonBase
  - component/WoolButton
  - component/MinkyButton
references:
  - spec/design-tokens
  - token/color-overlay-pink
  - token/color-overlay-blue-secondary
  - token/color-overlay-purple-button
  - token/color-overlay-green-button
  - token/color-overlay-coral-button
  - token/color-overlay-discord-button
  - token/color-overlay-blue-scrollbar-unselected
  - token/color-border-dashed
  - token/color-border-stitched-focused
  - token/texture-wool
  - token/texture-minky
  - pattern/auto-styled-text
  - pattern/focused-stitched-border
---

## Rules

### R1: Every button MUST be a `ButtonBase` instance via `WoolButton` or `MinkyButton`

No bespoke styled-`Pressable` buttons. New buttons compose `WoolButton` (wool texture, primary actions/forms) or `MinkyButton` (minky texture, secondary actions/slots/cards). `ButtonBase` is the shared core and is not used directly.

**Why:** Texture, variant overlay, stitched border, emboss border, drop shadow, disabled opacity, and accessibility are centralized in `ButtonBase`. Bespoke buttons fork all of them.
**Evidence:** `md/BUTTONS.md` "Architecture" section — `ButtonBase` is the parent; `WoolButton`/`MinkyButton` are texture-specific thin wrappers.
**Test:** Grep `frontend/` for `Pressable` calls with custom `backgroundColor` / `borderColor` styling that should be a button — each is a violation.

### R2: Variants are restricted to the named set

Allowed `variant` values: `primary`, `secondary`, `purple`, `blue`, `green`, `coral`, `discord`, `blurple`. Each maps to a single canonical overlay token (see `references:`). New variants require a new `token/color-overlay-*-button` node first.

**Why:** Inline overlay literals (e.g. `overlayColor="rgba(123, 45, 67, 0.3)"`) bypass the design system. The `overlayColor` prop exists for *muted variant overrides* (e.g. back-button blue), not for new colors.
**Evidence:** `md/BUTTONS.md` Variants table; `md/WOOLBUTTONS.md` Variants list.
**Test:** Grep for `variant="..."` usages on `WoolButton`/`MinkyButton`. Any value outside the named set fails.

### R3: Text inside a button MUST come from the component's exported `Text`

When passing element children (not a bare string), use `import WoolButton, { Text } from '../components/WoolButton'` and render `<Text>...</Text>`. This `Text` reads `ButtonTextureContext` and applies the texture-correct font and the white emboss shadow.

**Why:** Hand-rolling `<RNText>` inside a button forks the texture-specific font and skips the auto-emboss. Per `pattern/auto-styled-text`.
**Evidence:** `md/BUTTONS.md` "Auto-Styled Text" section; `ButtonBase.js` `ButtonTextureContext` implementation.
**Test:** Lint rule (not yet authored): bare `Text` from `react-native` inside a `WoolButton`/`MinkyButton` should warn.

### R4: `focused` is the canonical selection signal — never restyle the border manually

For radio-style and checkbox-style multi-select option buttons, use `focused={isSelected}`. This swaps the stitched border between `token/color-border-dashed` and `token/color-border-stitched-focused`. Do not override border color via `style`.

**Why:** Per `pattern/focused-stitched-border`. Consistent visual contract for "this option is on".
**Evidence:** `md/BUTTONS.md` "Select & Option Patterns"; `md/WOOLBUTTONS.md` "Select/Toggle Pattern".
**Test:** Manual review.

### R5: `overlayColor` overrides the variant tint, NOT for new palette colors

`overlayColor` is the documented escape hatch — `md/BUTTONS.md` cites the muted back-button blue (`rgba(100, 130, 195, 0.25)`, i.e. `token/color-overlay-blue-scrollbar-unselected`) as the canonical use case. New palette values belong in the variant table (see R2).

**Why:** The prop exists so a button can be muted/secondary without inventing a new variant; if it gets used as a generic styling escape it becomes an inline-hex farm.
**Evidence:** `md/BUTTONS.md` "Custom Overlay Color"; `md/WOOLBUTTONS.md` "Custom Overlay Color".
**Test:** Grep `overlayColor=` calls — each should resolve to an existing `token/color-overlay-*` value.

### R6: For image-only buttons, set `aspectRatio` and `accessibilityLabel`

Square or fixed-ratio image buttons use `aspectRatio={1}` instead of fixed pixel dimensions. Screen-reader label is required because there is no text fallback.

**Why:** Per `md/BUTTONS.md` "Best Practices" #4 and #5. Fixed dimensions break responsive layouts; missing labels break a11y.
**Evidence:** `md/BUTTONS.md` Best Practices.
**Test:** Manual a11y audit.

## Notes

`WoolButton` is also re-exported as the deprecated `VaporwaveButton` alias (captured via the `aliases:` property on `component/WoolButton`). New code must import `WoolButton`. The font that auto-applies inside `WoolButton`/`MinkyButton` is currently disputed — see [[drift/fonts-button-label-divergence]] — but the spec contract above is texture-agnostic and unaffected by the font resolution.
