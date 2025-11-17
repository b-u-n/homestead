# Homestead Development Guidelines

## Modal Pattern

When implementing modals in this application, always use the standard `Modal` component located at `frontend/components/Modal.js`.

### Usage

```jsx
import Modal from '../components/Modal';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="MODAL TITLE"
      >
        {/* Your content here */}
        <Text>Modal content goes here</Text>
      </Modal>
    </>
  );
};
```

### Features

- **Styling**: Uses the app's vaporwave aesthetic with button-bg texture, stitched borders
- **Responsive**: 80% of screen on desktop, 100% on mobile
- **Closable**: X button in top-right corner
- **Backdrop**: Semi-transparent backdrop that closes modal when clicked
- **Scrollable**: Content area scrolls if content exceeds modal height

### Props

- `visible` (boolean): Controls modal visibility
- `onClose` (function): Called when user closes the modal (X button or backdrop click)
- `title` (string): Title displayed in modal header (will be styled with ChubbyTrail font)
- `children` (ReactNode): Content to display in the modal

## Design System

### Fonts
- **Headers**: ChubbyTrail (imported via app/_layout.tsx)
- **Subheaders**: PWDottedFont (uppercase only)
- **Body**: Comfortaa

### Colors
- **Primary Text**: `#403F3E`
- **Secondary Text**: `#5C5A58`
- **Border**: `rgba(92, 90, 88, 0.55)`
- **Background Accent**: `rgba(222, 134, 223, 0.1)`
- **Button Hover**: `rgba(179, 230, 255, 0.4)`

### Common Patterns
- All titles should be uppercase (use `.toUpperCase()`)
- Use stitched borders from `StitchedBorder` component
- Background textures use button-bg.png at 20% opacity
- Buttons scale to 1.06 on hover
- Text shadows use 0.5px offset with `rgba(0, 0, 0, 0.5)`

## WebSocket Communication

All real-time features use WebSocket via `frontend/services/websocket.js`.

### Pattern

```javascript
import WebSocketService from '../services/websocket';

// Emit event and wait for response
const result = await WebSocketService.emit('eventName', { data });

// Handle server broadcasts
WebSocketService.socket.on('eventName', (data) => {
  // Handle broadcast
});
```

### Error Handling

Always wrap WebSocket calls in try-catch:

```javascript
try {
  const result = await WebSocketService.emit('eventName', { data });
  if (result.success) {
    // Handle success
  }
} catch (error) {
  console.error('Error:', error);
  ErrorStore.addError(error.message);
}
```

## State Management

This app uses MobX for state management. Stores are located in `frontend/stores/`.

### Existing Stores
- `AuthStore`: User authentication
- `ProfileStore`: User profile data (avatar, username, energy, hearts)
- `SessionStore`: Session management
- `InventoryStore`: Player inventory
- `ErrorStore`: Global error handling

### Pattern

```javascript
import { makeAutoObservable } from 'mobx';

class MyStore {
  data = null;

  constructor() {
    makeAutoObservable(this);
  }

  setData(data) {
    this.data = data;
  }
}

export default new MyStore();
```

Components should use `observer` from `mobx-react-lite`:

```javascript
import { observer } from 'mobx-react-lite';

const MyComponent = observer(() => {
  return <Text>{myStore.data}</Text>;
});
```

## Flow Engine Pattern

The Flow Engine is a declarative workflow system for managing multi-step UI flows. It provides a reusable way to create wizard-like experiences with proper state management and navigation.

### Concepts

- **Flow**: A collection of related drops (steps) with a defined starting point
- **Drop**: A single step/screen in the flow (like a page in a wizard)
- **Namespacing**: All drops are namespaced to their flow (e.g., `wishingWell:landing`)
- **Flow Definition**: Declarative configuration defining drops, routing, and logic
- **Context**: Shared data accessible to all drops in the flow
- **Accumulated Data**: Output from previous drops, passed to subsequent drops

### Flow Definition Structure

```javascript
const myFlow = {
  name: 'myFlow',              // Flow namespace
  title: 'MY FLOW TITLE',      // Modal title
  startAt: 'myFlow:landing',   // Initial drop ID
  drops: {
    'myFlow:landing': {
      component: LandingDrop,
      input: {},               // Expected input schema
      output: {},              // Output schema this drop produces
      next: [                  // Routing logic
        {
          when: (output) => output.action === 'continue',
          goto: 'myFlow:step2'
        },
        {
          when: (output) => output.action === 'cancel',
          goto: null  // null = end flow
        }
      ]
    },
    'myFlow:step2': {
      component: Step2Drop,
      input: {},
      output: {},
      next: [
        { when: true, goto: 'myFlow:landing' }
      ]
    }
  }
};
```

### Using FlowEngine

```javascript
import FlowEngine from '../components/FlowEngine';
import { myFlowDefinition } from '../flows/myFlow';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FlowEngine
      flowDefinition={myFlowDefinition}
      visible={isOpen}
      onClose={(finalData) => {
        setIsOpen(false);
        // Handle flow completion with finalData
      }}
      initialContext={{
        userId: 'user123',
        // Any initial context data
      }}
    />
  );
};
```

### Creating a Drop Component

Each drop receives these props:

```javascript
const MyDrop = ({
  input,           // Input data (includes accumulated data from previous drops)
  context,         // Shared context for the flow
  updateContext,   // Function to update context
  accumulatedData, // All data from previous drops
  onComplete,      // Call with output data to proceed to next drop
  onBack,          // Navigate back to previous drop
  canGoBack,       // Boolean indicating if back navigation is available
  flowName,        // The flow namespace
  dropId           // Current drop ID
}) => {
  const handleContinue = () => {
    // Output data that determines next drop
    onComplete({
      action: 'continue',
      selectedValue: 'foo'
    });
  };

  return (
    <View>
      <Text>My Drop Content</Text>
      {canGoBack && <Button onPress={onBack}>Back</Button>}
      <Button onPress={handleContinue}>Continue</Button>
    </View>
  );
};
```

### Routing Logic

Routes are evaluated in order. First matching route is taken:

```javascript
next: [
  {
    when: (output, accumulated, context) => output.value > 100,
    goto: 'myFlow:highValue'
  },
  {
    when: (output) => output.value > 50,
    goto: 'myFlow:mediumValue'
  },
  {
    when: true,  // Default/fallback route
    goto: 'myFlow:lowValue'
  }
]
```

### Backend Flow Engine

Backend flows follow the same pattern but handle WebSocket events:

```javascript
// backend/src/flows/myFlow.js
module.exports = {
  name: 'myFlow',
  handlers: {
    'myFlow:action:doSomething': {
      input: { /* validation schema */ },
      handler: async (data, { socket, io, user }) => {
        // Business logic
        return { success: true, data: result };
      },
      output: { /* output schema */ }
    }
  }
};
```

### Best Practices

1. **Namespacing**: Always use `flowName:dropName` format for drop IDs
2. **Input/Output**: Document expected input and output schemas
3. **Context vs Accumulated**: Use context for shared flow-wide data, accumulated for step-specific results
4. **Validation**: Validate input in drop components and backend handlers
5. **Error Handling**: Handle errors gracefully and provide feedback to users
6. **Reusability**: Design drops to be reusable across different flows when possible
