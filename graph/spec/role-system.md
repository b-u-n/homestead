---
schema_version: 2
id: spec/role-system
type: spec
title: Role System
status: stable
last_audited: 2026-05-22
tags: [auth, roles]
source_doc:
  - doc/roles
  - doc/permissions
---

## Rules

### R1: The role taxonomy is exactly five roles plus regular `user`

`admin`, `developer`, `support`, `moderator`, `creator`, and the implicit `user` (no permissions). No additional roles are introduced without updating both `md/ROLES.md` and `md/PERMISSIONS.md` together.

**Why:** Role sprawl produces overlapping access matrices that nobody can reason about. Five is enough; adding a sixth requires explicit design.
**Evidence:** `md/ROLES.md` § Permission Levels; `md/PERMISSIONS.md` § Permission Levels.
**Test:** Grep both docs for new role strings outside the canonical five; expect none.

### R2: Implication relationships are exactly: `admin` ⊇ everything; `developer` ⊇ `support`; `moderator` ⊇ `creator`

These are the only implications. `support` does NOT imply `creator`. `creator` does NOT imply anything. `developer` does NOT imply `moderator`.

**Why:** Permissions are concerns (support is helpdesk; moderation is community policing; creator is content tooling). They are intentionally orthogonal except where the doc explicitly chains them.
**Evidence:** `md/ROLES.md` § Permission Hierarchy; `md/PERMISSIONS.md` § Permission Hierarchy.
**Test:** Account with `permissions: ['developer']`; expect `isSupport` true, `isModerator` false, `isCreator` false.

### R3: The Feature Access Matrix is the canonical user-facing source of truth

`md/ROLES.md` § Feature Access Matrix lists which roles can perform which user-facing actions. When implementing a privileged feature, the matrix is consulted first, then the permission helper is chosen to match.

**Why:** Working bottom-up from middleware functions to a feature decision regularly produces the wrong gate (e.g. `isCreator` on a moderation tool). The matrix is the design intent.
**Evidence:** `md/ROLES.md` § Feature Access Matrix.
**Test:** A new privileged feature's permission gate must match the row in the matrix; PR review enforces.

### R4: Report-issue endpoints follow the documented per-endpoint permission table

`POST /` open to any authenticated user. `GET /mine` for own reports. `GET /` requires `support+`. `GET /:id`, `POST /:id/comments` for owner OR `support+`. `PATCH /:id` requires `support+`.

**Why:** Issue reports contain potentially sensitive user-submitted data; the access matrix is calibrated to "submitter sees their own; staff sees all".
**Evidence:** `md/ROLES.md` § API Endpoints by Permission; `md/PERMISSIONS.md` § REST Endpoints.
**Test:** Non-support user calls `GET /api/report-issues`; expect 403.

### R5: Report-issue statuses are exactly `reported | under_investigation | assigned | resolved`

Lifecycle is enumerated; no ad-hoc statuses. Status transitions are not constrained at the schema level but must follow this enum.

**Why:** A free-form status field becomes per-staff-member jargon and breaks reporting. The enum is the contract.
**Evidence:** `md/ROLES.md` § Report Issue Statuses.
**Test:** PATCH a report with `status: "wontfix"`; expect rejection.

## Notes

This spec is the taxonomy and the user-facing access matrix. The mechanism (how permissions are stored, how checks run) lives in [[spec/permissions-model]]. The two are co-dependent and `md/ROLES.md` is partially redundant with `md/PERMISSIONS.md`; treat the redundancy as intentional doc-from-two-angles, but watch for divergence drift.
