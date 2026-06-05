---
schema_version: 2
id: drift/bazaar-pixelpals-completion-coupling
type: drift
title: Pixel Pals auto-completion writes directly into the Bazaar moderation queue
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/bazaar-submission-flow
affects:
  - component/PixelPalsCanvas
  - component/MapSpritesStall
source_doc:
  - doc/pixelpals
  - doc/bazaar
---

## Symptom

When a Pixel Pals board fills its last pixel, the backend auto-creates a `ShopItem` with the rendered PNG as `revision[0]` and inserts a `ModerationQueue` entry (`md/pixelpals.md` "Board Completion" steps 3–4). The doc says "After mod approval, item appears in the Bazaar shop."

But `md/BAZAAR.md` is silent on this entry path. The bazaar submission spec ([[spec/bazaar-submission-flow]]) implicitly assumes all `ShopItem`s originate from contributor-driven submission via Drawing Board — not from cross-feature side-effects.

This raises two unresolved questions:

1. **storeType assignment**: which stall does an auto-generated pixel-art ShopItem land in? Neither doc names a value. Defaulting to `map-sprite` would be inconsistent (pixel art is not necessarily a map sprite).
2. **Owner semantics**: who is the "owner" of a multi-contributor board? Notifications normally fire on `item owner`; for a collaborative completion the doc says "Contributors notified via createNotification" (plural) — not a single owner. The `ShopItem` model has a single `user: userSchema` field with no collaborative-owner shape.

Until these are reconciled the cross-feature pipeline is brittle. Closing the gap likely requires either a new `storeType` value (`pixel-art`?) or extending `ShopItem.user` into an array — both are schema changes.

## Resolution

**Decision pending.** Options:

1. Add `pixel-art` as a new `storeType` enum value. Add a `participantIds: [userSchema]` field on `ShopItem` (already used per `md/pixelpals.md`) and document the notification-recipient logic to use that array instead of a single `user`.
2. Pick one participant (creator) as the canonical `user`; ignore others for owner-targeted notifications. Simplest but loses fairness.
3. Don't auto-pipeline — show completed boards in a separate "Gallery" surface, and only allow manual submission to bazaar via a button. Loses the auto-pipeline feature.

## Audit log

| Date       | Agent              | Note                                                                                   |
|------------|--------------------|----------------------------------------------------------------------------------------|
| 2026-05-22 | major-features cluster | Recorded as drift during graph buildout. Cross-feature coupling under-specified.        |
