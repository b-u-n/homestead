---
schema_version: 2
id: spec/pixelpals-game-modes
type: spec
title: Pixel Pals Game Modes
status: stable
last_audited: 2026-05-22
tags: [pixelpals, game-modes]
source_doc:
  - doc/pixelpals
governs:
  - component/PixelPalsCanvas
---

## Rules

### R1: Four game modes — Free, Chain, Daily Drop, Live Canvas — each gates drawing differently

Eligibility rules per mode:
- **Free**: unlimited, no cooldown, no turn order. `pixelsRemaining = 99999999`. Personal boards only.
- **Chain**: turn-based. `chainOrder[]` holds player sequence; `currentChainIndex` points to whose turn. Only the current player can draw. After a contribution, index advances (wraps).
- **Daily Drop**: time-based budget. `dropInterval` of `hourly` / `daily` / `weekly`. Budget refreshes when the interval elapses (tracked via `boardStates[].lastBudgetRefresh`).
- **Live Canvas**: per-action cooldown. `liveCooldownSeconds` (30–600) between draw actions. No cumulative budget.

**Why:** Each mode serves a different collaboration shape — Free is solo sketching, Chain is asynchronous turn-taking, Daily Drop is paced multi-day collaboration, Live Canvas is real-time. One UI surface, four gameplay loops.
**Evidence:** `md/pixelpals.md` "Game Modes" section.
**Test:** Create boards in each mode and confirm `pixelPals:board:draw` enforces the appropriate eligibility (chain index, cooldown elapsed, budget remaining, or unconditional).

### R2: Free mode is personal-board-only AND bypasses all credit / eligibility tracking

Free mode requires `boardType: 'personal'`. Backend skips eligibility checks and credit tracking entirely (`creditCost` always 0, `touchedPixels` not updated). `pixelsRemaining` is hardcoded to 99999999.

**Why:** Free mode is the "sketchpad" use-case — credit bookkeeping would be wasted overhead. The personal-board gate prevents one user from filling up a shared board for free.
**Evidence:** `md/pixelpals.md` "Free Mode" + "Credit System" sections.
**Test:** Attempt to create a Free-mode shared board → expect validation error.

### R3: Personal boards are filtered out of `boards:list` for non-owners

Both backend and frontend filter `boardType: 'personal'` boards where the current session is not the creator. Listed boards are only those the user owns or shared boards.

**Why:** Privacy — personal boards are sketchpads, not public works. Without this filter the landing page would leak every user's private work-in-progress.
**Evidence:** `md/pixelpals.md` "Board Types" section.
**Test:** User A creates a personal board; user B calls `pixelPals:boards:list` → board does not appear.

### R4: Boards auto-complete when every pixel is filled — no manual complete

Completion check: `board.pixels.every(p => p !== null)`. On the draw that fills the last pixel: (1) PNG is generated server-side via `sharp` (`pixelImageService.savePixelArtPNG`); (2) `status` flips to `completed` and `imageUrl` stored; (3) a `ShopItem` is created with the PNG as `revision[0]` (`status: 'pending'`), `sourceBoard` ref, and `participantIds`; (4) `ModerationQueue` entry created; (5) contributors notified; (6) draw response includes `autoCompleted: true`. After mod approval the item appears in the Bazaar shop.

**Why:** Manual "Done" buttons require human judgment about "is the board finished" — auto-complete removes that ambiguity and pipelines completed work into the bazaar without extra UX.
**Evidence:** `md/pixelpals.md` "Board Completion" section.
**Test:** Fill the last pixel of a board; check that a `ShopItem` and `ModerationQueue` entry exist and `board.status === 'completed'`.

### R5: Board sizes gated by feature level — 16/32 default, 48 at FL1, custom 8–64 at FL3

Board-size offerings depend on the user's feature level (`md/FEATURES.md`):
- 16x16: FL 0 (everyone)
- 32x32: FL 0 (default)
- 48x48: FL 1
- Custom (8–64): FL 3

**Why:** Progressive disclosure — beginners see two safe sizes; advanced users unlock more dimensions as they level up. Custom sizes are reserved for FL3 because the credit-cost calculations get noisier with arbitrary dimensions.
**Evidence:** `md/pixelpals.md` "Board Sizes" section.
**Test:** New account; create-board picker offers only 16/32. User at FL3; picker offers custom input.

### R6: `pixelsPerTurn` MUST be one of 1/8, 1/4, 1/2 of total pixels — hidden in Free

Creator picks from three options computed from board size: 1/8 / 1/4 / 1/2 of `width × height`. Default 1/8. Options scale with size. Hidden in Free mode (where the budget is meaningless). No backend max cap.

**Why:** Constraining to fractional defaults makes the budget always feel proportional to the board size. Hiding in Free preserves the unrestricted experience.
**Evidence:** `md/pixelpals.md` "Pixels Per Turn" section.
**Test:** Create-board form on a 32x32 → offers 128, 256, 512. On a 48x48 → offers 288, 576, 1152.

## Notes

Cross-references [[concept/bazaar]] via the auto-completion pipeline (R4). The credit-system mechanics (touched-pixels accounting, undo refunds) are split out into [[spec/pixelpals-credit-system]].
