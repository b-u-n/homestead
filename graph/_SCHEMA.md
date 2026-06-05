# Graph Schema — Knowledge Graph Meta-Spec

`/graph/` is a filesystem-simulated knowledge graph of the Homestead application. Every node is one markdown file with a YAML frontmatter block and an optional body. Edges live as frontmatter arrays whose elements are other node IDs. A small CLI (`_traverse.js`) validates the graph, computes inverse edges on the fly, answers queries, and flags rot.

This file is the contract every node must follow. The rules are numbered (R1, R2…) so they can be cited in PR review and in agent prompts. It is modeled on `/git/homestead/activities/v2/_SCHEMA.md`, the gold-standard spec already in this repo.

`schema_version: 2`. Bumping the schema requires a migration script alongside this file (see R10). v1 → v2 was performed by `_migrate-v1-to-v2.js`; nodes at v1 are still loadable but warn.

## Node types (7)

| Type | Purpose | Folder | Examples |
|------|---------|--------|----------|
| `concept` | Surface, feature, or aesthetic that organizes other nodes | `concept/` | `wishing-well`, `vaporwave-aesthetic`, `activity-system` |
| `spec` | Load-bearing contract: numbered rules R1, R2…. Abstract authority; never names code paths in its body. | `spec/` | `flow-engine`, `modal-pattern`, `design-tokens` |
| `pattern` | Recurring implementation strategy (the *how*) | `pattern/` | `mobx-store`, `websocket-emit`, `drop-composition` |
| `component` | Concrete code module. Hand-curated — not every JS file gets a node. | `component/` | `FlowEngine.frontend`, `Modal`, `MinkyPanel` |
| `token` | Design system value (a hex, a font name, a texture path) | `token/` | `color-primary-text`, `font-chubby-trail` |
| `doc` | Prose source file (typically `/md/*.md` or root README/CLAUDE) | `doc/` | `doc/colors`, `doc/claude`, `doc/architecture` |
| `drift` | Observed deviation between spec/doc and implementation, with `status` and propagation | `drift/` | `colors-primary-text-conflict` |

**Model invariant: spec/code isolation.** `spec` nodes are abstract authority — they describe rules, never file paths in rule bodies. Code lives in `component`/`pattern`/`token`. `doc` nodes are the prose archive. `drift` is the observation that two of these don't match.

## Edge types (11, typed endpoints)

Each edge is a frontmatter array on the **source** node. Inverses are computed by `_traverse.js`, never authored.

| Edge | Source type | Target type | Meaning |
|------|-------------|-------------|---------|
| `governs` | `spec`, `concept` | `component`, `concept` | Authority. Spec governs code; cross-cutting concept (permissions, architecture) governs feature concepts. |
| `child_of` | `concept`, `drift`, `component` | same as source | Generic hierarchy. Replaces `derives_from` (concept sub-typing) and `propagates_to` (drift slicing). Source is child, target is parent. |
| `feeds_into` | `concept`, `component`, `doc` | same as source | Generic flow / pipeline. Pixelpals → bazaar (concept). Drop A → Drop B (component, output is next input). Step A → Step B in a workbook (doc). |
| `belongs_to` | `component` | `concept` | Feature / surface membership |
| `uses` | `component` | `component` | Code composition / import |
| `follows` | `component` | `pattern` | This component is an instance of this pattern |
| `pairs_with` | `component` | `component` | Bidirectional twin. Authored on one side; semantically symmetric. Only valid use today: frontend/backend pairs (e.g. `FlowEngine.frontend ↔ FlowEngine.backend`). |
| `references` | `spec`, `pattern` | `spec`, `pattern`, `token`, `doc` | Soft dependency between contracts |
| `supersedes` | `spec`, `component` | same as source | Versioning (v2 supersedes v1) |
| `source_doc` | any non-`doc` type | `doc` | Prose archive pointer — "this node's narrative source lives in that doc" |
| `drifts_from` | `drift` | `spec`, `doc` | Source of truth being violated. A drift may violate a spec's rule, or expose a contradiction between docs. |
| `affects` | `drift` | `component`, `token`, `doc` | Where the drift is observed. Single edge — `infects` is folded in. |

**Removed in v2:** `derives_from`, `propagates_to`, `infects` (collapsed into the edges above).

### `references` matrix

`references` is the soft-dependency edge. The valid source × target combinations are:

| from \ to | `spec` | `pattern` | `token` | `doc` |
|-----------|--------|-----------|---------|-------|
| `spec`    | ✓      | ✓         | ✓       | ✓     |
| `pattern` | ✓      | ✓         | ✓       | ✓     |

Anything else (e.g. `component → spec`, `token → anything`) is not a `references` relationship — use `governs`/`follows`/`source_doc` instead.

## Frontmatter (every node)

```yaml
---
schema_version: 2
id: spec/flow-engine                  # MUST match folder and filename
type: spec                            # one of the 7 node types
title: Flow Engine                    # human display
status: stable                        # see R7 for the enum per type
last_audited: 2026-05-22              # ISO date; updated when a human/agent confirms the node still matches reality
tags: [navigation, ui-pattern]        # OPTIONAL — only add tags you will query (R6)
# Edges (any of the 11 above) as arrays of node IDs:
governs:
  - component/FlowEngine.frontend
  - component/FlowEngine.backend
references:
  - spec/modal-pattern
  - token/color-primary-text
source_doc:
  - doc/flows
---
```

Type-specific extra frontmatter:

- **`component`**: `surface: frontend | backend`, `file: /frontend/components/X.js`, `tested_by: [path/to/test.js]`, `emits: [event-name]`, `handles: [event-name]`, `aliases: [LegacyImportName]` (alternate symbol names served from the same file).
- **`spec`**: `governs_glob: [activities/v2/*.json]` (governs collections of files without per-file nodes), `tested_by: [path/to/audit-script.js]`
- **`concept`**: `kind: surface | feature | aesthetic`
- **`doc`**: `file: /md/COLORS.md` (where the prose actually lives on disk)
- **`drift`**: `cause: ambiguous_in_spec | overridden_in_code | parallel_authoring | unimplemented`, `auto_accept_after: 90` (days; open drift unre-confirmed for this long auto-flips to `accepted`)

## Body conventions per type

Bodies stay terse. Long prose belongs in the `doc/` archive nodes, not absorbed here.

- **`spec`**: `## Rules` (R1, R2…, each with **Why** / **Evidence** / **Test**) then `## Notes`. The rules are the load-bearing part. **Bodies never name code file paths** — rules are abstract; file paths live on `component` nodes.
- **`concept`**: `## Overview` (1–3 sentences) then `## Notes`.
- **`pattern`**: `## Pattern` (the shape) + `## When to use` + `## Notes`.
- **`component`**: `## Purpose` (one paragraph) + `## Notes`. Most information is in frontmatter (file path, surface, edges).
- **`token`**: `## Value` (the actual hex / font name / path) + `## Usage` (where it applies) + `## Notes`.
- **`doc`**: `## Summary` (one paragraph — what this prose file covers, when it was written, why it exists) + `## Notes`. The actual prose is at `file:`, not duplicated here.
- **`drift`**: `## Symptom` (what's observed) + `## Resolution` (proposed fix or accepted state) + `## Audit log` (markdown table: `| Date | Agent | Note |`).

## Rules

### R1: Every node MUST have the required common frontmatter

`schema_version`, `id`, `type`, `title`, `status`, `last_audited` are required on every node. Missing any one fails `validate`.

**Why:** Required fields are the join keys for traversal. A node without an `id` cannot be referenced; a node without `last_audited` cannot be flagged stale.
**Evidence:** `_traverse.js validate` rejects nodes missing any required field.
**Test:** `node graph/_traverse.js validate` exits non-zero with a clear error pointing at the file.

### R2: Node IDs MUST be `<type>/<slug>`, unique across the graph, and match the file path

`id: spec/flow-engine` lives at `/graph/spec/flow-engine.md`. The `id`'s type prefix MUST match the folder. Slugs are URL-safe (alphanumeric, hyphen, underscore, and dot — no spaces, no slashes). Conventions:

- `component/` slugs mirror their code-side name (PascalCase, e.g. `component/MinkyPanel`).
- Dual-surface components use a dot-suffix namespace: `component/FlowEngine.frontend`, `component/FlowEngine.backend`. These are paired via the `pairs_with` edge.
- Every other type uses lowercase kebab-case (`spec/flow-engine`, `token/color-primary-text`, `doc/colors`).

**Why:** ID = filesystem location. Path-from-id is deterministic. No collisions, no aliases, no renames-without-migration.
**Evidence:** `_traverse.js validate` checks `expectedPath(id) === actualPath(file)`.
**Test:** Create `graph/spec/foo.md` with `id: spec/bar`. Validate fails.

### R3: Edges MUST be frontmatter arrays whose elements are valid node IDs

Edges are NOT in the body. Edges are NOT wikilinks. Edges are YAML arrays of strings, each string is an existing node's `id`.

**Why:** Single source of truth for graph structure. `_traverse.js` parses frontmatter only — it does not crawl prose.
**Evidence:** Validation will not detect a link in the body as an edge.
**Test:** Add a body line `See [[foo]]` — it does not create an edge.

### R4: Edge types are restricted to the 11 in the table above, with typed endpoints

`governs` is `(spec|concept) → (component|concept)`. `uses` is `component → component` ONLY. Etc. An edge whose target is the wrong type fails validation. The `references` matrix above enumerates the legal source × target pairs for `references` specifically.

**Why:** Typed endpoints are what make this a graph database and not freeform tagging. Type errors here are the same as null-pointer errors in code — caught early or they corrupt downstream queries.
**Evidence:** `_traverse.js validate` enforces endpoint types.
**Test:** Put `governs: [token/color-primary-text]` on a spec node. Validation fails — `governs` does not allow `token` as target.

### R5: Inverses are NOT authored — `_traverse.js` computes them

Do NOT add `governed_by` on a component, `implemented_by` on a spec, etc. The inverse is recoverable at query time and authoring both sides doubles the drift surface.

`pairs_with` is bidirectional by *semantics* — authoring it on one side is sufficient; the inverse appears via the standard incoming computation.

**Why:** Activities/v2 already proved one-directional explicit beats two-directional implicit. Same principle here.
**Evidence:** `_traverse.js query <id>` shows incoming edges as a computed section, labeled "Incoming (computed)".
**Test:** Query any spec node — its components appear under Incoming even though no edge was authored from the component side.

### R6: Node bodies stay terse — and tags are queried, not decorative

Spec bodies are rules + notes. Other bodies are 1–3 paragraphs of structural prose. **Do not duplicate `doc/` archive content here.** Graph nodes are the index, not the encyclopedia. Tags follow the same rule: add a tag only if you have a query that filters by it. Decoration tags rot.

**Why:** The reason `/md/` rotted is exactly the absence of this discipline. The graph must not repeat the mistake. Agents reading the graph want structure (frontmatter) and rules (R-numbered) — not prose they could read in `doc/`.
**Evidence:** No quantitative check yet. Reviewer checks at PR time.
**Test:** Spot-read any spec body. If you can scan its rules in <30 seconds it's compliant. If it reads like a chapter, it's drifting.

### R7: Status enum is type-dependent

- Non-drift nodes (`concept`, `spec`, `pattern`, `component`, `token`, `doc`): `status` is one of `stable | wip | deprecated | drifting`.
- `drift` nodes: `status` is one of `open | accepted | resolved`.

**Why:** Drift has its own lifecycle. Conflating it with general node status would lose the "this should be fixed" vs "this is just deprecated" distinction.
**Evidence:** `_traverse.js validate` enforces the enum per type.
**Test:** Put `status: open` on a spec node. Validation fails.

### R8: Drift nodes MUST declare `cause`, `drifts_from`, and at least one `affects` target

A drift without a cause is a complaint. A drift without a target spec or doc is a vibe. A drift with no `affects` has no scope.

**Why:** Forces drift authors to answer: what does it violate, why did it happen, where does it live? Open drift past `auto_accept_after` days (default 90) auto-flips to `accepted` to prevent wishlist accumulation.
**Evidence:** `_traverse.js validate` checks these fields on `drift` nodes.
**Test:** Add a drift node missing `cause`. Validation fails.

### R9: Validation runs pre-commit (the only thing that prevents rot)

`_traverse.js validate` must be wired as a git pre-commit hook. The graph rots in the same way every documentation system rots: gradually, invisibly, by accumulation of small inconsistencies. The pre-commit gate is the only mechanism that keeps it honest.

**Why:** This is the single piece of process discipline the graph cannot survive without. Manual audits drift in their own right; tests-as-process don't.
**Evidence:** `.git/hooks/pre-commit` calls `node graph/_traverse.js validate` and exits the commit on failure.
**Test:** Stage a broken node, attempt commit, see it rejected.

### R10: Schema changes bump `schema_version` and ship with a migration

This file is the spec of the graph. If you change the rules — add an edge type, rename a field, alter an enum — bump `schema_version` and write a migration script (`_migrate-v<N>-to-v<N+1>.js`) alongside this file. Existing nodes either migrate in-place or stay at the old version with explicit lower `schema_version` (validate warns).

**Why:** The activities/v2 directory is the model — v1 and v2 coexist with an explicit migration. Doing this from day one prevents the cliff later.
**Evidence:** `_traverse.js validate` warns when nodes have a `schema_version` below the current. `_migrate-v1-to-v2.js` is the reference example.
**Test:** Bump current schema in `_traverse.js` without migrating a node. Validate warns (not fails).

## Notes

v2 of the schema introduced the `doc` node type, collapsed `derives_from`/`propagates_to` into a single `child_of`, merged `infects` into `affects`, widened `governs` to allow concept-as-source, added `feeds_into` for generic pipelines, added `pairs_with` for frontend/backend twins, and added `source_doc` as a typed edge to `doc` (replacing the v1 string-array property). See `_PHASE3_NOTES.md` for the cluster-agent findings that drove these changes.
