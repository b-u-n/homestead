---
schema_version: 2
id: drift/testing-doc-says-unimplemented
type: drift
title: TESTING.md claims "not yet implemented" but infra is partly built
status: open
last_audited: 2026-05-22
cause: overridden_in_code
auto_accept_after: 90
drifts_from:
  - spec/testing-conventions
affects:
  - component/ServerSocketHandlers
source_doc:
  - doc/testing
---

## Symptom

`md/TESTING.md` opens (line 5–7) with:

> **Testing infrastructure is not yet implemented.** This document outlines the recommended setup.

This is stale. The backend has, today:

- `backend/jest.config.js` (Jest configured for `**/*.test.js`, with `setupFilesAfterEnv`).
- `backend/package.json` devDeps include `jest@^30`, `mongodb-memory-server@^10`, `@types/jest`, `ts-jest`.
- `backend/package.json` scripts: `test`, `test:watch`, `test:coverage`.
- `backend/src/tests/setup.js` (mongo memory server boot/teardown).
- `backend/src/tests/fixtures/accounts.js` (account factory).
- `backend/src/tests/utils/context.js` (websocket mock context).
- `backend/src/flows/weepingWillow.test.js` (one real co-located flow test).

The frontend half of the doc's recommendation is still aspirational — no `frontend/jest.config.js`, no `frontend/**/*.test.js` outside `node_modules`.

The doc's opening framing makes a reader assume nothing exists; the reality is that the backend stack is built out (per the doc's own recipe) and the frontend stack is not.

## Resolution

Rewrite `md/TESTING.md`'s opening section to reflect the actual state:

- "Backend testing infrastructure is in place. Frontend testing infrastructure is not yet set up."
- Move the "Backend Setup" section from "Recommended" to "Current" tense.
- Keep "Frontend Setup" as recommended/pending.
- Add a "Status by surface" table at the top so a reader sees the gap at a glance.

When that lands, `spec/testing-conventions` flips from `drifting` to `stable` and this drift closes.

## Audit log

| Date       | Agent           | Note                                                              |
|------------|-----------------|-------------------------------------------------------------------|
| 2026-05-22 | architecture-meta | Drift recorded during graph build. Backend infra exists; doc still says it doesn't. |
