---
schema_version: 2
id: drift/testing-coverage-near-zero
type: drift
title: Tests exist for one flow only; coverage targets unenforceable
status: open
last_audited: 2026-05-22
cause: unimplemented
auto_accept_after: 90
drifts_from:
  - spec/testing-conventions
affects:
  - component/ServerSocketHandlers
  - component/WebSocketService
  - component/PositivityBoard
  - component/PostsList
  - component/WorkbookActivity
source_doc:
  - doc/testing
---

## Symptom

`spec/testing-conventions` R7 sets tiered coverage targets (backend flows 80%, backend models 90%, frontend stores 80%, frontend components 70%). The only test in the entire repo (outside `node_modules`) is `backend/src/flows/weepingWillow.test.js`. There are:

- 0 model tests (90% target).
- 0 frontend store tests (80% target). 20+ stores untested.
- 0 frontend component tests (70% target).
- 0 integration tests in `__tests__/` directories.
- 0 CI workflow file at `.github/workflows/test.yml` (R8).

`npm test` runs successfully and reports near-100% coverage of the one tested file. But the spec's intent — actually catching regressions — is not delivered.

## Resolution

This drift is the project tracking item: "build out the test suite". Sub-tasks:

1. Add `frontend/jest.config.js` and `jest-expo` preset.
2. Add at least one frontend store test (e.g. `FormStore.test.js` per the spec's example).
3. Add at least one model test (e.g. `WeepingWillowPost.test.js` per the spec's example).
4. Add `.github/workflows/test.yml` to run both suites on PR.
5. Document a per-PR convention: "new flows ship with at least one handler test".

Until then, R7 and R8 of [[spec/testing-conventions]] are aspirational, and any "test coverage gate" mentioned in a CLAUDE.md update would be a no-op.

`auto_accept_after: 90` (2026-08-20) — if unresolved by then, the convention reading becomes "test what you can; coverage targets are guidelines, not gates" and this drift is accepted.

## Audit log

| Date       | Agent           | Note                                                              |
|------------|-----------------|-------------------------------------------------------------------|
| 2026-05-22 | architecture-meta | Drift recorded. One test file exists; spec implies suite-wide coverage. |
