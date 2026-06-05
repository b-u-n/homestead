---
schema_version: 2
id: drift/build-user-object-duplicated
type: drift
title: buildUserObject helper duplicated across 7+ flow files
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/architecture-overview
affects:
  - component/ServerSocketHandlers
source_doc:
  - doc/architecture
---

## Symptom

`md/ARCHITECTURE.md` presents a single canonical `buildUserObject(account)` helper under "Helper Function". In reality the function is **redefined verbatim** in seven different backend flow files:

- `backend/src/flows/admin.js` (line 8)
- `backend/src/flows/bazaar.js` (line 30)
- `backend/src/flows/knapsack.js` (line 8)
- `backend/src/flows/moderation.js` (line 8)
- `backend/src/flows/pixelPals.js` (line 10)
- `backend/src/flows/weepingWillow.js` (line 9)
- `backend/src/flows/wishingWell.js` (line 8)

Each copy is identical today, but copy-paste reuse is unstable under change. If the user object shape gets a new field (e.g. `pronouns`, `badges`), seven files need to be updated, and the inevitable miss produces inconsistent author records across feature surfaces.

This is precisely the shape `spec/architecture-overview` R3 warns against, just one level down: the spec sets the snapshot shape; the helper is the only place that should produce it.

## Resolution

Move `buildUserObject` to `backend/src/utils/userObject.js` (alongside `featureAccess.js`, `itemHelpers.js`). Update all seven flow files to `const { buildUserObject } = require('../utils/userObject')`. Delete the local copies.

Low-risk refactor — the function body is identical across all seven sites today. Worth doing before the next user-shape field lands.

## Audit log

| Date       | Agent           | Note                                                              |
|------------|-----------------|-------------------------------------------------------------------|
| 2026-05-22 | architecture-meta | Drift recorded. 7 identical copies of buildUserObject found via grep. |
