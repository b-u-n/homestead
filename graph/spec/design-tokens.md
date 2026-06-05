---
schema_version: 2
id: spec/design-tokens
type: spec
title: Design Tokens
status: drifting
last_audited: 2026-05-22
tags: [design-system]
source_doc:
  - doc/colors
  - doc/art-style
governs:
  - component/MinkyPanel
references:
  - token/color-primary-text
  - token/color-secondary-text
  - token/color-overlay-pink
  - token/color-background-base
  - token/font-header
  - token/font-body
  - token/texture-minky
  - token/texture-wool
---

## Rules

### R1: Color values have exactly one canonical source

A color value (hex, rgba, or named role) is defined in exactly one `token/` node. Any component, spec, or doc that needs that color references the token by ID, never inlines the literal value a second time.

**Why:** The current `/md/COLORS.md` and `/md/ART_STYLE.md` give two different hex values for "primary text" (`#403F3E` vs `#2D2C2B`). A single source per token would have caught this at PR time.
**Evidence:** [[drift/colors-primary-text-conflict]] — the seed example for this rule.
**Test:** Manual at PR review until a linter can grep for hex literals in non-token files.

### R2: Font names have exactly one canonical source

Same shape as R1 but for typeface names. The two existing docs already diverge here too: `CLAUDE.md` lists `ChubbyTrail / PWDottedFont / Comfortaa`; `md/ART_STYLE.md` lists `SuperStitch / Comfortaa / NeedleworkGood / ChubbyTrail`. Each canonical font becomes a `token/font-*` node.

**Why:** Same as R1 — parallel authoring is the root cause of font-name drift.
**Evidence:** Not yet captured as a drift node. Candidate for the Phase 2 audit pass.
**Test:** Manual.

### R3: Texture and asset paths are tokens, not inline strings

Asset paths like `button-bg.png` and `slot-bg-2.jpeg` are `token/texture-*` nodes. Components reference the token; the literal path lives only in the token's body.

**Why:** When assets are moved or renamed, a single token update propagates. Inline asset paths in 30 components produce 30 places to fix and 30 places to forget.
**Evidence:** None yet.
**Test:** Manual.

## Notes

This spec governs the design-system surface. It does NOT govern individual component styling decisions (border radius, padding) — those live with the component spec that owns them. The line: if it's a *value* shared across the app, it's a token; if it's a *decision* about how one component renders, it's that component's spec.

`status: drifting` reflects the fact that the seed drift case for this spec is currently open. When the COLORS vs ART_STYLE conflict is resolved, this flips to `stable`.
