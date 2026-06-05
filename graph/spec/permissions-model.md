---
schema_version: 2
id: spec/permissions-model
type: spec
title: Permissions Model
status: drifting
last_audited: 2026-05-22
tags: [auth, permissions]
source_doc:
  - doc/permissions
references:
  - spec/role-system
---

## Rules

### R1: Permissions are stored as an array of strings on `Account`

`Account.permissions: [String]`. Allowed values: `admin`, `developer`, `support`, `moderator`, `creator`. No nested objects, no separate Permission collection — a flat array of strings is the storage shape.

**Why:** Mongo query simplicity (`{ permissions: 'moderator' }`) and zero-join membership checks. A user can hold multiple permissions independently.
**Evidence:** `md/PERMISSIONS.md` § Account Storage.
**Test:** Read an Account doc with permissions; expect `Array<string>` not `Array<object>`.

### R2: Permission hierarchy is enforced in the `is*` helpers, not in storage

`isAdmin(account)` returns true only if `admin` is in the array. `isModerator(account)` returns true for `moderator` OR `admin`. `isCreator(account)` returns true for `creator`, `moderator`, OR `admin`. `isDeveloper(account)` for `developer` OR `admin`. `isSupport(account)` for `support`, `developer`, OR `admin`. Storage stays flat; helpers do the implication.

**Why:** Materializing the hierarchy in storage means every promotion is N writes and one missed write breaks access. Computing it at check time is one source of truth.
**Evidence:** `md/PERMISSIONS.md` § Middleware; `/backend/src/middleware/permissions.js`.
**Test:** Account with `permissions: ['admin']` only; expect `isModerator` true, `isCreator` true, `isSupport` true.

### R3: Every privileged backend handler MUST gate via the appropriate `is*` helper or `requirePermission` middleware

Admin handlers (`admin:*`) call `isAdmin(account)`. Moderation handlers (`moderation:*`) call `isModerator(account)`. REST endpoints use `requirePermissionREST(permission)` middleware. No handler relies on the frontend hiding the call site.

**Why:** The frontend is untrusted. A privileged handler without an explicit permission check is a vulnerability regardless of whether any UI exposes it.
**Evidence:** `md/PERMISSIONS.md` § Feature Access tables; `/backend/src/flows/admin.js`; `/backend/src/flows/moderation.js`.
**Test:** Send an `admin:queue:list` event from an unauthenticated socket; expect `success: false` with an authorization error.

### R4: Frontend MUST gate privileged flows so non-permitted users cannot reach the call site

The hamburger menu and any other entry point that launches `Admin.js` or `Moderation.js` MUST check the user's permissions and hide / disable the entry for non-permitted users. The backend check (R3) is the security boundary; the frontend check is the UX contract that the surface is consistent with the user's role.

**Why:** Showing an admin button to a regular user and rejecting the call when clicked is a leak of internal structure and a bad UX. The frontend gate is not a substitute for R3 — it complements it.
**Evidence:** `md/PERMISSIONS.md` § Current Status — "Frontend: Admin and Moderation flows are accessible to everyone via the hamburger menu (TODO: add permission gating on the frontend)".
**Test:** Log in as a user with no `admin` permission; expect the Admin entry in the hamburger menu to be absent or disabled. **Currently fails** — see [[drift/permissions-admin-frontend-missing]].

### R5: REST endpoints with owner-or-staff access MUST check ownership first, then role

Endpoints like `GET /api/report-issues/:id` and `POST /api/report-issues/:id/comments` are accessible to the report's owner OR to `support+`. The owner check (sessionId match) runs first; only if it fails does the permission check run.

**Why:** Owners hitting their own resource shouldn't trigger a permission failure path; that pollutes audit logs and adds latency. Order matters for both correctness and observability.
**Evidence:** `md/PERMISSIONS.md` § REST Endpoints table.
**Test:** Owner of a report calls `GET /api/report-issues/:id`; expect 200 without consulting the permission helpers.

## Notes

The role-side semantics (what each role grants in user-facing feature terms) live in [[spec/role-system]]. This spec is the access-control mechanism; that one is the role taxonomy.

`status: drifting` reflects [[drift/permissions-admin-frontend-missing]]. When that drift is resolved, this flips to `stable`.
