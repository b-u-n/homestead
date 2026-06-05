---
schema_version: 2
id: spec/bazaar-submission-flow
type: spec
title: Bazaar Submission Flow
status: stable
last_audited: 2026-05-22
tags: [bazaar, moderation]
source_doc:
  - doc/bazaar
governs:
  - component/DrawingBoard
  - component/MapSpritesStall
---

## Rules

### R1: Shop MUST display only the last mod-approved revision

A stall's listing of a `ShopItem` renders content from the revision indexed by `currentApprovedRevisionIndex`. New unreviewed revisions never replace displayed content. This is the "Key Safety Rule" called out in the source doc — it guarantees the public surface cannot be poisoned by an in-flight submission.

**Why:** Without this, a contributor could re-submit toxic content and have it appear in the shop before moderators see it.
**Evidence:** `md/BAZAAR.md` "Key Safety Rule" section; `bazaar:shop:list` is documented to return approved revision content.
**Test:** Submit a revision to an already-approved item; confirm the stall continues to render the previous approved revision until the new one is mod-approved.

### R2: Re-submitting while a pending revision exists supersedes the pending one

When a contributor submits a new revision and a prior revision still has `status: pending`, the pending revision's status flips to `superseded` and the new revision becomes the active pending entry. Only one pending revision per item at any time.

**Why:** Prevents moderator queue duplication and authoring ambiguity ("which one did I mean to submit?").
**Evidence:** `md/BAZAAR.md` core-workflow rule 10; `bazaar:submission:revise` event description.
**Test:** Submit two revisions back-to-back without mod action; first revision's status should be `superseded`.

### R3: Revisions to platform-approved items route to the admin queue, not the mod queue

If `platformStatus === 'approved-for-platform'`, any new revision skips the moderator queue and goes directly to admin review (escalated). Moderators may not approve revisions for platform-promoted items.

**Why:** Platform-approved content is held to a higher bar — admin signs off because the asset is bundled into the codebase, not just the shop.
**Evidence:** `md/BAZAAR.md` core-workflow rule 11; `admin:escalated:list` / `admin:escalated:approveRevision` events.
**Test:** Approve an item for platform, then submit a revision; confirm it appears in `admin:escalated:list` and NOT in `moderation:queue:list`.

### R4: Items not approved for platform remain in the shop as map sprites

Failure to win platform approval is not a death state. The item stays listed in the chosen stall (`map-sprite` in Phase 1) for hearts purchase. Platform approval is purely additive.

**Why:** Encourages submission — contributors don't lose their work if admin doesn't accept it for the codebase.
**Evidence:** `md/BAZAAR.md` core-workflow rule 7 ("failsafe").
**Test:** Have admin return an item with `admin:submission:returnForPlatform`; confirm the item remains in the shop listing.

### R5: All comments go through mod review before being visible

Comments on `ShopItem`s are stored with `visible: false` until a moderator approves them via `moderation:comment:approve`. The stall's item-detail view filters by `visible === true`.

**Why:** Public-square comment surfaces require moderation to prevent abuse.
**Evidence:** `md/BAZAAR.md` core-workflow rule 8; `ShopItem.comments[].visible` defaults to `false`.
**Test:** Post a comment; confirm it does not render until `moderation:comment:approve` runs.

### R6: Image uploads MUST be served through the backend proxy, never via direct GCS URLs

Files land in Google Cloud Storage (uniform bucket-level access; not public). `saveImage()` returns a relative URL of the form `/api/bazaar-content/<filename>`. The frontend `resolveAvatarUrl()` also rewrites legacy public GCS URLs through the same proxy.

**Why:** Consistent with the AI-service abstraction principle in `CLAUDE.md` — frontend never knows about external storage providers, and ACLs stay enforceable.
**Evidence:** `md/BAZAAR.md` "File Storage" section.
**Test:** Submit an image; inspect the returned `contentUrl` — it must start with `/api/bazaar-content/`, not `https://storage.googleapis.com/`.

## Notes

Companion to [[spec/bazaar-moderation-pipeline]] (the mod / admin side of the same workflow) and [[spec/bazaar-pricing]] (the heart-cost curve). Full event tables, model schemas, and stall taxonomy stay in `md/BAZAAR.md` per R6.
