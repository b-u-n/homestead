# User Roles and Permissions

## Overview

Homestead uses a permission-based role system. Users can have multiple permissions assigned to their account.

## Permission Levels

| Permission | Description | Access |
|------------|-------------|--------|
| `admin` | Full system access | Everything |
| `developer` | Technical team member | Issue reports + admin features |
| `support` | Customer support staff | Issue reports |
| `moderator` | Community moderator | Content moderation |
| `creator` | Content creator | Content creation tools |

## Permission Hierarchy

Some permissions imply others:

- `admin` → has all permissions
- `developer` → includes `support` access
- `moderator` → includes `creator` access

## Feature Access Matrix

| Feature | admin | developer | support | moderator | creator | user |
|---------|-------|-----------|---------|-----------|---------|------|
| View issue reports | Yes | Yes | Yes | No | No | No |
| Update issue reports | Yes | Yes | Yes | No | No | No |
| Submit issue reports | Yes | Yes | Yes | Yes | Yes | Yes |
| Content moderation | Yes | Yes | No | Yes | No | No |
| Content creation tools | Yes | Yes | No | Yes | Yes | No |

## API Endpoints by Permission

### Report Issues (`/api/report-issues`)

| Endpoint | Required Permission |
|----------|---------------------|
| `POST /` | Authenticated (any user) |
| `GET /mine` | Authenticated (own reports only) |
| `GET /` | support+ |
| `GET /:id` | Owner or support+ |
| `POST /:id/comments` | Owner or support+ |
| `PATCH /:id` | support+ |

### Report Issue Statuses

| Status | Display Name | Description |
|--------|--------------|-------------|
| `reported` | Reported | Initial state when submitted |
| `under_investigation` | Under Investigation | Staff is looking into it |
| `assigned` | Assigned | Assigned to a staff member |
| `resolved` | Resolved | Issue has been addressed |

## Backend Implementation

Permissions are checked using middleware functions in `/backend/src/middleware/permissions.js`:

```js
const { isAdmin, isDeveloper, isSupport, isModerator, isCreator } = require('./middleware/permissions');

// Check if account has support access (support, developer, or admin)
if (isSupport(account)) {
  // Allow access
}
```

## Adding Permissions to an Account

Permissions are stored in the Account model as an array:

```js
// In MongoDB
{
  _id: ObjectId("..."),
  permissions: ["developer", "support"],
  // ...
}
```
