---
schema_version: 2
id: spec/bazaar-moderation-pipeline
type: spec
title: Bazaar Moderation Pipeline
status: stable
last_audited: 2026-05-22
tags: [bazaar, moderation, admin]
source_doc:
  - doc/bazaar
references:
  - spec/bazaar-submission-flow
---

## Rules

### R1: Mod and admin actions MUST write a `ModerationAction` audit row

Every approve / return / flag / platform-approve action persists a `ModerationAction` document (`actor`, `actionType`, `contentType`, `contentId`, `revisionIndex`, `note`, `createdAt`). No silent state changes.

**Why:** Audit log is the only way to investigate abuse, mistakes, or contested decisions after the fact.
**Evidence:** `md/BAZAAR.md` `ModerationAction` model; `moderation:actions:list` / `admin:actions:list` events.
**Test:** Run any moderator action; confirm a `ModerationAction` document exists with `actor === acting user`.

### R2: ModerationQueue is the single shared queue across content types

All moderated content surfaces (`bazaar-revision`, `bazaar-comment`) use the same `ModerationQueue` collection, distinguished by `contentType` + `itemType`. New content types add an enum value rather than a parallel queue.

**Why:** A single queue prevents drift in moderator UX (different look-and-feel per type) and makes flagging / priority routing uniform.
**Evidence:** `md/BAZAAR.md` `ModerationQueue` model — `contentType` enum.
**Test:** New content types (future: `weeping-willow-post`) MUST extend the enum rather than creating a new collection.

### R3: Escalation flags a revision for admin review without removing it from the mod queue

`moderation:item:flag` sets `priority: 'escalated'` and notifies admins via `admin:newEscalation`. The item remains visible in `moderation:queue:list` — escalation is an additive signal, not a queue migration.

**Why:** Moderators retain visibility into what's escalated; admins inherit a prioritized subset. Migrating between queues would lose the moderator's read-state.
**Evidence:** `md/BAZAAR.md` ModerationQueue `priority` field; `moderation:item:flag` description.
**Test:** Flag an item; confirm it still appears in `moderation:queue:list` AND now appears in `admin:queue:list`.

### R4: Platform approval is an admin-only escalation path

Moderators may *request* platform approval (`moderation:item:requestPlatformApproval`) but cannot grant it. Granting flips `platformStatus` to `approved-for-platform` and is reserved for `admin:submission:approveForPlatform`. The corresponding return path (`admin:submission:returnForPlatform`) is symmetric.

**Why:** Platform promotion is high-trust (the asset enters the codebase). Mods don't have commit authority on the platform asset catalog.
**Evidence:** `md/BAZAAR.md` core-workflow rules 12–13.
**Test:** Attempt `moderation:item:requestPlatformApproval` followed by checking `ShopItem.platformStatus` — should be `pending-platform-approval`, not yet approved.

### R5: Owner notifications fire on every state change visible to them

Trigger map: revision-approved → `bazaar:revisionApproved`; revision-returned → `bazaar:revisionReturned`; comment-added (after mod-approve) → `bazaar:comment`; item-purchased → `bazaar:purchase`; platform-approved → `bazaar:platformApproved`; platform-returned → `bazaar:platformReturned`. Mods receive `moderation:newItem`; admins receive `admin:newEscalation`.

**Why:** Contributors need to know the status of work they submitted; reviewers need a queue ping.
**Evidence:** `md/BAZAAR.md` "Notifications" table.
**Test:** Trigger each action and confirm the corresponding notification fires for the listed recipient.

## Notes

The dev-mode permission shortcut in `middleware/permissions.js` (`isDev` flag) currently grants moderator + admin to every account — this is captured as drift, see [[drift/bazaar-dev-permissions-open]]. Full audit-log schema and the per-event auth column live in `md/BAZAAR.md`.
