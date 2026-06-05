---
schema_version: 2
id: spec/testing-conventions
type: spec
title: Testing Conventions
status: drifting
last_audited: 2026-05-22
tags: [testing]
source_doc:
  - doc/testing
---

## Rules

### R1: Tests are co-located with the code they cover

Backend: `backend/src/flows/weepingWillow.js` → `backend/src/flows/weepingWillow.test.js`. Frontend: `frontend/components/drops/PostsList.js` → `frontend/components/drops/PostsList.test.js`. Integration tests live in `__tests__/` directories. Fixtures live in `backend/src/tests/fixtures/`; test utilities in `backend/src/tests/utils/`.

**Why:** A test next to its target is found, run, and updated together. Tests in a far-away directory rot first.
**Evidence:** `md/TESTING.md` "Test File Structure"; `backend/src/flows/weepingWillow.test.js` is the only co-located test in the repo today.
**Test:** Manual — any test file outside the conventions above is a violation candidate.

### R2: Backend tests use Jest + MongoDB Memory Server

Test runner is Jest (`backend/package.json` `test` script). Each test run spins up an in-memory MongoDB via `mongodb-memory-server`, connects mongoose, and drops collections between tests. Setup is centralised in `backend/src/tests/setup.js` and wired via `setupFilesAfterEnv` in `backend/jest.config.js`.

**Why:** Real Mongoose models in tests catch schema-level bugs (required fields, indexes) that a mock would miss. In-memory keeps tests hermetic and fast.
**Evidence:** `backend/jest.config.js`; `backend/src/tests/setup.js`.
**Test:** `cd backend && npm test` runs without an external DB.

### R3: Flow handlers are tested through the handler function, not the socket

A flow handler test imports the flow definition, picks the handler off `flow.handlers['<event>'].handler`, builds a fake context via `createTestContext` (mock socket + mock io), and invokes the handler directly. The socket itself is not booted.

**Why:** Isolates business logic from transport. Broadcast assertions check `context.io.emit` was called with the right event name and payload shape.
**Evidence:** `md/TESTING.md` "Backend: Flow Handler Test"; `backend/src/tests/utils/context.js` builds the fake context.
**Test:** Read `backend/src/flows/weepingWillow.test.js` — handler is called directly, broadcasts asserted on the mock `io`.

### R4: Account fixtures are built via factory functions, not raw literals

Test accounts come from `backend/src/tests/fixtures/accounts.js` `createAccount(overrides)`. Each call generates a unique `sessionId` and persists a real Account document. Tests pass `overrides` to vary heart count, username, role, etc.

**Why:** Centralising the shape of a "default test account" means schema changes (added required fields, new defaults) update in one place.
**Evidence:** `md/TESTING.md` "Account Factory"; `backend/src/tests/fixtures/accounts.js`.
**Test:** Read the existing fixture file; every test that needs an account calls the factory.

### R5: Frontend component tests mock the WebSocket service

`frontend/services/websocket.js` is mocked at the module level via `jest.mock`. The mock exposes `emit` (returning a configured promise) and `socket.on / socket.off`. Components under test never touch a real socket.

**Why:** Component tests are about render + interaction, not network. Mocking the wire decouples test failures from server availability.
**Evidence:** `md/TESTING.md` "Frontend: Component Test" — `jest.mock('@/services/websocket', ...)`.
**Test:** No frontend tests exist yet in the repo to point at; rule is currently aspirational.

### R6: Stores are tested directly, without React

MobX stores are plain classes. Store tests import the singleton, exercise its methods, assert on its observable properties. No `render()`, no `act()`, no React Testing Library — just object-level assertions.

**Why:** Stores are state machines; React is the renderer. Testing them independently keeps the store contract clear and removes the slowest part of the test stack.
**Evidence:** `md/TESTING.md` "Frontend: Store Test".
**Test:** No frontend store tests exist yet in the repo.

### R7: Coverage targets are tiered by code role

- Backend flows: 80%
- Backend models: 90% (model validation is the type system here)
- Frontend stores: 80%
- Frontend components: 70% (rendering branches don't all need coverage)

**Why:** Higher cost-of-bug code gets higher coverage. Model validation buys input-shape safety for the whole backend; components are visual, easier to spot-check.
**Evidence:** `md/TESTING.md` "Coverage Targets".
**Test:** `npm test -- --coverage` enforced at PR time once CI lands.

### R8: CI runs tests on every push and PR to `main`

`.github/workflows/test.yml` runs backend and frontend test suites in parallel jobs on `push` and `pull_request` to `main`. Each job installs deps, runs `npm test -- --coverage`, uploads coverage to Codecov.

**Why:** Test rot starts the day a test stops running on the default branch. CI is the only mechanism that catches regressions before merge.
**Evidence:** `md/TESTING.md` "CI/CD Integration" (recommends; not yet implemented).
**Test:** `ls .github/workflows/` — `test.yml` should exist (drift: it does not as of audit).

## Notes

`status: drifting` because `md/TESTING.md` opens with "Testing infrastructure is not yet implemented" — but the backend has `jest.config.js`, devDeps (`jest`, `mongodb-memory-server`), `npm test` scripts, a setup file, and one real test (`weepingWillow.test.js`). The doc's framing is stale. See [[drift/testing-doc-says-unimplemented]] and [[drift/testing-coverage-near-zero]]. Once frontend test infra lands and TESTING.md is rewritten to reflect reality, this spec flips to `stable`.
