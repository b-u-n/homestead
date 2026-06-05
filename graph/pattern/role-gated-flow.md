---
schema_version: 2
id: pattern/role-gated-flow
type: pattern
title: Role-Gated Flow
status: wip
last_audited: 2026-05-22
source_doc:
  - doc/permissions
  - doc/roles
references:
  - spec/permissions-model
  - spec/role-system
---

## Pattern

A privileged feature (Admin, Moderation, support tooling) is gated at two layers:

1. **Backend** — every handler in the flow calls the appropriate `is*(account)` helper from `/backend/src/middleware/permissions.js` at the top, returning `{ success: false, error: 'Unauthorized', blocking: true }` on fail. REST endpoints use `requirePermissionREST(permission)` middleware.
2. **Frontend** — the entry point (hamburger menu item, button, etc.) checks the current user's permissions before rendering. If the user lacks the permission, the entry is hidden or disabled. The flow's `FlowEngine` wrapper does NOT additionally re-check — the entry gate plus the backend gate is the contract.

```javascript
// Backend handler
handler: async (data, { user }) => {
  if (!isAdmin(user)) {
    return { success: false, error: 'Unauthorized', blocking: true };
  }
  // ... admin logic
}

// Frontend entry
{ProfileStore.isAdmin && (
  <HamburgerMenuItem onPress={() => setAdminOpen(true)}>Admin</HamburgerMenuItem>
)}
```

## When to use

Any feature where access is restricted to one or more named permissions: admin tooling, moderation queues, support dashboards, developer-only debug panels.

## Notes

`status: wip` because the frontend gate (layer 2) is currently unimplemented for Admin and Moderation flows — see [[drift/permissions-admin-frontend-missing]]. The backend gate (layer 1) is in place. When the frontend gates land, this pattern's status flips to `stable`.
