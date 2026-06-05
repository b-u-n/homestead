---
schema_version: 2
id: pattern/auto-styled-text
type: pattern
title: Auto-Styled Text via Context
status: stable
last_audited: 2026-05-22
source_doc:
  - doc/buttons
references:
  - token/font-button-wool
  - token/font-button-minky
  - token/color-emboss-button-text
---

## Pattern

A parent component creates a React Context carrying the relevant style key (e.g. `{ texture: 'wool' | 'minky', size }`). The component re-exports a thin `Text` wrapper that reads the context and picks the correct font/size/shadow without per-call props. Consumers import both: `import WoolButton, { Text } from '../components/WoolButton'`. Any `<Text>` inside the button is auto-styled to match the button's texture.

## When to use

Whenever a container's styling implies its children's text styling and you want consumers to write composed content (icon + text + view) without re-declaring `fontFamily` and shadow every time. Avoids the trap where a button has a string-children fast path that diverges from element-children styling.

## Notes

Implemented in `ButtonBase.js` via `ButtonTextureContext` and a wrapper `Text` component. `WoolButton.js` and `MinkyButton.js` re-export that `Text`. The pattern combined with `pattern/emboss-text-shadow` produces the embossed button label automatically.
