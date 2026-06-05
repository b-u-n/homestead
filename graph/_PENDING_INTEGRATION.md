# Pending Integration — CLAUDE.md and root README.md

**Status:** Staged 2026-05-22. Not yet applied — user requested pause on CLAUDE.md edits while parallel uncommitted work continues across the repo.

This file holds the exact edits to apply to `/git/homestead/CLAUDE.md` and `/git/homestead/README.md` when the pause lifts. The changes below are intentionally surgical so they don't conflict with whatever parallel edits are in flight — but the parallel edits may still have changed enough context that the staged blocks are stale. So:

**Before applying any block below, run the re-analysis pass first (next section).** When fully applied, delete this file *and* `_SNAPSHOT.json` + `_snapshot.js`.

---

## 0. Pre-integration re-analysis (REQUIRED — do not skip)

The user is working without committing, so git diff is useless as a baseline. A filesystem snapshot of 775 files was captured at the time this was staged (`_SNAPSHOT.json`, 2026-05-22T18:32:35Z). It covers `graph/`, `md/`, `frontend/{components,flows,screens,stores,services,app}`, `backend/src`, `activities/v2`, and root `CLAUDE.md` / `README.md`.

### 0a. Run the diff

```bash
node graph/_snapshot.js diff
```

Output is grouped by area: graph / md / frontend code / backend code / activities / root.

### 0b. Re-analyze by bucket

For each non-empty bucket in the diff output:

| Bucket | What changes there mean | What to do before applying integration |
|--------|--------------------------|-----------------------------------------|
| `graph/` | A node or script in the graph itself was edited. | `node graph/_traverse.js validate`. Re-read the `_PENDING_INTEGRATION.md` blocks below and confirm they still reflect the graph's reality. |
| `md/` (prose archive) | Source prose changed. May have created content that should be migrated to a spec, or invalidated existing `doc/` nodes. | Spot-check the changed files. If they contain new MUST/SHOULD language, **run Process A (doc→spec) before integrating**. |
| `frontend code` / `backend code` | Implementation drifted. The graph's `component/` nodes may now reference stale code, and new drift may exist that the graph doesn't yet capture. | For each changed file referenced by a `component/` node, consider **Process B (code→spec)**. Open `drift/` if divergence exists. |
| `activities/v2` | Workbook spec corpus changed. `spec/activity-v2`'s `governs_glob` covers this — usually fine, but verify. | Validate; if R-rules in `_SCHEMA.md` (the activities one, not graph) changed, that's a separate spec update. |
| `root` (CLAUDE.md, README.md) | The user's parallel edits are here. | **The 1a/1b/2a blocks below may now need to merge around new content rather than replace.** Re-read the current file before applying. Manually resolve. |

### 0c. After re-analysis

If the re-analysis surfaced migrations, run them. Then proceed to the integration blocks below. Update the audit-log of any spec you touched.

---

## 1. CLAUDE.md changes

### 1a. ADD — new section at top, immediately AFTER the security block, BEFORE `## Project Structure`

The block to insert:

````markdown
## Session Start (READ FIRST)

This repo's load-bearing documentation lives in `/graph/`, not `/md/`. **Before doing any task**:

1. Read `/graph/README.md` — it is the single entry point. It defines: how the graph is organized, the two migration processes (`doc → spec` and `code → spec`), when each is run, and the session-start check below.
2. Run the session-start check (one block):
   ```bash
   node graph/_traverse.js audit | head -20
   echo "md/: $(ls md/*.md 2>/dev/null | wc -l)  doc/: $(ls graph/doc/*.md 2>/dev/null | wc -l)"
   ```
3. Surface a one-line state summary to the user, then ask: "Want to run **doc→spec** or **code→spec** migration before the task, or proceed?" Wait for the answer. If they say "proceed", proceed and do not re-prompt mid-task.

**Migrations are manual-only.** Never run `doc → spec` or `code → spec` unprompted. The session-start check surfaces state; the human chooses the action. See `/graph/README.md` for the full process steps.

When answering questions about the codebase, query the graph FIRST:

```bash
node graph/_traverse.js query <id>           # what governs / references / drifts at this node
node graph/_traverse.js path <from> <to>     # how are two things connected
```

`/md/` is the prose archive now — referenced from `doc/` nodes, not the primary entry point.
````

### 1b. REPLACE — the existing line in the "Working Style (CRITICAL)" section

**Find this line:**

```
- Before working on any new problem area, read ALL relevant documentation in the `md/` folder first. Check existing patterns and implementations before writing new code.
```

**Replace with:**

```
- Before working on any new problem area, query the graph at `/graph/` first — start with `node graph/_traverse.js query <id>` and follow `Incoming (computed)` edges. `/graph/README.md` is the entry point; `/graph/_QUERIES.md` has the agent recipes. `/md/` is the prose archive only — referenced from `doc/` nodes, not the primary entry point.
```

---

## 1. CLAUDE.md changes

### 1a. ADD — new section at top, immediately AFTER the security block, BEFORE `## Project Structure`

The block to insert:

````markdown
## Session Start (READ FIRST)

This repo's load-bearing documentation lives in `/graph/`, not `/md/`. **Before doing any task**:

1. Read `/graph/README.md` — it is the single entry point. It defines: how the graph is organized, the two migration processes (`doc → spec` and `code → spec`), when each is run, and the session-start check below.
2. Run the session-start check (one block):
   ```bash
   node graph/_traverse.js audit | head -20
   echo "md/: $(ls md/*.md 2>/dev/null | wc -l)  doc/: $(ls graph/doc/*.md 2>/dev/null | wc -l)"
   ```
3. Surface a one-line state summary to the user, then ask: "Want to run **doc→spec** or **code→spec** migration before the task, or proceed?" Wait for the answer. If they say "proceed", proceed and do not re-prompt mid-task.

**Migrations are manual-only.** Never run `doc → spec` or `code → spec` unprompted. The session-start check surfaces state; the human chooses the action. See `/graph/README.md` for the full process steps.

When answering questions about the codebase, query the graph FIRST:

```bash
node graph/_traverse.js query <id>           # what governs / references / drifts at this node
node graph/_traverse.js path <from> <to>     # how are two things connected
```

`/md/` is the prose archive now — referenced from `doc/` nodes, not the primary entry point.
````

### 1b. REPLACE — the existing line in the "Working Style (CRITICAL)" section

**Find this line:**

```
- Before working on any new problem area, read ALL relevant documentation in the `md/` folder first. Check existing patterns and implementations before writing new code.
```

**Replace with:**

```
- Before working on any new problem area, query the graph at `/graph/` first — start with `node graph/_traverse.js query <id>` and follow `Incoming (computed)` edges. `/graph/README.md` is the entry point; `/graph/_QUERIES.md` has the agent recipes. `/md/` is the prose archive only — referenced from `doc/` nodes, not the primary entry point.
```

---

## 2. Root README.md changes

### 2a. ADD — new section after `## Project Structure`, before `## Quick Start`

The block to insert:

````markdown
## Documentation graph

This repo's load-bearing documentation lives in `/graph/` — a filesystem-simulated knowledge graph of specs (R-numbered contracts), components, design tokens, prose docs, and known drift. **Start at [`graph/README.md`](graph/README.md).**

`/md/` is the prose archive, referenced from the graph's `doc/` nodes. The graph is what humans and agents query before working in this codebase.

```bash
node graph/_traverse.js validate    # is the graph clean?
node graph/_traverse.js audit       # what's rotting?
node graph/_traverse.js query <id>  # what governs / references / drifts at this node?
```
````

---

## 3. Optional: wire the pre-commit hook (R9)

The graph's R9 says `validate` must run pre-commit or the graph rots. Five-line hook:

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
node graph/_traverse.js validate || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

This is independent of the CLAUDE.md edits — safe to wire whenever.

---

## Integration checklist (when the pause lifts)

- [ ] **§0 — Re-analysis.** Run `node graph/_snapshot.js diff`. Walk every bucket using §0b's guide. If anything triggers Process A (doc→spec) or Process B (code→spec), do those first.
- [ ] Open `/git/homestead/CLAUDE.md`. Apply edit 1a (insert new "Session Start" section after security block). Be mindful of any parallel additions in the file.
- [ ] In the same file, apply edit 1b (replace the one Working Style line).
- [ ] Open `/git/homestead/README.md`. Apply edit 2a (insert "Documentation graph" section).
- [ ] Wire the pre-commit hook from §3 (optional but strongly recommended).
- [ ] Run `node graph/_traverse.js validate` to confirm nothing regressed.
- [ ] Delete `/git/homestead/graph/_PENDING_INTEGRATION.md`.
- [ ] Delete `/git/homestead/graph/_SNAPSHOT.json` and `/git/homestead/graph/_snapshot.js` (their purpose is served; from this point on, git is the diff baseline because the user said they'll start committing).
