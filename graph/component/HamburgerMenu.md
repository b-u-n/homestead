---
schema_version: 2
id: component/HamburgerMenu
type: component
title: HamburgerMenu
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/HamburgerMenu.js
belongs_to:
  - concept/vaporwave-aesthetic
follows:
  - pattern/close-on-outside-click
uses:
  - component/StitchedBorder
source_doc:
  - doc/menus
---

## Purpose

Three-line hamburger settings menu in the top-right of the app shell. Anchored absolutely (top: 55, right: 0), opens a dropdown panel with Switch Layers / Sound Settings / Logout buttons (each a `WoolButton` of a different variant). Closes on outside click via the platform-split contract (web: document listener, native: backdrop Pressable).

## Notes

Currently fixed-position with a hardcoded `top: 55` / `right: 0` — the parent layout is responsible for not placing other components in the same anchor region. Pink overlay tint `rgba(222, 134, 223, 0.25)` matches MinkyPanel's default.

`NotificationHeart` is a sibling dropdown menu following the same dropdown contract. Both are governed by [[spec/modal-pattern]] (specifically R4–R5 — the dropdown sub-contract).
