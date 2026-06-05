---
schema_version: 2
id: spec/feature-rollout-process
type: spec
title: Feature Rollout Process (Progressive Unlock)
status: stable
last_audited: 2026-05-22
tags: [features, gating]
source_doc:
  - doc/features
references:
  - spec/architecture-overview
---

## Rules

### R1: Each account has a `featureLevel` Number field; default 0

`Account.featureLevel` is a numeric tier. Level 0 is the free/base tier. Higher numbers unlock additional features. Feature levels are stored on the Account document, not in a side collection.

**Why:** Single integer on the user doc = single read to know everything that user can see. No joins, no cache layer.
**Evidence:** `md/FEATURES.md` "Account field: `Account.featureLevel`"; `backend/src/models/Account.js`.
**Test:** Manual — inspect any account document.

### R2: Features map IDs → required levels in a single flat config

`backend/src/config/featureLevels.js` exports a flat object: feature ID string → minimum required level. No nesting, no inheritance. Feature IDs are colon-namespaced: `{area}:{category}:{item}` (e.g. `pixelPals:size:48x48`).

**Why:** Flat config is greppable. Nested config gets re-shaped every time a feature taxonomy changes.
**Evidence:** `md/FEATURES.md` "Feature Level Config".
**Test:** Read `backend/src/config/featureLevels.js`; values are integers, keys are colon-prefixed strings.

### R3: Backend access check is `hasFeature(account, featureId)`; frontend is `FeatureStore.has(featureId)`

Backend handlers check via `hasFeature(account, 'feature:id')` from `backend/src/utils/featureAccess.js`. Frontend components check via `FeatureStore.has('feature:id')` (MobX store). Both return boolean.

**Why:** Two parallel checks (backend authoritative, frontend cosmetic) means a stale client cannot bypass gating — the server always re-checks.
**Evidence:** `md/FEATURES.md` "How It Works"; `backend/src/utils/featureAccess.js`; `frontend/stores/FeatureStore.js`.
**Test:** Grep for handlers that call `hasFeature`; their frontend caller should call `FeatureStore.has` for the same ID.

### R4: Gated features are INVISIBLE, not disabled

A feature the user lacks access to is not rendered at all — no greyed-out button, no "locked" overlay, no tooltip explaining why. If `FeatureStore.has(id)` is false, the component returns `null` for that option.

**Why:** Avoids the upsell-funnel feel; absent features create curiosity rather than friction. Also: a locked UI element is N pixels of dead code that have to be tested, styled, and ignored.
**Evidence:** `md/FEATURES.md` first paragraph: "features that require a level above the player's are **invisible**".
**Test:** Manual — open the app at level 0; level-1+ options simply do not appear.

### R5: `setFeatureLevel(accountId, level)` is the single mutation point

Levels change only via `setFeatureLevel` from `backend/src/utils/featureAccess.js`, either invoked directly in backend code or through the admin-only `features:setLevel` WebSocket event. No other code path writes `Account.featureLevel`.

**Why:** When payment integration lands, every leveling-up path goes through one function. Direct `Account.findByIdAndUpdate({ featureLevel })` would scatter that integration across the codebase.
**Evidence:** `md/FEATURES.md` "Setting a Player's Level"; `md/FEATURES.md` "Integration Notes" — `setFeatureLevel` is the single point of control.
**Test:** `grep -rn "featureLevel" backend/src/ | grep -v "config/feature\|utils/feature\|tests/"` should be empty (currently aspirational).

### R6: Wire events for the feature surface are `features:mine` and `features:setLevel`

`features:mine` (client→server) returns the list of feature IDs the requesting user has access to. `features:setLevel` (client→server, admin-only) takes `{ sessionId, targetAccountId, level }`. The frontend `FeatureStore` calls `features:mine` once on connect.

**Why:** Two events suffice — one to read, one (admin) to write. No `features:get`, `features:check`, etc. proliferation.
**Evidence:** `md/FEATURES.md` "WebSocket Events" table.
**Test:** `grep "features:" backend/src/flows/features.js`.

## Notes

This spec is the contract for the **gating** layer. The features themselves live in their own concept nodes (`concept/pixelpals`, etc.). Level 0 must always be the free tier — the doc names this convention explicitly and the codebase relies on it. When payment integration is added, this spec's R5 becomes the integration seam.
