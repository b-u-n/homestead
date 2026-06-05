---
schema_version: 2
id: spec/wishing-well-board
type: spec
title: Wishing Well Board
status: stable
last_audited: 2026-05-22
tags: [wishing-well, positivity]
source_doc:
  - doc/wishingwell
governs:
  - component/PositivityBoard
---

## Rules

### R1: All interaction MUST happen on one screen — no multi-step navigation

Sort buttons at top, scrollable post list, compose box pinned at bottom. Expanded posts reveal tip / response inline. The flow's only outbound drop is `viewPost`, which is reserved for notification deep links and always routes back to `board`.

**Why:** The positivity surface is a casual ambient space; a multi-step flow would impose friction that's appropriate for `weeping-willow` (which is a request system) but wrong here.
**Evidence:** `md/WISHINGWELL.md` "Single-Screen Board" section; the flow definition has no compose drop.
**Test:** Inspect `frontend/flows/wishingWellFlow.js` — only two drops: `board` and `viewPost`. No compose / detail / response drops.

### R2: Posts are free; tipping is the heart-spending surface

Creating a post costs 0 hearts. The only heart-spending operation is `wishingWell:posts:tip` (opens `HeartPaymentModal`, selects amount and source). Responses are also free.

**Why:** Free positivity authoring keeps the surface light. Hearts go from acknowledger → author, never as a publishing gate.
**Evidence:** `md/WISHINGWELL.md` "Creating Posts" section ("Posts are free (no heart cost)"); `wishingWell:posts:tip` event.
**Test:** Submit `wishingWell:posts:create` without a hearts payload; confirm success.

### R3: Accordion behavior — one post expanded at a time

Clicking a collapsed post expands it; clicking another collapses the previous. Click the expanded post to collapse. State lives in component-local UI; not persisted.

**Why:** Visual focus and screen real estate — long posts and response threads would push other posts off-screen if multiple were open simultaneously.
**Evidence:** `md/WISHINGWELL.md` "Single-Screen Board" section ("accordion-style (one at a time)").
**Test:** Expand post A then post B; confirm A collapses.

### R4: Content length limits — post 500, response 5000

Posts max 500 chars (must fit "uplifting message" framing — short). Responses max 5000 chars (room for substantive empathy / advice). Enforced both client and server.

**Why:** 500-char limit on posts is a positivity-design choice: prevents Wishing Well from becoming a vent thread. Larger response budget acknowledges that comforting takes more words than blessing.
**Evidence:** `md/WISHINGWELL.md` data-model `content.maxLength: 500` and `responses[].content.maxLength: 5000`.
**Test:** Submit a 501-char post; server returns validation error.

### R5: Sort options MUST include both directions on hearts AND date

Four sorts: Newest, Oldest, Most Hearts, Least Hearts. "Least Hearts" is intentional — surfaces under-loved posts so they can be acknowledged.

**Why:** The "least hearts" sort is the positivity-feature equivalent of a Reddit "controversial" tab — it routes attention to posts that need it.
**Evidence:** `md/WISHINGWELL.md` "Viewing Posts" section.
**Test:** `wishingWell:posts:get` accepts each of the four sort values.

## Notes

Companion deep-link drop `ViewPost` is reused across multiple feature surfaces (e.g., shared filename with `weeping-willow`) — see [[drift/viewpost-shared-filename]]. Tipping integration with `HeartPaymentModal` is documented in `md/WISHINGWELL.md`.
