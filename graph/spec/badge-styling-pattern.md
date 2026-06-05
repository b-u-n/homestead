---
schema_version: 2
id: spec/badge-styling-pattern
type: spec
title: Badge Styling Pattern
status: stable
last_audited: 2026-05-22
tags: [badges, ui-pattern]
source_doc:
  - doc/badges
references:
  - token/color-primary-text
  - spec/design-tokens
---

## Rules

### R1: All badges are rendered via `MinkyPanel` with reduced radius and padding

Every badge variant (Hearts, First Response, Bounty, Notification, Quantity) wraps its content in a `MinkyPanel` with `borderRadius: 6`, `padding: 4`, `paddingTop: 4`, and an `overlayColor` chosen per variant. This is what makes badges read as belonging to the same textile aesthetic as the panels they sit on.

**Why:** Using `MinkyPanel` instead of a bare `View` inherits the stitched border, shadow glow, and texture — the visual language that ties the app together. Inlining border + background in a raw `View` is the wrong shortcut.
**Evidence:** `md/BADGES.md` Styling Pattern code block.
**Test:** Grep `frontend/components` for `position: 'absolute'` + `top: -8`; every match should be a `MinkyPanel` child.

### R2: Badges are positioned absolutely at the parent's top-right (`top: -8, right: -8`)

The badge container uses `position: 'absolute'`, `top: -8`, `right: -8`, and `zIndex: 10`. The 8px negative offset is the agreed-on overlap.

**Why:** Visual consistency across the app. Centralizing the offset values prevents the "5px here, 10px there" drift that erodes the design language.
**Evidence:** `md/BADGES.md` Positioning section.
**Test:** Visual diff a card with a badge — the badge should poke 8px beyond the top-right corner exactly.

### R3: The parent wrapper of a badge MUST set `position: 'relative'`, `overflow: 'visible'`, and matching margins

To keep the negatively-offset badge from being clipped, the wrapper carries `overflow: 'visible'` plus `marginTop: 8` and `marginRight: 8` so layout flow accounts for the protruding badge.

**Why:** Without `overflow: visible`, a parent with `overflow: hidden` (common on `MinkyPanel`) clips the badge. Without the margins, the badge overlaps a sibling component.
**Evidence:** `md/BADGES.md` Positioning section — `cardWrapper` example styles.
**Test:** Render a badged card next to another card with `gap: 0`; the badge should not visually overlap the neighbor.

### R4: Badge text uses Comfortaa 700 at 11px with a white text-shadow

`fontFamily: 'Comfortaa'`, `fontWeight: '700'`, `fontSize: 11`, `color: '#403F3E'`, and a `textShadowColor: 'rgba(255, 255, 255, 0.62)'` offset `(0, 1)` radius `1`. The white shadow is what makes the dark text legible against any overlay color.

**Why:** This is the badge body text recipe — consistent across all five variants. Deviation produces a visually inconsistent badge.
**Evidence:** `md/BADGES.md` Common Badge Styles `badgeText`.
**Test:** Grep for `fontFamily: 'Comfortaa'` near `position: 'absolute'`; the surrounding font props should match.

### R5: Badge content is a `flexDirection: 'row'` with `gap: 4` and `alignItems: 'center'`

Most badges combine an icon (Heart) and a count. The inner content `View` is always row-flow with a 4px gap and centered vertically. Icons are 12px (heart bounty / first-response / bounty) or omitted (notification, quantity uses just text).

**Why:** Standardizing icon-plus-text alignment removes a tiny per-badge layout decision.
**Evidence:** `md/BADGES.md` Common Badge Styles `badgeContent`.
**Test:** Render a Hearts Badge with a 3-digit count; icon and text remain vertically aligned with consistent gap.

## Notes

Badges are NOT a shared component — each owning component (`RespondToPost`, `ViewPost`, `NotificationHeart`, `InventoryScreen`, `KnapsackIcon`) renders its badge inline. The shared element is the styling recipe captured here and in [[pattern/badge-positioning-overlay]].

The five badge variants only differ in `overlayColor` and content. A future refactor could extract a `<Badge variant="..." />` component; until then, the rules above are the contract.
