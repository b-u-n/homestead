---
schema_version: 2
id: drift/permissions-admin-frontend-missing
type: drift
title: Frontend permission gating missing for Admin and Moderation flows
status: open
last_audited: 2026-05-22
cause: unimplemented
auto_accept_after: 90
drifts_from:
  - spec/permissions-model
affects:
  - component/ServerSocketHandlers
source_doc:
  - doc/permissions
---

## Symptom

`md/PERMISSIONS.md` § Current Status states explicitly:

> - Backend: All admin/moderation handlers check permissions per-request via session lookup
> - Frontend: Admin and Moderation flows are accessible to everyone via the hamburger menu (TODO: add permission gating on the frontend)

The Feature Access table reinforces:

| Flow | Required Permission | Backend Check | Frontend Gate |
|------|---------------------|---------------|---------------|
| Admin | `admin` | `isAdmin(account)` in each handler | **None (TODO)** |
| Moderation | `moderator` | `isMod(account)` in each handler | **None (TODO)** |

Concretely, a regular user with no `admin` or `moderator` permission can:
1. Open the hamburger menu
2. Tap "Admin" or "Moderation"
3. See the flow UI render (until any backend call inside the flow fails)

The backend correctly rejects each privileged request (R3 holds), so this is not a security vulnerability — but it is a UX leak (showing internal app structure to unauthorized users) and a violation of [[spec/permissions-model]] R4 ("Frontend MUST gate privileged flows so non-permitted users cannot reach the call site").

## Resolution

Implement permission gating at the entry point of each privileged flow:

1. Read the current user's permissions from `ProfileStore` (or wherever Account.permissions lands on the frontend after login).
2. In `frontend/components/HamburgerMenu.js` (or wherever the menu items are rendered), conditionally render the Admin and Moderation entries based on `isAdmin` / `isModerator` predicates that mirror the backend helpers.
3. Optionally also guard the flow components (`frontend/components/Admin.js`, `frontend/components/Moderation.js`) so deep-linked navigation cannot bypass the menu gate.

Once implemented:
- Flip [[spec/permissions-model]] from `drifting` to `stable`.
- Flip [[pattern/role-gated-flow]] from `wip` to `stable`.
- Set this drift's status to `resolved` and add an audit-log row.

If unresolved by 2026-08-20 (90 days from `last_audited`), `status` auto-flips to `accepted`, meaning the gap is ratified as the current behavior pending design revisit.

## Audit log

| Date       | Agent                | Note                                                                                                    |
|------------|----------------------|---------------------------------------------------------------------------------------------------------|
| 2026-05-22 | claude (cluster init)| Drift recorded during wire-platform-auth cluster buildout. Source TODO in `md/PERMISSIONS.md` unchanged.|
