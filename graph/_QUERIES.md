# Graph Queries — Example Traversals & Agent Recipes

How to slice the graph for common tasks. Schema v2.

## CLI cheat sheet

```bash
# Run from anywhere in the repo
node graph/_traverse.js validate           # schema enforcement (R1–R10)
node graph/_traverse.js query <id>         # node + outgoing + computed incoming
node graph/_traverse.js path <from> <to>   # shortest undirected path
node graph/_traverse.js audit              # stale / unreferenced / untested / unmoored / expired drift
node graph/_traverse.js diff <git-ref>     # what changed in /graph/ since a ref
```

## Common questions → which query answers them

### "What contract governs `MinkyPanel`?"

```bash
node graph/_traverse.js query component/MinkyPanel
```

The `Incoming (computed): governs ←` section lists every spec (or governing concept) that includes `component/MinkyPanel` in its `governs:` array. If empty, the component is **unmoored** — see `audit`.

### "What components does this spec apply to?"

```bash
node graph/_traverse.js query spec/design-tokens
```

`Outgoing: governs:` is the answer.

### "Is there known drift in this area?"

```bash
node graph/_traverse.js query spec/design-tokens
```

`Incoming (computed): drifts_from ←` lists every open or accepted drift violating this spec. Read each before changing related code — the drift node tells you what implementation quirks already exist.

### "From this drift, what code is contaminated?"

```bash
node graph/_traverse.js query drift/colors-primary-text-conflict
```

`Outgoing: affects:` is the full observation set — components, tokens, and docs touched by the drift. `Outgoing: child_of:` chains to a broader drift this one is a slice of.

### "What's the chain from this drift to that component?"

```bash
node graph/_traverse.js path drift/colors-primary-text-conflict component/MinkyPanel
```

Returns the typed-edge path. Useful when you want the full context an agent needs for a fix that touches both endpoints.

### "What prose describes this node?"

```bash
node graph/_traverse.js query component/MinkyPanel
```

`Outgoing: source_doc:` lists `doc/` nodes — each has a `file:` pointer at the actual prose location on disk. Use this when you want the original narrative, not the structural summary.

### "Which drifts cite this doc as the source of truth being violated?"

```bash
node graph/_traverse.js query doc/colors
```

`Incoming (computed): drifts_from ←` lists every drift that names this doc as a participant in the dispute.

### "What's rotting?"

```bash
node graph/_traverse.js audit
```

Five categories: stale (audit date > 180d), unreferenced (orphan nodes), untested (specs lacking `tested_by`), unmoored (components with no governing spec/concept and no `belongs_to`), expired drift (open drift past `auto_accept_after`).

## Agent recipes

When an agent is sent off to work on a specific task, these are the queries it should run first to slice exactly the context it needs.

### Recipe: "Edit `<some component>`"

```bash
node graph/_traverse.js query component/<Name>
```

Then for every spec listed under `Incoming (computed): governs ←`, read that spec's `## Rules` section. Those are the load-bearing contracts the edit must respect. Also read every drift listed under `affects ←` — those are known deviations the agent must not re-introduce.

### Recipe: "Add a new feature `<X>`"

1. Identify which `concept/` node `<X>` belongs to (or propose a new concept).
2. `query concept/<X>` to see existing components in that surface (`Incoming: belongs_to ←`).
3. For each, follow the recipe above. The agent leaves with: this feature's existing component shape, the specs they implement, the patterns they follow, and the open drift in the area.

### Recipe: "Fix this drift"

```bash
node graph/_traverse.js query drift/<id>
```

The drift node body has the symptom, the resolution options, and the audit log. The `drifts_from` edge points to the spec or doc being violated — read it. The `affects` edge names every component, token, and doc to touch. After the fix lands, set `status: resolved` and add a final `## Audit log` row.

### Recipe: "What needs attention this week?"

```bash
node graph/_traverse.js audit
```

Plus, scan `_INDEX.md` for any node whose status is `drifting` or `wip`.

## Authoring patterns

### A spec can govern a usage pattern, not a specific file

If a spec describes a recurring usage pattern (e.g. an auto-expanding textarea inlined in multiple drops, not extracted to a component), it is legitimate for the spec to have an empty `governs:` and let `references: [pattern/...]` carry the meaning. See `spec/textbox-autoexpand` for the working example.

### When a doc has N parallel modes, prefer N R-rules

If a doc describes N independent variants of a feature (e.g. 4 game modes, 6 button variants), author N separate R-rules (R1 = mode A, R2 = mode B, …). The "one load-bearing principle per R" pattern matches reader expectations better than one R with N bullets.

### Dual-surface components

A component implemented on both frontend and backend (e.g. `FlowEngine`) is modeled as two nodes — `component/X.frontend` and `component/X.backend` — paired via the `pairs_with` edge. Author the pairing on one side; queries see both directions automatically.

### Aliases (legacy import names)

When the same code file is exported under multiple symbol names (e.g. `WoolButton` is also exported as the deprecated `VaporwaveButton`), use the `aliases: [string]` property on the canonical component node. Aliases are not separate component nodes.

## Manual traversal (no CLI)

Every edge is a literal string in YAML frontmatter. To find "what governs component/MinkyPanel" without the CLI:

```bash
grep -l 'component/MinkyPanel' graph/spec/*.md graph/concept/*.md
```

This is the failure-mode-friendly version: if `_traverse.js` is broken, the graph is still readable with grep.

## Edge legend (v2)

| Edge | Direction | What it answers when used as `Incoming ←` |
|------|-----------|--------------------------------------------|
| `governs`     | spec→code / concept→concept | "what authority binds me?" |
| `child_of`    | child→parent                | "what am I a slice of?" |
| `feeds_into`  | source→sink (same-type)     | "what flows into me?" |
| `belongs_to`  | component→concept           | (forward only — `Incoming` from `concept` gives you "my members") |
| `uses`        | component→component         | "what depends on me?" |
| `follows`     | component→pattern           | "what code instances me?" |
| `pairs_with`  | component↔component         | "who's my twin?" |
| `references`  | (spec\|pattern)→…           | "what cites me?" |
| `supersedes`  | newer→older                 | "what replaced me?" |
| `source_doc`  | any→doc                     | "what nodes derive from this prose?" |
| `drifts_from` | drift→(spec\|doc)           | "what disputes me?" |
| `affects`     | drift→(comp\|token\|doc)    | "what drift is observed at me?" |
