# Graph — the Homestead Knowledge Graph

The graph is the index of every load-bearing rule, recurring pattern, hand-curated code module, design token, prose source, and known drift in this repo. It is a filesystem-simulated graph database (markdown files as typed nodes, YAML frontmatter as typed edges) that exists *next to* the codebase, not inside it. The codebase is the implementation; the graph is the contract.

**If you are a human or an agent picking up work in this repo — read this file first.**

Schema v2. ~211 nodes across 7 types. Zero runtime dependencies.

## Why it exists

Documentation in `/md/` rotted in the way every documentation system rots: components got built not-quite-to-spec, iterated, then anchored new components — compounding drift over time. The graph separates the three things `/md/` was conflating:

| Concern | Lives in |
|---------|----------|
| Load-bearing rules ("the spec says X") | `spec/` (R1, R2…) |
| Prose history ("the original write-up") | `doc/` (pointers to `/md/`) |
| Concrete implementation ("the actual file") | `component/`, `pattern/`, `token/` |
| Observed deviations between any of the above | `drift/` |

When code and rules disagree, the graph makes the disagreement explicit (a `drift` node) instead of letting it hide between two docs.

## Read these next (in order)

1. **`_SCHEMA.md`** — the contract every node follows. R1–R10. 7 node types, 11 edge types.
2. **`_QUERIES.md`** — agent recipes. "How do I find what governs component X" / "what drift is near this code".
3. **`_INDEX.md`** — current roster, counts, status distribution, drift catalog.
4. **`_PHASE3_NOTES.md`** — archived design rationale (closed by v1→v2 migration).

The CLI:

```bash
node graph/_traverse.js validate           # schema enforcement (R1–R10)
node graph/_traverse.js audit              # stale / unreferenced / untested / unmoored / expired drift
node graph/_traverse.js query <id>         # node + outgoing + computed incoming
node graph/_traverse.js path <from> <to>   # shortest undirected path
node graph/_traverse.js diff <git-ref>     # what changed in /graph/ since a ref
```

## Session start — required check (manual prompt)

At the start of every working session, run the check below and surface a one-line summary to the human before doing any other work. The point is one explicit fork: do you want to migrate documentation before the task, or proceed? The human always decides.

```bash
node graph/_traverse.js audit | head -20
# compare md/ archive size to doc/ coverage:
echo "md/: $(ls md/*.md 2>/dev/null | wc -l)  doc/: $(ls graph/doc/*.md 2>/dev/null | wc -l)"
```

Then say to the human, in one short message:

> Graph state: 211 nodes, 24 open drifts, 13 drifting. `/md/` has N files; `graph/doc/` has M nodes. Want to run **doc→spec** or **code→spec** before the task, or proceed?

If the human says "proceed", proceed. Do not re-prompt mid-task.

## Migration processes (MANUAL TRIGGER ONLY)

Both processes below are explicit human-initiated decisions. **They are never run automatically, never run on commit, never run "while we're at it."** The point of the graph is to make drift visible *without* the system trying to auto-fix it.

### Process A — `doc → spec` (prose becomes load-bearing rules)

**When to run:**
- A new `/md/` file has been added or substantially edited and contains rules-shaped content (sentences with MUST / SHOULD / "always" / "never").
- An existing `doc/` node exists but the prose it points at has accumulated invariants not captured as any `spec/` node's R-rules.
- A reviewer noticed a recurring pattern in the prose and wants to ratify it as a contract.

**Steps:**

1. Identify the doc. `node graph/_traverse.js query doc/<slug>` shows what already references it.
2. Read the prose at the doc's `file:` path. Note every sentence that would cause a regression if violated.
3. Decide whether to:
   - **Update an existing spec** — append a new R-rule, bump `last_audited`, append an audit-log row in the body.
   - **Create a new spec** — with R-rules, `source_doc: [doc/<slug>]`, `governs: [component/...]`. Follow the body shape in `_SCHEMA.md`.
4. Wire any components the rules apply to via `governs:`.
5. `node graph/_traverse.js validate` until clean.
6. Commit. Reference the doc and the new/edited spec in the commit message.

**Smell test:** if you can't write the rule as "MUST X" or "MUST NOT Y" with a Why/Evidence/Test triple, it isn't a spec rule — it's narrative. Leave it in `/md/`.

### Process B — `code → spec` (reconcile divergence or ratify emerging patterns)

**When to run:**
- `audit` surfaces a new `drifting` status on a previously-stable node.
- A reviewer notices implementation has diverged from the spec it's governed by.
- A new component was authored that doesn't match any existing spec — emerging pattern needs ratifying.
- A drift's `auto_accept_after` window is about to close.

**Steps:**

1. Identify the divergence. `node graph/_traverse.js query spec/<name>` and `node graph/_traverse.js query component/<name>` — read both sides.
2. Decide which is wrong:
   - **Code is wrong** → open a `drift/` node (`cause`, `drifts_from`, `affects`, body with Symptom + Resolution + Audit log), then fix the code, then set the drift to `status: resolved` and append a final audit-log row.
   - **Spec is wrong** (code reality is correct) → edit the spec's R-rule, bump `last_audited`, append an audit-log row noting the ratification. Optionally open and immediately resolve a drift to leave the trail.
   - **New pattern emerging** → create a `pattern/` node, link `component → follows → pattern`. If the pattern is contractual enough to bind future code, also create or update a `spec/` that references the pattern.
3. `node graph/_traverse.js validate` until clean.
4. Commit. Reference the spec, the drift (if any), and the code change in the commit message.

**Smell test:** if you can't articulate which side is wrong, the disagreement isn't yet drift — it's ambiguity. Open the `drift/` node with `cause: ambiguous_in_spec` and resolve it deliberately, not by silently picking a side.

## Process invariants

- **Spec/code isolation.** Spec node bodies never name code file paths. Specs are abstract authority; file paths live on `component` nodes.
- **One-directional edge authoring.** Never author both sides of an edge — `_traverse.js` computes inverses.
- **The pre-commit hook is the only thing that prevents rot.** R9. If `node graph/_traverse.js validate` is not wired into `.git/hooks/pre-commit`, the graph will rot in the same way `/md/` did. Wire it.
- **Migration is human work.** No agent runs Process A or Process B unprompted. The session-start check surfaces *state*; the human chooses the action.

## When the graph is wrong

The graph is itself fallible. If you find a node that disagrees with reality:

- If reality is right and the node is wrong, edit the node (and run validate).
- If the node is right and reality is wrong, that's drift — run Process B.
- If both are right and just describe different things, the model has a gap — see `_PHASE3_NOTES.md` for the v1→v2 precedent and bump `schema_version` per R10.

## Layout

```
graph/
  README.md              ← you are here
  _SCHEMA.md             schema v2 contract (R1–R10)
  _INDEX.md              roster + counts + drift catalog
  _QUERIES.md            agent recipes + CLI cheat sheet
  _PHASE3_NOTES.md       archived v1→v2 rationale
  _traverse.js           the CLI
  _migrate-v1-to-v2.js   the migration (kept for reference)
  concept/  spec/  pattern/  component/  token/  doc/  drift/
```
