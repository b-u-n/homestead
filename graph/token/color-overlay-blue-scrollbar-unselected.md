---
schema_version: 2
id: token/color-overlay-blue-scrollbar-unselected
type: token
title: Color — Scrollbar Blue (unselected/muted state)
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/art-style
  - doc/checkboxes
  - doc/buttons
---

## Value

`rgba(100, 130, 195, 0.25)`

## Usage

Unselected/unchecked panel overlay for `Checkbox`, scrollbar unselected state, AND the "muted blue" override used on `WoolButton` for Previous/Back buttons (see `md/BUTTONS.md` "Custom Overlay Color").

## Notes

Triple-duty token: same hex serves as checkbox-unchecked, scrollbar-unselected, and back-button muted. Pairs with `token/color-overlay-blue-scrollbar-selected`.
