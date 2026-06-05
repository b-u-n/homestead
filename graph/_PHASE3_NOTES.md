# Phase 3 — Schema Refinement Input  *(ARCHIVED — closed by v1→v2 migration on 2026-05-22)*

> **Status:** All items below were resolved or explicitly deferred during the v1→v2 schema migration. Kept on disk as the historical record — the user's notes ("**Notes**" sub-sections) are the source-of-truth for why each item was decided the way it was. See `_INDEX.md` "v2 schema changes" for the short summary.

Captured originally from the 7 cluster agents' Phase-2 reports. These were the places the `schema_version: 1` schema didn't fit naturally. None were blocking — the graph validated and queried cleanly at v1. They became the candidates for `schema_version: 2`.

The migration followed R10: bumped `schema_version`, shipped `_migrate-v1-to-v2.js`, existing nodes migrated in place.

## Edge gaps

### G1 — Non-hierarchical concept-to-concept relationships

**Reported by:** major-features, architecture-meta, audit (orphan concepts).

**Symptom:** `derives_from` (concept → concept) only modeled *sub-concept* relationships. Three real cases didn't fit:

- `concept/pixelpals` **pipelines into** `concept/bazaar` (board completion auto-creates ShopItems). Not a sub-concept.
- `concept/permissions-and-roles` **cross-cuts** every feature concept. Not a parent or child.
- `concept/homestead-architecture` is a **meta-anchor** every feature concept is a surface of.

**Notes (user):** `feeds_into` feels right for something like pixelpals — that's also extensible to things like drops that feed other drops, right? or is that an overextension of the concept? because obviously if we can't model workbooks with the model, the model is flawed. whole system, game, workbooks all need to be modeled so as long as we're covering that. for the other two, isn't `governs` a better fit for roles and permissions and architecture?

**Resolved in v2:**
- Added `feeds_into` (same-type only — concept→concept, component→component, doc→doc). Supports pixelpals→bazaar pipeline, drop→drop chaining, and step→step workbook chains.
- Widened `governs` to accept `concept` as both source and target. `concept/permissions-and-roles` and `concept/homestead-architecture` now `governs` feature concepts.

### G2 — Drift endpoint widening

**Reported by:** architecture-meta.

**Symptom:** R8 required `affects` or `infects` on a `drift` node, but both edges targeted `component`. Documentation-only drift was awkwardly pinned to tangentially-related components.

**Notes (user):** i want complete isolation of `spec` and code. i think a `doc` node makes sense in a lot of contexts and is the easiest to reason about.

**Resolved in v2:**
- `doc` is now a first-class node type. 36 doc nodes auto-created from existing `source_doc:` references.
- `affects` widened to accept `component | token | doc`.
- `drifts_from` widened to accept `spec | doc` (e.g. a drift can name a doc as the disputed source of truth).
- The v2 model invariant is now stated in `_SCHEMA.md`: spec nodes are abstract authority and never name code paths in rule bodies.

### G3 — Parent-child drift chains

**Reported by:** button-and-form.

**Symptom:** `drift/fonts-button-label-divergence` is a *child* of `drift/fonts-canonical-list-divergence`. `propagates_to` was used but its semantics ("this drift causes that drift") didn't match the relationship ("this drift is a slice of that drift").

**Notes (user):** so i'm going to want to review all of the relationship tags you're using. is this not just a parent / child relationship? i feel like you're overcomplicating this. yes, this relationship needs to exist, but i think you're hyperfocusing on the concept of drift and causal relationships. isn't there a cleaner way to model this that isn't a one off?

**Resolved in v2:**
- Collapsed `derives_from` (concept hierarchy) and `propagates_to` (drift slicing) into a single `child_of` edge that works across types (concept, drift, component — same-type only).
- Causal relationships are now expressed in node body prose, not edges. The graph encodes structural hierarchy; the narrative lives in the body.

### G4 — Token ↔ drift first-class link

**Reported by:** button-and-form.

**Notes (user):** yes, obviously.

**Resolved in v2:** `affects` accepts `token` as a target. The 5 design-system drifts now name the disputed tokens directly:
- `colors-primary-text-conflict` `affects token/color-primary-text`
- `colors-secondary-text-conflict` `affects token/color-secondary-text`
- `fonts-canonical-list-divergence` `affects token/font-header`
- `fonts-button-label-divergence` `affects token/font-button-wool, token/font-button-minky`

### G5 — Alias / shadow component

**Reported by:** button-and-form.

**Symptom:** `component/VaporwaveButton` and `component/WoolButton` both had `file: /frontend/components/WoolButton.js`. VaporwaveButton was just a deprecated import alias.

**Notes (user):** aliases seems like a bad thing to model as an edge; it can be an aliases array. this is legacy stuff, right? why are we modeling legacy stuff in the graph?

**Resolved in v2:** Deleted `component/VaporwaveButton.md`. Added `aliases: [VaporwaveButton]` to `component/WoolButton.md`. The graph now models current reality; legacy import names ride on the canonical node as a scalar array.

### G6 — `pattern → token` and `spec → pattern` in `references`

**Notes (user):** yes.

**Resolved in v2:** `_SCHEMA.md` now contains an explicit `references` matrix showing exactly which source × target combinations are valid.

## Node-type gaps

### N1 — Frontend/backend dual-surface components

**Notes (user):** the core of what you're suggesting is that frontend and backend need to be separate nodes connected with an edge; it's just a matter of how we want to model the relationship. it's a transaction between the two, they're paired, that sort of thing — it should cleanly be represented for code but also extensible beyond it. we'll review the decision in the next review period yeah?

**Resolved in v2:**
- Split `component/FlowEngine` into `component/FlowEngine.frontend` and `component/FlowEngine.backend`.
- Added `pairs_with: component → component` edge (semantically symmetric; authored on one side).
- Slug regex relaxed to allow `.` so the namespaced ID format works.
- The frontend node carries the Modal usage, drop-composition pattern, etc.; the backend carries handler registration.
- Five referencer components (CustomizationTable, DrawingBoard, MapSpritesStall, PixelPals, Workbook) point at `FlowEngine.frontend`. `spec/flow-engine` governs both halves.

### N2 — Wire-protocol events as nodes (still deferred)

**Notes (user):** yeah that's fine.

**Status in v2:** Still deferred. `emits:` / `handles:` remain scalar string arrays on components. Revisit only if a real query emerges that needs event nodes.

## Authoring guidance refinements

### A1 — N-parallel-mode specs

**Notes (user):** yes.

**Resolved in v2:** Documented in `_QUERIES.md` "Authoring patterns": when a doc describes N parallel mode-variants, prefer N R-rules.

### A2 — Specs that govern usage patterns, not files

**Notes (user):** yeah that's fine.

**Resolved in v2:** Documented in `_QUERIES.md` "Authoring patterns": a spec can govern a usage pattern (via `references`) instead of a specific file.

## Final note from user

> Please provide all of the relationship terms you're using and also a diagram of the overall model so i need to know things like how are you tagging causal relationships, how are you modeling parent / child relationships, since we're currently dealing with drift, how is it specified that this is a drift relationship, how is docs vs code modeled etc. in answering this question, you should probably be solidifying your plan, yeah?

→ The answer (the v2 design) is in `_SCHEMA.md`. The full edge inventory + the ASCII model diagram + the per-relationship-type explanation were presented in the conversation immediately before this migration ran. The schema is the authoritative version going forward.

## Things v1 got right (carried into v2)

- **Edge endpoints typed.** `emits`/`handles` remain untyped scalar arrays — typing them would force an event-node-type explosion.
- **`governs_glob` on specs** — used cleanly for `activities/v2/*.json` without a 80-node explosion.
- **Computed inverse edges** — every cluster relied on `Incoming (computed)`. One-directional authoring held up.
- **R-numbered rules + Why/Evidence/Test** — every cluster fit their docs into this pattern.
- **Drift `audit_log` in body** — agents appended audit-log rows cleanly. Keeping nested objects out of frontmatter paid off.
- **Schema versioning from day one** — v1→v2 migration was a one-day exercise, not a months-long cliff.
