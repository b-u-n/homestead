---
schema_version: 2
id: component/WoolButton
type: component
title: WoolButton
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/WoolButton.js
aliases:
  - VaporwaveButton
belongs_to:
  - concept/vaporwave-aesthetic
follows:
  - pattern/auto-styled-text
  - pattern/focused-stitched-border
uses:
  - component/ButtonBase
source_doc:
  - doc/buttons
  - doc/woolbuttons
---

## Purpose

Wool-textured button — the default button in the app, used for primary actions, forms, and option toggles. Thin wrapper over `ButtonBase` with `texture="wool"` pre-set. Re-exports the auto-styled `Text` from `ButtonBase` so consumers compose icon+text content with `import WoolButton, { Text } from '../components/WoolButton'`.

## Notes

Also re-exports `VaporwaveButton` as a deprecated alias (see `aliases:` frontmatter). New code imports `WoolButton`. Variants and `focused`/`overlayColor` selection patterns documented in `md/BUTTONS.md` and `md/WOOLBUTTONS.md`.
