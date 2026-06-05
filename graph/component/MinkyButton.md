---
schema_version: 2
id: component/MinkyButton
type: component
title: MinkyButton
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/MinkyButton.js
belongs_to:
  - concept/vaporwave-aesthetic
follows:
  - pattern/auto-styled-text
uses:
  - component/ButtonBase
source_doc:
  - doc/buttons
---

## Purpose

Minky-textured button — soft, padded feel for secondary actions, slots, and cards. Thin wrapper over `ButtonBase` with `texture="minky"` pre-set. Same API as `WoolButton`, including the re-exported auto-styled `Text` component. Use when the surrounding context already uses minky panels and an additional wool button would feel visually noisy.

## Notes

Distinct from `MinkyPanel`: `MinkyButton` is tappable (drives `onPress`); `MinkyPanel` is a content container. `md/BUTTONS.md` "Best Practices" #1: wool for forms/actions, minky for cards/slots.
