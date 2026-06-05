# Graph Index

Roster of all nodes by type and status. Schema v2. The filesystem is the source of truth — run `node graph/_traverse.js validate` after any edit.

## Counts

**211 nodes, validates clean.**

| Type | Count | Notes |
|------|-------|-------|
| `concept/` | 16 | Feature surfaces + 2 cross-cutting (permissions, architecture) now `governs` feature concepts via v2 widening |
| `spec/` | 36 | Numbered-rule contracts; 35 lack `tested_by` (Phase 3 work) |
| `pattern/` | 22 | Recurring implementation strategies |
| `component/` | 53 | Hand-curated code modules; `FlowEngine` is split into `.frontend` + `.backend` paired via `pairs_with`; `VaporwaveButton` is a `aliases:` entry on `WoolButton`, not a separate node |
| `token/` | 24 | Design-system values |
| `doc/` | 36 | Prose source files (auto-promoted from v1 `source_doc:` properties). Replaces the old string-array property model. |
| `drift/` | 24 | Observed deviations — see roster below |

## Status distribution

| Status | Count |
|--------|-------|
| `stable` | 172 |
| `open` (drift only) | 24 |
| `drifting` | 13 |
| `deprecated` | 1 |
| `wip` | 1 |

## Concepts (16)

`activity-system` · `badge-system` · `bazaar` · `games` · `heart-economy` (drifting) · `homestead-architecture` (governs 5 feature concepts) · `items-inventory` · `permissions-and-roles` (governs 5 feature concepts) · `pixelpals` · `room-editor` · `user-customization` · `user-settings` · `vaporwave-aesthetic` · `weeping-willow` · `wire-protocol` · `wishing-well`

The two formerly orphan concepts (`homestead-architecture`, `permissions-and-roles`) now use the v2 `governs: concept → concept` edge to express their cross-cutting role. Audit reports `0 unreferenced`.

## Specs (36) — grouped by domain

- **Design system:** `design-tokens` (drifting) · `emboss-effect` · `minky-panel` · `button-system` · `checkbox-pattern` · `modal-pattern` · `scrollbar-system` · `textbox-autoexpand` · `mobile-wheel-touch` · `badge-styling-pattern`
- **Activities/workbooks:** `activity-v2` · `activity-v1-legacy` (deprecated) · `flow-engine` · `workbook-system`
- **Wire/auth:** `websocket-protocol` · `notification-system` · `error-handling` · `permissions-model` (drifting) · `role-system`
- **Features:** `bazaar-submission-flow` · `bazaar-moderation-pipeline` · `bazaar-pricing` · `wishing-well-board` · `weeping-willow-posting` · `room-editor-canvas` · `room-editor-overlay-model` · `pixelpals-game-modes` · `pixelpals-credit-system`
- **User/currency:** `heart-balance-and-spending` (drifting) · `avatar-customization-flow` · `user-settings-modal` · `item-portability-and-inventory` (drifting) · `games-flow-fullscreen`
- **Architecture/meta:** `architecture-overview` · `testing-conventions` · `feature-rollout-process`

## Drifts (24) — the actual deviation surface

Highest-value reading. Each is a current deviation between spec/doc and code (or between two docs/specs).

**Design system (7):**
- `colors-primary-text-conflict` — COLORS.md `#403F3E` vs ART_STYLE.md `#2D2C2B` — seed drift; now also `affects token/color-primary-text`
- `colors-secondary-text-conflict` — COLORS.md `#5C5A58` vs ART_STYLE.md `#454342` — `affects token/color-secondary-text`
- `colors-accent-overlay-divergence` — green/coral; **resolved investigation**: COLORS matches code, ART_STYLE values unused
- `fonts-canonical-list-divergence` — CLAUDE.md vs ART_STYLE.md disagree on the official font list; `affects token/font-header`
- `fonts-button-label-divergence` — 3-way: BUTTONS.md / ART_STYLE.md / ButtonBase.js code reality; `affects` both wool + minky font tokens
- `menus-vs-modal-pattern-divergence` — MENUS.md and CLAUDE.md describe parallel modal patterns with no cross-link
- `scroll-blocking-mechanism-count-divergence` — SCROLLBAR.md (4 gates) vs MOBILE_WHEEL_TOUCH.md (3 + 1 global) — neither doc is complete

**Activities/workbooks (4):**
- `activity-v1-v2-coexistence` — `doc/activities` bulk-documents v1; renderer still handles both
- `workbook-step-type-enum-stale-doc` — WORKBOOKS.md enum lists 4 values; code has 15
- `activities-md-primary-text-mismatch` — `child_of` (v2): slice of `colors-primary-text-conflict`
- `viewpost-shared-filename` — WISHINGWELL.md and WEEPING_WILLOW.md both reference `drops/ViewPost.js` with different data models

**Hearts/payment (4):**
- `heart-payment-modal-bypasses-design-system` — HeartPaymentModal uses RNModal directly, raw View, inlined hex literals, custom font
- `hearts-transaction-response-incomplete` · `hearts-success-check-pattern-mismatch` — documented bugs in HEARTS.md
- `portable-types-list-duplication` — `PORTABLE_TYPES` duplicated frontend/backend

**Bazaar/pixelpals (3 + 1):**
- `bazaar-dev-permissions-open` — **production blocker**: `isDev` flag grants mod/admin to every account
- `bazaar-stalls-unimplemented` — 5 of 6 stall types are schema-but-no-UI
- `bazaar-pixelpals-completion-coupling` — PixelPals auto-creates ShopItems but storeType unset; collaborative boards have N participants, ShopItem.user is single-owner
- `pixelpals-grove-unresolved-asset` — RoomEditor allows editing the willow grove but `Tree.png` isn't in `platformAssets.js`

**Wire/permissions (2):**
- `permissions-admin-frontend-missing` — backend gates exist, frontend has no permission gate on Admin/Moderation flows
- `users-crud-handlers-unimplemented` — WEBSOCKETS.md lists `user:create`, `user:update`, `user:delete` as TODO

**Architecture/testing (3):**
- `build-user-object-duplicated` — `buildUserObject` redefined identically 7 times across backend flow files
- `testing-doc-says-unimplemented` — TESTING.md opens "Testing infrastructure is not yet implemented"; jest config + memory-server + fixtures + 1 real test all exist
- `testing-coverage-near-zero` — spec sets 90/80/80/70 tiered targets; repo has 1 test, no CI workflow

## v2 schema changes (closed)

The v1 → v2 migration was applied 2026-05-22. Phase 3 design candidates from `_PHASE3_NOTES.md` were all addressed except N2 (wire-event nodes — still deferred). Summary:

- **G1:** `feeds_into` (generic flow) + `governs` widened to concept→concept resolved both pixelpals→bazaar and the permissions/architecture orphans.
- **G2:** `doc` is now a first-class node type; drift→doc and source_doc→doc edges close the spec/code isolation gap.
- **G3:** `child_of` is one generic hierarchy edge replacing `derives_from` + `propagates_to`.
- **G4:** `affects` widened to accept tokens (and docs).
- **G5:** `aliases: [string]` on components; `VaporwaveButton` removed as a node.
- **G6:** `_SCHEMA.md` now has the explicit `references` matrix.
- **N1:** `FlowEngine.frontend` + `FlowEngine.backend` paired via `pairs_with`.
- **A1, A2:** Documented in `_QUERIES.md` under "Authoring patterns".

## See also

- [`_SCHEMA.md`](_SCHEMA.md) — graph meta-spec, R1–R10, schema v2 frontmatter rules, node/edge type tables
- [`_QUERIES.md`](_QUERIES.md) — agent recipes + CLI cheat sheet + edge legend
- [`_PHASE3_NOTES.md`](_PHASE3_NOTES.md) — schema-refinement candidates that became v2 (archived)
- [`_traverse.js`](_traverse.js) — CLI: validate, query, path, audit, diff
- [`_migrate-v1-to-v2.js`](_migrate-v1-to-v2.js) — the v1 → v2 migration (idempotent, kept for reference)
