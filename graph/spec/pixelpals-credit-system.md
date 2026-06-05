---
schema_version: 2
id: spec/pixelpals-credit-system
type: spec
title: Pixel Pals Credit System
status: stable
last_audited: 2026-05-22
tags: [pixelpals, credits]
source_doc:
  - doc/pixelpals
governs:
  - component/PixelEditor
references:
  - spec/pixelpals-game-modes
---

## Rules

### R1: Only NEW positions cost credits — repaints in the same cycle are free

`touchedPixels` on `PixelPalsPlayer.boardStates[]` is a Set-like list of `"x,y"` strings representing positions painted this credit cycle. A draw action that targets a position already in `touchedPixels` costs 0 credits (it's a repaint). Only new positions consume from the budget.

**Why:** Users iterate on a sketch — "I wish that pixel were green, no wait, blue, no wait, teal." Charging for every recolor would make sketching prohibitively expensive. Charging per-position-touched gives the same economy without taxing iteration.
**Evidence:** `md/pixelpals.md` "Credit System" section.
**Test:** Paint position (3,5) blue → cost 1. Paint position (3,5) red → cost 0. Paint position (3,6) → cost 1.

### R2: Each contribution records `creditsCost` AND `newPositions` for undo accounting

A contribution document carries both the actual `creditsCost` consumed and the array of `newPositions` introduced. This is what undo needs.

**Why:** Without storing the per-contribution diff, undo would have to reconstruct it from the board state — which doesn't survive a sequence of partial overlapping edits.
**Evidence:** `md/pixelpals.md` "Credit System" and `PixelBoard` model `contributions[]`.
**Test:** Draw 3 new pixels + 2 repaints in one contribution → stored `creditsCost: 3`, `newPositions.length: 3`.

### R3: Undo refunds exactly `creditsCost` and removes `newPositions` from `touchedPixels`

The undo handler refunds `creditsCost` to `pixelsRemaining` and removes the contribution's `newPositions` from the player's `touchedPixels`. The refund is exact — never a heuristic or recomputation.

**Why:** Symmetric: an N-credit contribution must refund exactly N. Recomputing from the current board state would over- or under-refund whenever a later contribution re-touched the same positions.
**Evidence:** `md/pixelpals.md` "Credit System" section ("refunds exactly creditsCost...").
**Test:** Take 3-credit contribution C1, then 2-credit C2. Undo C2 → refund 2. Undo C1 → refund 3 — not "remaining budget" or any other variable.

### R4: Free mode bypasses credit tracking entirely

In Free mode (`gameMode === 'free'`), `creditCost` is always 0 and `touchedPixels` is not updated. Skipping the bookkeeping (rather than just charging 0) is the rule — preserves data cleanliness.

**Why:** Cuts wasted writes in the unlimited-draw path. Also a robustness measure — Free-mode boards with corrupted `touchedPixels` shouldn't be a thing in the first place.
**Evidence:** `md/pixelpals.md` "Credit System" final bullet ("Free mode skips all credit tracking entirely").
**Test:** Draw 1000 pixels in Free mode; inspect `boardStates[].touchedPixels` — should remain empty.

## Notes

This spec governs the accounting layer used by every non-Free game mode. Drawing eligibility rules (whose turn, cooldown, budget refresh) live in [[spec/pixelpals-game-modes]] — this spec presupposes eligibility has already been checked.
