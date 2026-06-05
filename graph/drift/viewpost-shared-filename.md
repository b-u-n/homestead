---
schema_version: 2
id: drift/viewpost-shared-filename
type: drift
title: ViewPost.js is a shared filename across wishing-well and weeping-willow
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/wishing-well-board
affects:
  - component/PositivityBoard
  - component/WeepingWillowLanding
source_doc:
  - doc/wishingwell
  - doc/weeping-willow
---

## Symptom

Both `md/WISHINGWELL.md` and `md/WEEPING_WILLOW.md` reference `/frontend/components/drops/ViewPost.js` as the deep-link drop for their respective notification flows. The two features have different data models (`WishingWellPost` with tips vs `WeepingWillowPost` with bounty), different actions (tip / respond vs respond / claim-bounty), and different navigation targets (`wishingWell:board` vs `weepingWillow:list` / `weepingWillow:respond`).

A single `ViewPost.js` component cannot cleanly serve both — either it does runtime branching on the flow it was opened from (fragile and complect), or one feature is shadowing the other's file (and only one of the two docs is accurate).

This is recorded as drift because the source docs treat the file as feature-owned in both places, with no acknowledgment that it's shared. Resolution requires investigating which is the actual implementation — it's possible they're two distinct files at the same path in different feature folders (e.g., `drops/wishingWell/ViewPost.js` vs `drops/weepingWillow/ViewPost.js`) but neither doc says so.

## Resolution

**Decision pending.** Options:

1. Confirm two physical files at distinct paths and correct both docs to disambiguate.
2. Confirm one shared component with flow-aware branching; extract per-feature view drops if branching grows.
3. Rename to `WishingWellViewPost.js` and `WeepingWillowViewPost.js` and update both docs.

Whichever option lands, both feature docs and the corresponding component-node files in the graph should be aligned. Currently neither doc references the other on this point.

## Audit log

| Date       | Agent              | Note                                                                                                 |
|------------|--------------------|------------------------------------------------------------------------------------------------------|
| 2026-05-22 | major-features cluster | Recorded as drift during graph buildout. Inspecting `/frontend/components/drops/` will confirm which option is live. |
