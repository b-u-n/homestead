---
schema_version: 2
id: spec/weeping-willow-posting
type: spec
title: Weeping Willow Posting
status: stable
last_audited: 2026-05-22
tags: [weeping-willow, bounty]
source_doc:
  - doc/weeping-willow
governs:
  - component/WeepingWillowLanding
  - component/CreateWeepingWillowPost
  - component/PostsList
---

## Rules

### R1: First responder wins the entire heart bounty — bounty deducted from author on creation

Heart bounty (1–9) is deducted from the author's active balance at `posts:create` time. The bounty stays attached to the post until the first response arrives, at which point all hearts transfer to the responder's active balance (capped at 9; overflow to bank). `firstResponderId` records the winning responder permanently.

**Why:** Atomic escrow. If hearts weren't deducted at post time, an author could outspend their balance across multiple open posts. If they weren't paid out atomically on first response, multiple responders could race for the same bounty.
**Evidence:** `md/WEEPING_WILLOW.md` "Create Post" and "Responding" sections; `firstResponderId` model field; "Hearts are deducted from user's account on submission".
**Test:** Create a post with 5 hearts → confirm author's active balance dropped by 5. Have another user respond → confirm responder gained 5 (or 4 hearts active + 1 bank if overflow).

### R2: Hearts overflow to bank when responder's active balance > 9

Active heart balance is capped at 9. If the bounty would push a responder over 9 active, the excess routes to their bank balance. Both adjustments happen in one transaction.

**Why:** Active hearts represent immediate-spend currency; bank is overflow / savings. The cap forces savings rather than allowing a single bounty win to give a player a runaway lead.
**Evidence:** `md/WEEPING_WILLOW.md` "Responding" section ("Hearts go to responder's active balance (capped at 9), overflow to bank").
**Test:** Have a responder at 8 active win a 5-heart bounty; confirm 9 active + 4 bank afterwards.

### R3: Authors cannot respond to their own posts

`posts:addResponse` rejects when the responder's account matches the post's `authorId`. Enforced server-side; the frontend hides the RESPOND button on own posts as UX hint only.

**Why:** Prevents self-payout. Without this rule, an author could create a post and immediately "respond" to claim their own bounty back tax-free.
**Evidence:** `md/WEEPING_WILLOW.md` "Responding" section ("Cannot respond to your own posts").
**Test:** Authenticate as the post author and call `posts:addResponse` → expect validation error.

### R4: Post content max 5000 chars; bounty range 1–9

`content`: max 5000 chars (the user is asking for substantive help — long-form is OK). `hearts`: integer 1–9, ≤ author's active balance at submission time. Responses also max 5000 chars.

**Why:** 9-heart maximum prevents whales from outbidding everyone; 1-heart minimum keeps the bounty meaningful (a bounty of zero would be just a question in a board, which is what wishing-well is for).
**Evidence:** `md/WEEPING_WILLOW.md` model `content.maxLength: 5000`, `hearts.min: 1`; "Create Post" rule "(1-9 hearts from their active balance)".
**Test:** Submit `hearts: 0` → validation error. Submit `hearts: 10` → validation error. Submit `hearts: 5` with only 3 active → validation error.

### R5: Posts are tracked by account `_id`, not by session — anonymous accounts survive auth upgrades

`authorId` stores the Account ObjectId so the link survives session changes and future OAuth merging. Only the display fields (`authorName`, `authorAvatar`) are denormalized at write time.

**Why:** Sessions are ephemeral; account merging will happen when anonymous players link Google. Keying on session would break that history.
**Evidence:** `md/WEEPING_WILLOW.md` "Note" under data model ("Posts are tracked by Account ObjectId internally...survives session changes").
**Test:** Manual — create a post as anonymous, then auth-merge the account, confirm post still attributed.

### R6: Sort options MUST include the "Unresponded" filter

Six sorts: Unresponded, Most Popular, Most Hearts, Least Hearts, Newest, Oldest. The "Unresponded" filter is the help-discovery primary sort — backed by a compound index on responses-array length.

**Why:** Surfaces posts that still need help — the entire point of the feature is matching helpers to unanswered requests.
**Evidence:** `md/WEEPING_WILLOW.md` "View Posts (List)" section; data-model indexes note.
**Test:** Have one responded and one unresponded post; query with `sort: 'unresponded'`; only the unresponded post returns.

## Notes

A `ViewPost` drop handles notification deep-link arrivals (e.g., responder notifies author). The filename is shared between weeping-willow and wishing-well — see [[drift/viewpost-shared-filename]]. Cross-references the platform notifications system in `md/NOTIFICATIONS.md`.
