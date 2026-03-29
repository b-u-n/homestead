# Architecture Guidelines

## User Object Pattern

When storing or returning data that references a user, always use a consistent `user` object structure:

```js
user: {
  id: ObjectId,      // Account._id
  name: String,      // username
  avatar: String,    // avatar URL
  color: String      // hex color from avatarData.color
}
```

### Posts

A post contains content created by a user:

```js
{
  _id: ObjectId,
  content: String,
  user: { id, name, avatar, color },  // the author
  // ... other post-specific fields (hearts, createdAt, etc.)
  responses: [Response]
}
```

### Responses

A response is nested within a post. It includes the responder as `user` and the parent post's author as `parent.user`:

```js
{
  _id: ObjectId,
  content: String,
  user: { id, name, avatar, color },  // the responder
  parent: {
    user: { id, name, avatar, color }  // the post author
  },
  // ... other response-specific fields (createdAt, etc.)
}
```

This makes responses self-contained - you can display a response with full context without needing to look up the parent post.

### Helper Function

Use this helper to build the user object from an Account document:

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

### Why This Pattern?

1. **Consistency** - Same structure everywhere makes frontend code predictable
2. **Self-contained** - Responses include parent context, no extra lookups needed
3. **Complete** - All user display fields (name, avatar, color) in one place
4. **Extensible** - Easy to add new user fields in one place

### Frontend Usage

```jsx
// Post author
<AvatarStamp
  avatarUrl={post.user.avatar}
  avatarColor={post.user.color}
/>
<Text>{post.user.name}</Text>

// Response
<AvatarStamp
  avatarUrl={response.user.avatar}
  avatarColor={response.user.color}
/>
<Text>{response.user.name}</Text>

// MinkyPanel with user's color
<MinkyPanel
  overlayColor={hexToRgba(post.user.color, 0.2)}
  borderColor={hexToRgba(post.user.color, 0.5)}
>
```
