---
schema_version: 2
id: spec/minky-panel
type: spec
title: Minky Panel
status: stable
last_audited: 2026-05-22
tags: [design-system, panel]
source_doc:
  - doc/minkypanel
governs:
  - component/MinkyPanel
references:
  - spec/design-tokens
  - token/color-primary-text
---

## Rules

### R1: MinkyPanel layered visual structure is fixed (5 layers, in order)

From back to front: (1) base color `#E8D4C8` minky beige, (2) `slot-bg-2.jpeg` texture repeated at 40% scale + 80% opacity, (3) `overlayColor` prop tint (default pink `rgba(222, 134, 223, 0.25)`), (4) `StitchedBorder` 2px dashed border, (5) emboss highlight/shadow borders.

**Why:** The textile-handmade aesthetic depends on the full stack — removing any layer breaks the look. Caller-overridable layers are only `overlayColor` (the tint) and `borderRadius`/`padding` (the box shape).
**Evidence:** `md/MINKYPANEL.md` "Visual Structure" section.
**Test:** Render `<MinkyPanel>` with default props in isolation — visually confirm all 5 layers are present (texture visible, pink tint visible, dashed border visible, emboss edges visible).

### R2: Default prop values are load-bearing — overrides MUST be deliberate

Defaults: `overlayColor: 'rgba(222, 134, 223, 0.25)'`, `borderRadius: 20`, `padding: 20`, `paddingTop: 25`, `borderColor: 'rgba(92, 90, 88, 0.55)'`, `borderInset: 0`. Call sites should override only when a specific design call demands it — e.g. nested panels with `padding: 16` for tighter content.

**Why:** Consistent panel rendering across the app. If every call site picks its own padding, the app loses visual rhythm and the "soft handmade panel" idea becomes a bag of one-off boxes.
**Evidence:** `md/MINKYPANEL.md` "Props" table.
**Test:** Spot-check usages — any panel with non-default props should have an obvious reason (nested, sub-panel, etc.).

### R3: Stacked panels MUST use explicit `<View style={{ height: 12 }} />` spacers — NEVER `gap`

ScrollView (and ScrollBarView) do not honor the CSS `gap` property in React Native Web. Vertical stacking of MinkyPanels requires an explicit spacer View between siblings.

**Why:** `gap` silently fails inside ScrollView — children render flush with no error. Explicit spacers are visible in the JSX and survive any container refactor.
**Evidence:** `md/MINKYPANEL.md` "Spacing Between Panels" section.
**Test:** Stack two MinkyPanels inside ScrollBarView with `gap: 12` on the parent — confirm no spacing renders. Replace with `<View style={{ height: 12 }} />` — spacing appears.

### R4: The stitched border is a separate component — MinkyPanel composes `StitchedBorder`

MinkyPanel does NOT draw its own border directly. It nests a `StitchedBorder` (2px dashed, `rgba(92, 90, 88, 0.55)` default). This makes the border style upgradeable centrally.

**Why:** Stitched borders appear on buttons, panels, menus, and modals. Centralizing in `StitchedBorder` means a single edit propagates everywhere.
**Evidence:** `md/MINKYPANEL.md` "Stitching" section.
**Test:** Edit `StitchedBorder` to a different style — confirm MinkyPanel and other consumers update consistently.

## Notes

This spec inherits the design-tokens contract for the colors and texture path used (see `references`). The literal hex `#E8D4C8` is currently NOT yet a token — Phase 2 should add `token/color-minky-base`.

The overlay color is freeform per call site; the most common variants seen in code are pink (default panel), purple `rgba(112, 68, 199, 0.15)` (focused/active), and the menu-specific overlays in `md/MENUS.md`.
