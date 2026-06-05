---
schema_version: 2
id: pattern/user-object-shape
type: pattern
title: User Object Shape (Embedded Snapshot)
status: stable
last_audited: 2026-05-22
tags: [data-model, backend]
source_doc:
  - doc/architecture
references:
  - spec/architecture-overview
---

## Pattern

Every persisted reference to a user is an **embedded snapshot**, not a foreign key:

```js
user: {
  id:     ObjectId,   // Account._id
  name:   String,     // userData.username
  avatar: String,     // userData.avatar (URL)
  color:  String      // userData.avatarData.variables.color (hex)
}
```

Built via a `buildUserObject(account)` helper:

```js
function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}
```

Responses include both the responder (`response.user`) and the parent post's author (`response.parent.user`) so the response renders self-contained.

## When to use

- Any persisted document that references a user as an author, recipient, or actor (posts, responses, audit log entries, transactions, gifts, etc.).
- Display contexts where avatar + name + color must render without a secondary fetch.

Do NOT use for:
- The Account document itself (it IS the source).
- Live session/profile state (use `ProfileStore` on the frontend).
- Cases where freshness > self-containment (e.g. presence indicators).

## Notes

Snapshot freshness is intentional: when a user changes their avatar, old posts continue to show the avatar that was current when the post was created. The alternative (resolve at read time) requires an N+1 query on every list render and undermines the broadcast model where the wire payload IS the renderable document.

The helper is currently **duplicated** across 7+ flow files (`admin.js`, `bazaar.js`, `knapsack.js`, `moderation.js`, `pixelPals.js`, `weepingWillow.js`, `wishingWell.js`). See [[drift/build-user-object-duplicated]] — the canonical shape is documented but the helper is not centralised.
