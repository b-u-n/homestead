# Report Issue System Plan

## Phase 1: Backend

### 1.1 Update Account Model
**File:** `/backend/src/models/Account.js`

Add `developer` and `support` to permissions enum:
```js
permissions: [{
  type: String,
  enum: ['admin', 'moderator', 'creator', 'developer', 'support']
}]
```

### 1.2 Update Permissions Middleware
**File:** `/backend/src/middleware/permissions.js`

Add helper functions:
- `isDeveloper()` - has developer permission or is admin
- `isSupport()` - has support permission or is developer/admin

### 1.3 Create ReportIssue Model
**File:** `/backend/src/models/ReportIssue.js`

Schema:
- `text` - User's description (max 2000 chars)
- `metadata` - System info collected with consent:
  - accountId, sessionId, username, email
  - userAgent, platform, screenSize, currentRoute, appVersion
  - consentGiven (boolean)
- `status` - enum: `reported`, `under_investigation`, `assigned`, `resolved`
- `assignedTo` - Staff member ObjectId
- `comments[]` - Visible conversation between user and staff
  - content, author, authorType ('user'|'staff'), createdAt
- `internalNotes[]` - Staff-only notes (hidden from user)
- `createdAt`, `updatedAt`

### 1.4 Create REST API
**File:** `/backend/src/routes/reportIssues.js`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/report-issues` | Authenticated | Create report |
| GET | `/api/report-issues/mine` | Authenticated | User's own reports |
| GET | `/api/report-issues` | support+ | List all |
| GET | `/api/report-issues/:id` | Owner or support+ | Get single (hides internalNotes for owner) |
| POST | `/api/report-issues/:id/comments` | Owner or support+ | Add comment |
| PATCH | `/api/report-issues/:id` | support+ | Update status/assign |

### 1.5 Notifications
**File:** `/backend/src/models/Notification.js`

Added notification types:
- `reportIssue:statusChanged` - When status changes
- `reportIssue:comment` - When staff adds a comment

Notifications are sent to the report owner when:
- Status changes (e.g., "Your issue report status: Under Investigation")
- Staff adds a comment (e.g., "New reply on your issue report")

---

## Phase 2: Frontend

### 2.1 Add Report Issue Button
**File:** `/frontend/components/HamburgerMenu.js`

- Coral button labeled "Report Issue" that opens the ReportIssueModal

### 2.2 Create ReportIssueModal
**File:** `/frontend/components/ReportIssueModal.js`

- Uses Modal component
- Title: "Report a Technical Issue"
- Textarea for issue description (max 2000 chars)
- Checkbox: "Include system info to help diagnose the issue"
- Collapsible preview of system metadata
- Submit button (WoolButton, green)

### 2.3 View Reports & Comments (TODO)
- UI for users to view their submitted reports
- Comment thread display
- Ability to add replies

---

## Phase 3: Documentation

### 3.1 Create ROLES.md
**File:** `/readme/ROLES.md`

Document all permission levels and their access.

---

## Status

- [x] 1.1 Update Account permissions enum
- [x] 1.2 Update permissions middleware
- [x] 1.3 Create ReportIssue model
- [x] 1.4 Create REST API endpoint
- [x] 1.5 Add notifications for status/comments
- [x] 2.1 Add Report Issue button to HamburgerMenu
- [x] 2.2 Create ReportIssueModal
- [ ] 2.3 View Reports & Comments UI
- [x] 3.1 Create ROLES.md
