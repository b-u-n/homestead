# Drops

Drops are the individual screens/steps within a flow. Each drop is a React component that renders inside a modal managed by FlowEngine.

See also: [FLOWS.md](./FLOWS.md) for the overall flow architecture.

## Drop Definition

Each drop in a flow definition has these properties:

```javascript
'flowName:dropId': {
  component: DropComponent,     // Required: React component to render
  depth: 0,                     // Optional: Modal depth (default 0)
  size: 'medium',               // Optional: Modal size for overlays
  title: 'Custom Title',        // Optional: Override flow title
  showClose: true,              // Optional: Show close button (default true)
  next: [                       // Required: Navigation rules
    { when: (output) => output.action === 'submit', goto: 'flowName:next' }
  ]
}
```

### Drop Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `component` | Component | required | React component to render |
| `depth` | number | `0` | Modal depth level (see Depth System below) |
| `size` | string | none | Modal size: `'small'`, `'medium'`, `'large'` |
| `title` | string | flow title | Override the modal title |
| `showClose` | boolean | `true` | Whether to show the close (X) button |
| `next` | array | required | Navigation rules |

---

## Drop Component Props

Every drop component receives these props from FlowEngine:

```javascript
DropComponent({
  input,            // { ...dropDefinition.input, ...accumulatedData }
  context,          // { flowName, ...initialContext }
  updateContext,    // (updates) => void
  accumulatedData,  // { [dropId]: outputData }
  onComplete,       // (outputData) => void - triggers navigation
  onBack,           // () => void
  canGoBack,        // boolean - true if history exists at this depth
  flowName,         // string
  dropId            // string
})
```

### Completing a Drop

Call `onComplete(outputData)` to signal completion and trigger navigation:

```javascript
const handleSubmit = () => {
  onComplete({ action: 'submitted', data: formData });
};

const handleCancel = () => {
  onComplete({ action: 'cancel' });
};
```

The `outputData` is:
1. Stored in `accumulatedData[dropId]`
2. Passed to navigation rules to determine next drop
3. Available to subsequent drops via `input`

---

## Depth System

Drops can have different depths. Drops at the same depth share a modal. Drops at higher depths render in stacked overlay modals on top.

```
depth 0: [landing] -> [list] -> [respond]
                                    |
                                    v
depth 1:                    [confirmation]
                                    |
                                    v
depth 0:                        [list]
```

### Depth Behavior

| Navigation | What Happens |
|------------|--------------|
| Same depth (0 → 0) | Content swaps within same modal, history grows |
| Higher depth (0 → 1) | New modal opens on top, base modal stays visible |
| Lower depth (1 → 0) | Overlay closes, base modal navigates |

### Back Button

The back button only appears if there's navigation history at that depth. It does NOT appear just because you're at depth > 0.

```javascript
// Back button shown if:
canGoBack = history.length > 1  // Has previous drops at this depth

// NOT based on depth alone
```

### Close Button

The close button can be hidden per-drop using `showClose: false`. Use this for confirmation overlays where you want to force the user to click a specific action button.

```javascript
'flow:confirmation': {
  component: ConfirmationOverlay,
  depth: 1,
  showClose: false,  // No X button - must click Continue
  next: [
    { when: (output) => output.action === 'continue', goto: 'flow:list' }
  ]
}
```

---

## Size Presets

For overlay modals (depth > 0), you can specify a size:

| Size | Dimensions |
|------|------------|
| `small` | 350 x 300 |
| `medium` | 450 x 400 |
| `large` | 550 x 500 |
| none | Full modal size |

```javascript
'flow:overlay': {
  component: SmallOverlay,
  depth: 1,
  size: 'small',
  // ...
}
```

---

## Navigation Rules

Each drop has a `next` array of navigation rules evaluated in order:

```javascript
next: [
  {
    when: (output, accumulatedData, context) => output.action === 'submit',
    goto: 'flow:success'
  },
  {
    when: (output) => output.action === 'cancel',
    goto: 'flow:list'
  },
  {
    when: true,  // Always matches (fallback)
    goto: 'flow:default'
  },
  {
    when: (output) => output.action === 'done',
    goto: null  // Close the flow
  }
]
```

### Rule Properties

| Property | Type | Description |
|----------|------|-------------|
| `when` | function or `true` | Condition to match |
| `goto` | string or `null` | Target drop ID, or `null` to close flow |

---

## Example: Overlay Confirmation Flow

```javascript
// Flow definition
export const myFlow = {
  name: 'myFlow',
  title: 'My Flow',
  startAt: 'myFlow:form',

  drops: {
    'myFlow:form': {
      component: FormDrop,
      depth: 0,
      next: [
        { when: (o) => o.action === 'submitted', goto: 'myFlow:confirmation' }
      ]
    },

    'myFlow:confirmation': {
      component: ConfirmationDrop,
      depth: 1,
      size: 'medium',
      title: 'Success!',
      showClose: false,  // Force user to click Continue
      next: [
        { when: (o) => o.action === 'continue', goto: 'myFlow:list' }
      ]
    },

    'myFlow:list': {
      component: ListDrop,
      depth: 0,
      next: [
        { when: (o) => o.action === 'back', goto: 'myFlow:form' }
      ]
    }
  }
};
```

```javascript
// ConfirmationDrop component
const ConfirmationDrop = ({ input, onComplete }) => {
  // Access data from previous drop
  const formOutput = input['myFlow:form'] || {};

  return (
    <View>
      <Text>Your submission was successful!</Text>
      {formOutput.itemName && (
        <Text>Created: {formOutput.itemName}</Text>
      )}
      <WoolButton
        title="CONTINUE"
        onPress={() => onComplete({ action: 'continue' })}
      />
    </View>
  );
};
```

---

## FlowEngine State

FlowEngine manages state per depth:

```javascript
// Current drop at each depth
dropsByDepth = { 0: 'flow:respond', 1: 'flow:confirmation' }

// Navigation history per depth
historyByDepth = { 0: ['flow:landing', 'flow:list', 'flow:respond'], 1: ['flow:confirmation'] }

// Accumulated output data from all drops
accumulatedData = {
  'flow:landing': { action: 'view' },
  'flow:list': { action: 'respond', postId: '123' },
  'flow:respond': { action: 'submitted', heartsAwarded: 3 }
}
```

---

## Files

| File | Purpose |
|------|---------|
| `/frontend/components/FlowEngine.js` | Renders modals, manages navigation |
| `/frontend/components/Modal.js` | Modal component with depth/size support |
| `/frontend/flows/*.js` | Flow definitions |
| `/frontend/components/drops/*.js` | Drop components |
