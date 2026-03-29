# Permissions

## Overview

Homestead uses a permission-based system stored on each Account document. Users can have multiple permissions. Some permissions imply others (hierarchy).

## Permission Levels

| Permission | Description | Implies |
|------------|-------------|---------|
| `admin` | Full system access | All permissions |
| `developer` | Technical team member | `support` |
| `support` | Customer support staff | -- |
| `moderator` | Community moderator | `creator` |
| `creator` | Content creator | -- |

## Permission Hierarchy

```
admin
├── developer
│   └── support
├── moderator
│   └── creator
└── (all other permissions)
```

## Account Storage

Permissions are stored as an array on the Account model:

```javascript
// In MongoDB
{
  _id: ObjectId("..."),
  permissions: ["moderator", "creator"],
  // ...
}
```

## Middleware

**File:** `/backend/src/middleware/permissions.js`

| Function | Description |
|----------|-------------|
| `hasPermission(account, permission)` | Check if account has a specific permission |
| `isAdmin(account)` | Check for admin |
| `isModerator(account)` | Check for moderator or admin |
| `isCreator(account)` | Check for creator, moderator, or admin |
| `isDeveloper(account)` | Check for developer or admin |
| `isSupport(account)` | Check for support, developer, or admin |
| `requirePermission(permission)` | WebSocket middleware |
| `requirePermissionREST(permission)` | Express middleware |

## Feature Access

### Flows

| Flow | Required Permission | Backend Check | Frontend Gate |
|------|---------------------|---------------|---------------|
| Admin | `admin` | `isAdmin(account)` in each handler | None (TODO) |
| Moderation | `moderator` | `isMod(account)` in each handler | None (TODO) |
| Bazaar (submit) | Any authenticated user | Session lookup | -- |
| Bazaar (purchase) | Any authenticated user | Session lookup | -- |
| Weeping Willow | Any authenticated user | Session lookup | -- |
| Wishing Well | Any authenticated user | Session lookup | -- |
| Workbooks | Any authenticated user | Session lookup | -- |

### REST Endpoints

| Endpoint | Required Permission |
|----------|---------------------|
| `POST /api/report-issues` | Any authenticated user |
| `GET /api/report-issues/mine` | Any authenticated user (own reports) |
| `GET /api/report-issues` | `support`+ |
| `GET /api/report-issues/:id` | Owner or `support`+ |
| `POST /api/report-issues/:id/comments` | Owner or `support`+ |
| `PATCH /api/report-issues/:id` | `support`+ |

### Admin Events

| Event | Permission | Description |
|-------|------------|-------------|
| `admin:queue:list` | `admin` | List queue items by category |
| `admin:actions:list` | `admin` | Full audit log |
| `admin:submission:approveForPlatform` | `admin` | Approve item for platform use |
| `admin:submission:returnForPlatform` | `admin` | Return item from platform |
| `admin:escalated:list` | `admin` | List escalated items |
| `admin:escalated:approveRevision` | `admin` | Approve escalated revision |
| `admin:escalated:returnRevision` | `admin` | Return escalated revision |

### Moderation Events

| Event | Permission | Description |
|-------|------------|-------------|
| `moderation:queue:list` | `moderator` | List moderation queue |
| `moderation:queue:get` | `moderator` | Get single queue item |
| `moderation:revision:approve` | `moderator` | Approve a revision |
| `moderation:revision:return` | `moderator` | Return a revision |
| `moderation:comment:approve` | `moderator` | Approve a comment |
| `moderation:comment:return` | `moderator` | Remove a comment |
| `moderation:item:flag` | `moderator` | Flag item for admin review |
| `moderation:item:requestPlatformApproval` | `moderator` | Request platform approval |
| `moderation:actions:list` | `moderator` | View moderation action log |

## Current Status

- Backend: All admin/moderation handlers check permissions per-request via session lookup
- Frontend: Admin and Moderation flows are accessible to everyone via the hamburger menu (TODO: add permission gating on the frontend)

## Files

| File | Purpose |
|------|---------|
| `/backend/src/middleware/permissions.js` | Permission check functions and middleware |
| `/backend/src/flows/admin.js` | Admin WebSocket handlers |
| `/backend/src/flows/moderation.js` | Moderation WebSocket handlers |
| `/backend/src/routes/reportIssues.js` | Report issues REST routes |
| `/frontend/flows/adminFlow.js` | Admin flow definition |
| `/frontend/flows/moderationFlow.js` | Moderation flow definition |
| `/frontend/components/Admin.js` | Admin FlowEngine wrapper |
| `/frontend/components/Moderation.js` | Moderation FlowEngine wrapper |
