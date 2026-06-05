---
schema_version: 2
id: drift/fonts-canonical-list-divergence
type: drift
title: Canonical font list disagrees (CLAUDE.md vs ART_STYLE.md)
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/MinkyPanel
  - token/font-header
source_doc:
  - doc/claude
  - doc/art-style
---

## Symptom

Two docs give different "official" font lists for the app:

| Source                | Fonts listed                                                  |
|-----------------------|---------------------------------------------------------------|
| `CLAUDE.md`           | ChubbyTrail (headers), PWDottedFont (subheaders), Comfortaa (body) |
| `md/ART_STYLE.md`     | SuperStitch (headers, button labels), Comfortaa (body), NeedleworkGood (specialty), ChubbyTrail (large decorative headers) |

Overlap: only Comfortaa (body) and ChubbyTrail (header — though `CLAUDE.md` says primary header, `ART_STYLE.md` says "large decorative" — implying ChubbyTrail is NOT the primary header in `ART_STYLE.md`'s telling, which contradicts `CLAUDE.md`).

`CLAUDE.md` cites `PWDottedFont` for subheaders; `ART_STYLE.md` doesn't mention it. `ART_STYLE.md` cites `SuperStitch` and `NeedleworkGood`; `CLAUDE.md` doesn't.

## Resolution

**Investigation needed.** Grep the codebase for actual `fontFamily:` usages to determine which fonts are actually loaded and rendered. The "real" font list is whichever the code consumes. Update whichever source doc is wrong, and split tokens accordingly:

- Confirm `token/font-body` = Comfortaa (already in graph, both docs agree)
- Confirm or replace `token/font-header` — currently ChubbyTrail per [[token/font-header]]. If code actually uses SuperStitch as the primary header, this token's value is wrong.
- Decide whether to add `token/font-subheader`, `token/font-button-label`, `token/font-specialty` based on what's actually consumed.

This drift is structural — it affects which token nodes should exist, not just their values. Resolve before adding more font-bearing components to the graph.

## Audit log

| Date       | Agent          | Note                                                              |
|------------|----------------|-------------------------------------------------------------------|
| 2026-05-22 | claude (init)  | Drift recorded during graph bootstrap. Needs `grep fontFamily` pass. |
