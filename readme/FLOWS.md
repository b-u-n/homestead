# Flows Architecture

This document explains how flows work on both the frontend and backend, and how to inject users into the middle of flows for features like notification deep linking.

See also: [drops.md](./drops.md) for detailed drop configuration (depth, overlays, size, showClose).

## Overview

Flows are declarative state machines that manage multi-step user interactions. They consist of:

- **Drops**: Individual screens/steps within a flow (see [drops.md](./drops.md))
- **Navigation rules**: Conditions that determine which drop comes next
- **Context**: Shared state passed through the flow
- **Accumulated data**: Output collected from each drop

### Key Patterns

1. **Frontend FlowEngine**: Renders drops in a modal, manages navigation state
2. **Backend FlowEngine**: Registers WebSocket handlers with validation
3. **Deep linking**: Start a flow at any drop with initial parameters

---

## Frontend Flow Architecture

### FlowEngine Component

**File:** `/frontend/components/FlowEngine.js`

The FlowEngine is a React component that:

1. Renders a modal containing the current drop's component
2. Manages navigation between drops based on output
3. Maintains flow history for back navigation
4. Accumulates data from each drop for use in subsequent drops

```javascript
<FlowEngine
  flowDefinition={weepingWillowFlow}
  visible={isFlowOpen}
  onClose={() => setIsFlowOpen(false)}
  initialContext={{ userId: '123' }}
  startAt="weepingWillow:viewPost"           // Optional: deep link to specific drop
  initialParams={{ postId: 'abc123' }}        // Optional: params for the starting drop
/>
```

### Flow Definition Structure

**File:** `/frontend/flows/weepingWillowFlow.js`

```javascript
export const weepingWillowFlow = {
  name: 'weepingWillow',           // Flow namespace
  title: 'Help Wanted',            // Modal title
  startAt: 'weepingWillow:landing', // Default starting drop

  drops: {
    'weepingWillow:landing': {
      component: WeepingWillowLanding,
      input: {},                   // Expected input props
      output: {                    // Possible output values (for documentation)
        action: 'view' | 'create'
      },
      next: [                      // Navigation rules (evaluated in order)
        {
          when: (output) => output.action === 'view',
          goto: 'weepingWillow:list'
        },
        {
          when: (output) => output.action === 'create',
          goto: 'weepingWillow:create'
        }
      ]
    },

    'weepingWillow:list': {
      component: PostsList,
      // ... more drops
    }
  }
};
```

### Drop Component Props

Every drop component receives these props from FlowEngine:

| Prop | Type | Description |
|------|------|-------------|
| `input` | Object | Merged drop input definition + accumulated data |
| `context` | Object | Shared flow context (includes `flowName`) |
| `updateContext` | Function | Update shared context: `updateContext({ key: value })` |
| `accumulatedData` | Object | All data from previous drops |
| `onComplete` | Function | Signal completion: `onComplete({ action: 'next', data: {...} })` |
| `onBack` | Function | Navigate back in flow history |
| `canGoBack` | Boolean | Whether back navigation is possible |
| `flowName` | String | Current flow name |
| `dropId` | String | Current drop ID |

### Navigation Rules

Each drop can have multiple `next` rules evaluated in order:

```javascript
next: [
  {
    when: (output, accumulatedData, context) => output.action === 'respond',
    goto: 'weepingWillow:respond'
  },
  {
    when: true,  // Always matches (default/fallback)
    goto: 'weepingWillow:list'
  },
  {
    when: (output) => output.action === 'done',
    goto: null  // Close the flow
  }
]
```

---

## Backend Flow Architecture

### Backend FlowEngine

**File:** `/backend/src/utils/FlowEngine.js`

The backend FlowEngine provides:

1. Handler registration with the flow namespace
2. Input validation before handler execution
3. Standardized response formatting
4. Error handling and logging

### Flow Definition Structure

**File:** `/backend/src/flows/weepingWillow.js`

```javascript
module.exports = {
  name: 'weepingWillow',

  handlers: {
    'weepingWillow:posts:get': {
      validate: (data) => {
        // Return { valid: true } or { valid: false, error: 'message' }
        return { valid: true };
      },

      handler: async (data, context) => {
        // context includes: socket, io, flowName, eventName
        const posts = await WeepingWillowPost.find({});
        return {
          success: true,
          data: posts
        };
      },

      formatOutput: (result) => {
        // Optional: Transform result before sending to client
        return result;
      }
    }
  }
};
```

### Handler Context

Handlers receive a context object:

```javascript
{
  socket,      // Socket.IO socket instance
  io,          // Socket.IO server instance (for broadcasts)
  flowName,    // Name of the flow
  eventName,   // Full event name (e.g., 'weepingWillow:posts:get')
  user: null   // Can be populated by middleware
}
```

### Registering Flows

**File:** `/backend/src/server.js`

```javascript
const flowEngine = require('./utils/FlowEngine');
const weepingWillowFlow = require('./flows/weepingWillow');

// Register flow definitions
flowEngine.registerFlow(weepingWillowFlow);

// In connection handler
io.on('connection', (socket) => {
  flowEngine.setupFlow(socket, io, 'weepingWillow');
});
```

---

## Deep Linking (Injecting Users Mid-Flow)

Deep linking allows starting a flow at a specific drop with pre-populated parameters. This is essential for notifications.

### Use Case: Notification Deep Links

When a user clicks a notification about a response to their post:

1. **Notification stores navigation data:**
   ```javascript
   navigation: {
     flow: 'weepingWillow',
     dropId: 'weepingWillow:viewPost',
     params: { postId: 'abc123' }
   }
   ```

2. **User clicks notification:**
   ```javascript
   NotificationStore.setPendingNavigation(notification);
   ```

3. **Flow opens with deep link params:**
   ```javascript
   const nav = NotificationStore.consumePendingNavigation();

   <FlowEngine
     flowDefinition={weepingWillowFlow}
     visible={true}
     startAt={nav.dropId}           // 'weepingWillow:viewPost'
     initialParams={nav.params}     // { postId: 'abc123' }
   />
   ```

4. **Drop receives params:**
   ```javascript
   // In ViewPost component
   const ViewPost = ({ input, context }) => {
     // postId is available from both input and context
     const postId = input?.postId || context?.postId;
     // Load and display the specific post
   };
   ```

### FlowEngine Deep Link Props

| Prop | Type | Description |
|------|------|-------------|
| `startAt` | String | Drop ID to start at (overrides `flowDefinition.startAt`) |
| `initialParams` | Object | Initial params passed to the starting drop |

The `initialParams` are:
- Stored in `accumulatedData` for access via `input`
- Merged into `context` for easy access
- Available immediately when the flow opens

### Creating Deep-Linkable Drops

When creating a drop that can be deep linked:

1. **Accept params from input or context:**
   ```javascript
   const postId = input?.postId || context?.postId;
   ```

2. **Handle missing params gracefully:**
   ```javascript
   if (!postId) {
     return <ErrorState message="Post not found" />;
   }
   ```

3. **Add the drop to the flow definition:**
   ```javascript
   'weepingWillow:viewPost': {
     component: ViewPost,
     input: {
       postId: 'string'  // Document expected params
     },
     next: [...]
   }
   ```

---

## Flow State Management

### Accumulated Data

Data flows forward through drops via `accumulatedData`:

```javascript
// Drop 1 completes with output
onComplete({ action: 'next', selectedItem: item });

// Drop 2 receives in input
const { selectedItem } = input;
```

Data is keyed by drop ID:
```javascript
accumulatedData = {
  'flow:drop1': { action: 'next', selectedItem: {...} },
  'flow:drop2': { action: 'submit', formData: {...} }
};
```

### Flow Context

Context is shared across all drops and can be updated:

```javascript
// Read context
const { userId, flowName } = context;

// Update context
updateContext({ selectedCategory: 'help' });
```

### Flow History

FlowEngine maintains a history stack for back navigation:

```javascript
flowHistory = ['flow:landing', 'flow:list', 'flow:detail'];

// goBack() pops the stack and navigates to previous drop
```

---

## Best Practices

### Drop Components

1. **Single responsibility**: Each drop handles one step
2. **Stateless where possible**: Use input/context, not local state for flow data
3. **Handle loading states**: Show loading while fetching data
4. **Validate early**: Check required params on mount

### Navigation

1. **Use descriptive actions**: `'respond'` not `'action1'`
2. **Handle edge cases**: Always have a fallback route
3. **Close explicitly**: Use `goto: null` to close the flow

### Deep Linking

1. **Document expected params**: Add to `input` definition
2. **Graceful degradation**: Handle missing params
3. **Test navigation paths**: Verify deep links work correctly

---

## Example: Adding a New Deep-Linkable Drop

### 1. Create the Drop Component

```javascript
// /frontend/components/drops/ViewItem.js
const ViewItem = ({ input, context, onComplete }) => {
  const itemId = input?.itemId || context?.itemId;

  if (!itemId) {
    return <Text>Item not found</Text>;
  }

  return (
    <View>
      <Item id={itemId} />
      <Button onPress={() => onComplete({ action: 'back' })}>
        Back to List
      </Button>
    </View>
  );
};
```

### 2. Add to Flow Definition

```javascript
'myFlow:viewItem': {
  component: ViewItem,
  input: {
    itemId: 'string'
  },
  output: {
    action: 'back' | 'edit'
  },
  next: [
    { when: (o) => o.action === 'back', goto: 'myFlow:list' },
    { when: (o) => o.action === 'edit', goto: 'myFlow:edit' }
  ]
}
```

### 3. Create Notification with Deep Link

```javascript
await createNotification(io, {
  recipientId: userId,
  type: 'myFlow:update',
  message: 'Your item was updated',
  navigation: {
    flow: 'myFlow',
    dropId: 'myFlow:viewItem',
    params: new Map([['itemId', item._id.toString()]])
  }
});
```

### 4. Handle Navigation in UI

```javascript
const handleNotificationClick = (notification) => {
  const nav = notification.navigation;
  if (nav.flow === 'myFlow') {
    setFlowStartAt(nav.dropId);
    setFlowInitialParams(nav.params);
    setIsFlowOpen(true);
  }
};
```
