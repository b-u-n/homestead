# Badges

Badges are small overlay elements positioned on corners of cards and components to display counts, status, or special indicators.

## Badge Types

### Hearts Badge
Shows the heart bounty on posts in Help Wanted / Weeping Willow.

**Used in:** `RespondToPost.js`, `ViewPost.js`

```javascript
<View style={styles.heartsBadge}>
  <View style={styles.badgeContent}>
    <Heart size={12} />
    <Text style={styles.heartsBadgeText}>{post.hearts}</Text>
  </View>
</View>
```

### First Response Badge
Indicates the first response on a post, which earns the heart bounty.

**Used in:** `RespondToPost.js`

```javascript
<View style={styles.firstBadge}>
  <View style={styles.badgeContent}>
    <Heart size={12} />
    <Text style={styles.firstBadgeText}>First Response</Text>
  </View>
</View>
```

### Bounty Badge
Shows hearts earned by the first responder on ViewPost.

**Used in:** `ViewPost.js`

```javascript
<View style={styles.bountyBadge}>
  <View style={styles.bountyBadgeContent}>
    <Heart size={12} />
    <Text style={styles.bountyBadgeText}>+{post.hearts}</Text>
  </View>
</View>
```

### Notification Badge
Shows unread notification count on the heart notification button.

**Used in:** `NotificationHeart.js`

### Quantity Badge
Shows item counts in inventory and knapsack.

**Used in:** `InventoryScreen.js`, `KnapsackIcon.js`

## Styling Pattern

Badges use `MinkyPanel` for consistent styling with the app's aesthetic:

```javascript
<MinkyPanel
  borderRadius={6}
  padding={4}
  paddingTop={4}
  overlayColor="rgba(112, 68, 199, 0.2)"
  borderInset={-1}
  style={styles.badge}
>
  <View style={styles.badgeContent}>
    {/* Badge content */}
  </View>
</MinkyPanel>
```

### Common Badge Styles

```javascript
badge: {
  position: 'absolute',
  top: -8,
  right: -8,
  zIndex: 10,
},
badgeContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
badgeText: {
  fontSize: 11,
  fontFamily: 'Comfortaa',
  fontWeight: '700',
  color: '#403F3E',
  textShadowColor: 'rgba(255, 255, 255, 0.62)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 1,
},
```

## Positioning

Badges are positioned absolutely relative to their parent container:
- Parent must have `position: 'relative'` and `overflow: 'visible'`
- Badge uses `position: 'absolute'` with `top: -8, right: -8`
- Set `marginTop: 8` and `marginRight: 8` on parent wrapper to prevent clipping

Example wrapper:
```javascript
<View style={styles.cardWrapper}>
  <View style={styles.badge}>...</View>
  <MinkyPanel>...</MinkyPanel>
</View>

// Styles
cardWrapper: {
  position: 'relative',
  overflow: 'visible',
  marginTop: 8,
  marginRight: 8,
},
```
