---
schema_version: 2
id: drift/bazaar-dev-permissions-open
type: drift
title: Bazaar mod/admin permissions wide-open in dev mode
status: open
last_audited: 2026-05-22
cause: unimplemented
auto_accept_after: 90
drifts_from:
  - spec/bazaar-moderation-pipeline
affects:
  - component/DrawingBoard
  - component/MapSpritesStall
source_doc:
  - doc/bazaar
---

## Symptom

`middleware/permissions.js` uses an `isDev` flag that grants every account moderator + admin permission in non-production. Production rollout requires assigning real `moderator` / `admin` roles per account. As of the source doc, no production-grade permission grants exist.

The TODO is called out explicitly in `md/BAZAAR.md`:

> Fix moderation and admin permissions for production — currently dev mode grants all permissions via `middleware/permissions.js` (`isDev` flag). Need to assign real `moderator`/`admin` permissions to accounts before deploying.

This violates [[spec/bazaar-moderation-pipeline]] R4 (platform approval is admin-only) and the implicit principle behind R1–R5 (moderator actions imply a moderator role, not "anyone in dev"). Until real role assignment ships, the moderation pipeline's authorization layer is purely vestigial in production-equivalent testing.

## Resolution

**Decision pending.** Options:

1. Ship a CLI script that grants `moderator` / `admin` to specific accounts by user ID, intended to be run by an admin during initial rollout.
2. Reuse the `developer` permission gate already used by Room Editor (see [[spec/room-editor-canvas]] R1) and add `moderator` / `admin` as siblings in the same permissions taxonomy.
3. Add an admin UI under the `admin:*` flow for managing other users' permissions (chicken-and-egg: requires a bootstrap admin).

The TODO does not name a chosen option — agent that picks this up should propose one and update.

## Audit log

| Date       | Agent              | Note                                                                  |
|------------|--------------------|-----------------------------------------------------------------------|
| 2026-05-22 | major-features cluster | Drift recorded during graph buildout from explicit TODO in md/BAZAAR.md. |
