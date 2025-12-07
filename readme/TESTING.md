# Testing Configuration

This document describes the testing setup for the Homestead platform.

## Current Status

**Testing infrastructure is not yet implemented.** This document outlines the recommended setup.

---

## Recommended Stack

### Backend
- **Test Runner:** Jest or Vitest
- **Assertions:** Built-in Jest/Vitest matchers
- **Mocking:** Jest mocks or Vitest vi
- **Database:** MongoDB Memory Server for isolated tests

### Frontend
- **Test Runner:** Jest (with Expo preset) or Vitest
- **Component Testing:** React Testing Library
- **E2E Testing:** Detox (React Native) or Maestro

---

## Backend Setup

### Installation

```bash
cd backend
npm install -D jest @types/jest ts-jest mongodb-memory-server
```

### Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/seeds/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js']
};
```

### Test Setup File

Create `src/tests/setup.js`:

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Frontend Setup

### Installation

```bash
cd frontend
npm install -D jest @types/jest jest-expo @testing-library/react-native @testing-library/jest-native
```

### Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testMatch: ['**/*.test.tsx', '**/*.test.ts', '**/*.test.js'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts'
  ]
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Test File Structure

```
backend/
├── src/
│   ├── tests/
│   │   ├── setup.js              # Test setup/teardown
│   │   ├── fixtures/             # Test data factories
│   │   │   ├── accounts.js
│   │   │   └── posts.js
│   │   └── utils/                # Test utilities
│   │       └── websocket-mock.js
│   ├── flows/
│   │   ├── weepingWillow.js
│   │   └── weepingWillow.test.js # Co-located tests
│   └── models/
│       ├── WeepingWillowPost.js
│       └── WeepingWillowPost.test.js

frontend/
├── components/
│   └── drops/
│       ├── PostsList.js
│       └── PostsList.test.js
├── stores/
│   ├── FormStore.js
│   └── FormStore.test.js
└── __tests__/                    # Integration tests
    └── weepingWillow.test.js
```

---

## Example Tests

### Backend: Flow Handler Test

```javascript
// src/flows/weepingWillow.test.js
const { createTestContext } = require('../tests/utils/websocket-mock');
const { createAccount } = require('../tests/fixtures/accounts');
const weepingWillowFlow = require('./weepingWillow');

describe('weepingWillow:posts:create', () => {
  let context;
  let account;

  beforeEach(async () => {
    context = createTestContext();
    account = await createAccount({ hearts: 5 });
  });

  it('should create a post and deduct hearts', async () => {
    const handler = weepingWillowFlow.handlers['posts:create'];

    const result = await handler.handler({
      sessionId: account.activeSessions[0].sessionId,
      content: 'Need help with testing',
      hearts: 3
    }, context);

    expect(result.success).toBe(true);
    expect(result.data.content).toBe('Need help with testing');
    expect(result.data.hearts).toBe(3);

    // Verify hearts deducted
    const updatedAccount = await Account.findById(account._id);
    expect(updatedAccount.hearts).toBe(2);
  });

  it('should fail if insufficient hearts', async () => {
    const handler = weepingWillowFlow.handlers['posts:create'];

    await expect(handler.handler({
      sessionId: account.activeSessions[0].sessionId,
      content: 'Test',
      hearts: 10
    }, context)).rejects.toThrow('Insufficient hearts');
  });

  it('should broadcast newPost event', async () => {
    const handler = weepingWillowFlow.handlers['posts:create'];

    await handler.handler({
      sessionId: account.activeSessions[0].sessionId,
      content: 'Test post',
      hearts: 1
    }, context);

    expect(context.io.emit).toHaveBeenCalledWith(
      'weepingWillow:newPost',
      expect.any(Object)
    );
  });
});
```

### Backend: Model Validation Test

```javascript
// src/models/WeepingWillowPost.test.js
const WeepingWillowPost = require('./WeepingWillowPost');

describe('WeepingWillowPost Model', () => {
  it('should require content', async () => {
    const post = new WeepingWillowPost({ hearts: 1 });
    await expect(post.validate()).rejects.toThrow('content');
  });

  it('should enforce max content length', async () => {
    const post = new WeepingWillowPost({
      content: 'x'.repeat(501),
      hearts: 1,
      authorSessionId: 'test',
      authorName: 'Test'
    });
    await expect(post.validate()).rejects.toThrow();
  });

  it('should require minimum 1 heart', async () => {
    const post = new WeepingWillowPost({
      content: 'Test',
      hearts: 0,
      authorSessionId: 'test',
      authorName: 'Test'
    });
    await expect(post.validate()).rejects.toThrow();
  });
});
```

### Frontend: Component Test

```javascript
// components/drops/PostsList.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PostsList from './PostsList';
import WebSocketService from '@/services/websocket';

jest.mock('@/services/websocket', () => ({
  emit: jest.fn(),
  socket: {
    on: jest.fn(),
    off: jest.fn()
  }
}));

describe('PostsList', () => {
  const mockPosts = [
    {
      _id: '1',
      content: 'Need help',
      hearts: 3,
      authorName: 'TestUser',
      responses: [],
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    WebSocketService.emit.mockResolvedValue({ data: mockPosts });
  });

  it('should render posts', async () => {
    const { getByText } = render(
      <PostsList flowName="weepingWillow" onComplete={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Need help')).toBeTruthy();
      expect(getByText('TestUser')).toBeTruthy();
    });
  });

  it('should filter posts when filter button pressed', async () => {
    const { getByText } = render(
      <PostsList flowName="weepingWillow" onComplete={jest.fn()} />
    );

    fireEvent.press(getByText('UNRESPONDED'));

    await waitFor(() => {
      expect(WebSocketService.emit).toHaveBeenCalledWith(
        'weepingWillow:posts:get',
        expect.objectContaining({ filter: 'unresponded' })
      );
    });
  });

  it('should subscribe to real-time updates', () => {
    render(<PostsList flowName="weepingWillow" onComplete={jest.fn()} />);

    expect(WebSocketService.socket.on).toHaveBeenCalledWith(
      'weepingWillow:newPost',
      expect.any(Function)
    );
    expect(WebSocketService.socket.on).toHaveBeenCalledWith(
      'weepingWillow:postUpdated',
      expect.any(Function)
    );
  });
});
```

### Frontend: Store Test

```javascript
// stores/FormStore.test.js
import FormStore from './FormStore';

describe('FormStore', () => {
  beforeEach(() => {
    FormStore.resetForm('createPost');
  });

  it('should update form field', () => {
    FormStore.updateField('createPost', 'content', 'Test content');
    expect(FormStore.createPost.content).toBe('Test content');
  });

  it('should reset form to defaults', () => {
    FormStore.updateField('createPost', 'content', 'Test');
    FormStore.updateField('createPost', 'hearts', 5);

    FormStore.resetForm('createPost');

    expect(FormStore.createPost.content).toBe('');
    expect(FormStore.createPost.hearts).toBe(1);
  });
});
```

---

## Test Fixtures

### Account Factory

```javascript
// src/tests/fixtures/accounts.js
const Account = require('../../models/Account');
const { v4: uuidv4 } = require('uuid');

async function createAccount(overrides = {}) {
  const sessionId = uuidv4();

  const account = new Account({
    hearts: 5,
    heartBank: 0,
    userData: {
      username: `TestUser_${Date.now()}`,
      avatar: 'default'
    },
    activeSessions: [{
      sessionId,
      createdAt: new Date(),
      lastActiveAt: new Date()
    }],
    ...overrides
  });

  await account.save();
  return account;
}

module.exports = { createAccount };
```

### WebSocket Mock

```javascript
// src/tests/utils/websocket-mock.js
function createTestContext() {
  return {
    socket: {
      id: 'test-socket-id',
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn()
    },
    io: {
      emit: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() }))
    },
    flowName: 'weepingWillow',
    eventName: 'test'
  };
}

module.exports = { createTestContext };
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          directory: backend/coverage

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          directory: frontend/coverage
```

---

## Running Tests

### Backend

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run specific file
npm test -- weepingWillow.test.js

# Run tests matching pattern
npm test -- --testNamePattern="create post"
```

### Frontend

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Coverage Targets

| Area | Minimum Coverage |
|------|-----------------|
| Backend Flows | 80% |
| Backend Models | 90% |
| Frontend Stores | 80% |
| Frontend Components | 70% |

---

## Next Steps

1. Install testing dependencies in both backend and frontend
2. Create test setup files
3. Write tests for existing Weeping Willow functionality
4. Set up CI/CD pipeline
5. Add pre-commit hooks to run tests
