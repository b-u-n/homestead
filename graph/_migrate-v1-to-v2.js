#!/usr/bin/env node
/**
 * Migration: schema_version 1 → 2.
 *
 * Idempotent. Safe to re-run; nodes already at v2 are skipped.
 *
 * Per-node transformations:
 *
 *   • schema_version: 1 → 2
 *   • derives_from: → child_of:                       (concept hierarchy: child → parent)
 *   • propagates_to: → child_of:                      (drift slicing: slice → broader)
 *   • infects: → folded into affects: (deduped)       (single observation edge)
 *   • source_doc: [md/X.md, CLAUDE.md] →              (the property becomes a typed edge
 *       source_doc: [doc/x, doc/claude]                pointing at doc/ nodes)
 *
 * Side effect: creates doc/<slug>.md nodes for every unique source_doc target
 * that does not yet exist. Slug derivation: strip leading "md/", strip ".md"
 * suffix, lowercase, replace underscores with hyphens.
 *
 * One-off manual steps NOT done by this script (handled separately):
 *
 *   • component/FlowEngine (surface: shared) split into FlowEngine.frontend
 *     and FlowEngine.backend, paired via `pairs_with`. Migration tags the
 *     node with a TODO marker in the body instead of attempting the split.
 *   • component/VaporwaveButton deletion + alias merge onto WoolButton.
 *
 * Usage:
 *   node graph/_migrate-v1-to-v2.js          # dry run, prints plan
 *   node graph/_migrate-v1-to-v2.js --apply  # write changes
 */
const fs = require('fs');
const path = require('path');

const GRAPH_DIR = __dirname;
const APPLY = process.argv.includes('--apply');
const TODAY = new Date().toISOString().slice(0, 10);

const NODE_TYPES = ['concept', 'spec', 'pattern', 'component', 'token', 'doc', 'drift'];

// ─── Frontmatter helpers ────────────────────────────────────────────────────

function parseFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  return { fmText: m[1], body: m[2], original: text };
}

function writeFile(file, fmText, body) {
  fs.writeFileSync(file, `---\n${fmText}\n---\n${body}`, 'utf8');
}

// Rewrite frontmatter text by:
//   • renaming top-level keys (rename map)
//   • rewriting block-array values via the per-key valueMapper
//   • bumping schema_version inline
//
// We operate on the raw frontmatter text rather than a parsed object so
// that comments, blank lines, key order, and quoting are preserved.

function rewriteFrontmatter(fmText, { renames, valueMappers, schemaBump }) {
  const lines = fmText.split('\n');
  const out = [];
  let currentKey = null;
  let currentKeyRenamed = null;

  for (const line of lines) {
    // schema_version: 1 → 2
    if (schemaBump && /^schema_version:\s*1\s*$/.test(line)) {
      out.push(`schema_version: ${schemaBump}`);
      currentKey = null;
      continue;
    }

    // key: value  OR  key:
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):(\s*)(.*)$/);
    if (kvMatch) {
      const [, key, ws, rest] = kvMatch;
      const renamed = renames[key] ?? key;
      currentKey = key;
      currentKeyRenamed = renamed;

      // Inline array: key: [a, b, c]
      const trimmed = rest.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1).trim();
        const items = inner === '' ? [] : inner.split(',').map(s => s.trim());
        const mapped = items.map(v => (valueMappers[key] ? valueMappers[key](v) : v)).filter(v => v != null);
        out.push(`${renamed}:${ws}[${mapped.join(', ')}]`);
        currentKey = null;
        continue;
      }

      out.push(`${renamed}:${ws}${rest}`);
      continue;
    }

    // Block-array item: "  - value"
    const itemMatch = line.match(/^(\s+-\s*)(.+)$/);
    if (itemMatch && currentKey) {
      const [, prefix, value] = itemMatch;
      const mapped = valueMappers[currentKey] ? valueMappers[currentKey](value.trim()) : value.trim();
      if (mapped == null) continue;
      out.push(`${prefix}${mapped}`);
      continue;
    }

    // Blank line or unrelated content
    if (!line.trim()) currentKey = null;
    out.push(line);
  }

  return out.join('\n');
}

// Merge two block-array sections (e.g. fold infects: into affects:).
// Reads both lists, dedupes, removes source key, ensures target key.
function foldEdgeInto(fmText, sourceKey, targetKey) {
  const items = { [sourceKey]: [], [targetKey]: [] };
  const lines = fmText.split('\n');
  let currentKey = null;
  const filtered = [];
  let targetKeyLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):(\s*)(.*)$/);
    if (kvMatch) {
      const [, key] = kvMatch;
      currentKey = key;
      if (key === sourceKey) {
        // Inline array case
        const rest = kvMatch[3].trim();
        if (rest.startsWith('[') && rest.endsWith(']')) {
          const inner = rest.slice(1, -1).trim();
          if (inner) items[sourceKey].push(...inner.split(',').map(s => s.trim()));
          continue;
        }
        // Block: skip this line and absorb items below
        continue;
      }
      if (key === targetKey) targetKeyLineIdx = filtered.length;
      filtered.push(line);
      continue;
    }
    const itemMatch = line.match(/^\s+-\s*(.+)$/);
    if (itemMatch && currentKey === sourceKey) {
      items[sourceKey].push(itemMatch[1].trim());
      continue;
    }
    if (itemMatch && currentKey === targetKey) {
      items[targetKey].push(itemMatch[1].trim());
    }
    if (!line.trim()) currentKey = null;
    filtered.push(line);
  }

  // Nothing to merge
  if (items[sourceKey].length === 0) return fmText;

  // Build the combined list
  const combined = Array.from(new Set([...items[targetKey], ...items[sourceKey]]));

  if (targetKeyLineIdx >= 0) {
    // Replace the target key block with the merged list
    const out = [];
    let skippingBlock = false;
    let blockKey = null;
    for (const line of filtered) {
      const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):(\s*)(.*)$/);
      if (kvMatch) {
        if (skippingBlock) skippingBlock = false;
        if (kvMatch[1] === targetKey) {
          out.push(`${targetKey}:`);
          for (const v of combined) out.push(`  - ${v}`);
          skippingBlock = true;
          blockKey = targetKey;
          continue;
        }
        out.push(line);
        continue;
      }
      if (skippingBlock && /^\s+-/.test(line)) continue;
      if (skippingBlock && !line.trim()) { skippingBlock = false; }
      out.push(line);
    }
    return out.join('\n');
  }

  // Target key didn't exist — append at end
  const append = [`${targetKey}:`, ...combined.map(v => `  - ${v}`)];
  return filtered.join('\n') + '\n' + append.join('\n');
}

// ─── Doc slug derivation ────────────────────────────────────────────────────

function docSlugFromSourceDoc(raw) {
  // raw is e.g. "md/COLORS.md" or "CLAUDE.md" or already "doc/colors"
  if (raw.startsWith('doc/')) return raw;

  // Code-file references in source_doc are bugs from cluster authoring — skip
  // them with a warning. They should be edges to the component node, not
  // source_doc pointers to code files.
  if (/\.(js|jsx|ts|tsx)$/i.test(raw)) {
    console.warn(`WARN  source_doc points at code file '${raw}' — skipping; manually replace with proper edge.`);
    return null;
  }

  // Strip directory prefixes and .md suffix; normalize separators
  let s = raw.replace(/\.md$/, '');
  s = s.replace(/^md\//, '');           // /md/ prefix is implicit
  s = s.replace(/^_/, '');              // leading underscore (e.g. _SCHEMA)
  s = s.toLowerCase();
  s = s.replace(/[/_]/g, '-');          // slashes and underscores both become hyphens
  s = s.replace(/-+/g, '-');            // collapse repeated hyphens
  s = s.replace(/^-|-$/g, '');          // trim leading/trailing hyphens
  return `doc/${s}`;
}

// ─── Discover all docs ─────────────────────────────────────────────────────

function discoverDocReferences() {
  const docs = new Map(); // doc id → original path
  for (const type of NODE_TYPES) {
    const dir = path.join(GRAPH_DIR, type);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const text = fs.readFileSync(path.join(dir, file), 'utf8');
      const m = text.match(/^---\n([\s\S]*?)\n---/);
      if (!m) continue;
      const fm = m[1];
      const lines = fm.split('\n');
      let inSourceDoc = false;
      for (const line of lines) {
        const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
        if (kv) {
          if (kv[1] === 'source_doc') {
            inSourceDoc = true;
            const rest = kv[2].trim();
            if (rest.startsWith('[') && rest.endsWith(']')) {
              const items = rest.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
              for (const it of items) {
                const id = docSlugFromSourceDoc(it);
                if (id && !docs.has(id)) docs.set(id, it);
              }
              inSourceDoc = false;
            }
          } else inSourceDoc = false;
          continue;
        }
        const item = line.match(/^\s+-\s*(.+)$/);
        if (item && inSourceDoc) {
          const id = docSlugFromSourceDoc(item[1].trim());
          if (id && !docs.has(id)) docs.set(id, item[1].trim());
        } else if (!line.trim()) {
          inSourceDoc = false;
        }
      }
    }
  }
  return docs;
}

// ─── Create doc node files ──────────────────────────────────────────────────

function ensureDocNode(docId, originalPath) {
  const slug = docId.replace(/^doc\//, '');
  const file = path.join(GRAPH_DIR, 'doc', `${slug}.md`);
  if (fs.existsSync(file)) return { created: false, file };

  // Determine the file: path. md/X.md becomes /md/X.md; CLAUDE.md → /CLAUDE.md
  let filePath;
  if (originalPath.startsWith('md/')) filePath = `/${originalPath}`;
  else filePath = `/${originalPath}`;

  // Title: derive from slug
  const title = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  const content = `---
schema_version: 2
id: ${docId}
type: doc
title: ${title}
status: stable
last_audited: ${TODAY}
file: ${filePath}
---

## Summary

Prose source for the ${title} surface of the Homestead application. The full text lives at \`${filePath}\`. This node is the typed pointer used by spec/component/concept nodes that reference this doc.

## Notes

Auto-created during v1→v2 migration to back the existing \`source_doc\` references with first-class doc nodes. Promote \`status\` to \`drifting\` if the prose is observed out of sync with code; open a \`drift/\` node and edge \`drifts_from: doc/...\` to capture the deviation.
`;
  return { created: true, file, content };
}

// ─── Migration ──────────────────────────────────────────────────────────────

function migrate() {
  const plan = { schemaBump: [], renamed: [], folded: [], sourceDocRewritten: [], docsCreated: [], skipped: [] };

  // Step 1: discover docs needed
  const docs = discoverDocReferences();
  for (const [docId, originalPath] of docs) {
    const r = ensureDocNode(docId, originalPath);
    if (r.created) {
      plan.docsCreated.push({ docId, file: r.file, content: r.content });
    }
  }

  // Step 2: walk every existing node and transform
  for (const type of NODE_TYPES) {
    const dir = path.join(GRAPH_DIR, type);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const full = path.join(dir, file);
      const parsed = parseFile(full);
      if (!parsed) continue;

      let fmText = parsed.fmText;
      let changed = false;

      // Already at v2?
      if (/^schema_version:\s*2\s*$/m.test(fmText)) {
        plan.skipped.push(full);
        continue;
      }

      // Detect what's present BEFORE we transform anything
      const has = (key) => new RegExp(`^${key}:`, 'm').test(fmText);
      const hadDerivesFrom = has('derives_from');
      const hadPropagatesTo = has('propagates_to');
      const hadSourceDoc = has('source_doc');

      // Fold infects → affects FIRST (before key renames)
      if (has('infects')) {
        const folded = foldEdgeInto(fmText, 'infects', 'affects');
        if (folded !== fmText) {
          fmText = folded;
          plan.folded.push({ file: full, from: 'infects', to: 'affects' });
          changed = true;
        }
      }

      // Rename edge keys + bump schema_version + rewrite source_doc values
      const newFm = rewriteFrontmatter(fmText, {
        renames: {
          derives_from: 'child_of',
          propagates_to: 'child_of',
        },
        valueMappers: {
          source_doc: docSlugFromSourceDoc,
        },
        schemaBump: 2,
      });

      if (newFm !== fmText) {
        fmText = newFm;
        changed = true;
        if (hadDerivesFrom) plan.renamed.push({ file: full, from: 'derives_from', to: 'child_of' });
        if (hadPropagatesTo) plan.renamed.push({ file: full, from: 'propagates_to', to: 'child_of' });
        if (hadSourceDoc) plan.sourceDocRewritten.push(full);
        plan.schemaBump.push(full);
      } else if (/^schema_version:\s*1\s*$/m.test(parsed.fmText)) {
        // schema_version was the only thing to bump
        fmText = parsed.fmText.replace(/^schema_version:\s*1\s*$/m, 'schema_version: 2');
        changed = true;
        plan.schemaBump.push(full);
      }

      if (changed && APPLY) {
        writeFile(full, fmText, parsed.body);
      }
    }
  }

  // Step 3: write doc nodes (after — so the targets exist)
  if (APPLY) {
    const docDir = path.join(GRAPH_DIR, 'doc');
    if (!fs.existsSync(docDir)) fs.mkdirSync(docDir);
    for (const d of plan.docsCreated) {
      fs.writeFileSync(d.file, d.content, 'utf8');
    }
  }

  // Report
  const verb = APPLY ? 'Applied' : 'DRY-RUN — would apply';
  console.log(`${verb}:`);
  console.log(`  ${plan.schemaBump.length} nodes bumped to schema_version 2`);
  console.log(`  ${plan.renamed.length} edge renames (derives_from/propagates_to → child_of)`);
  console.log(`  ${plan.folded.length} infects → affects folds`);
  console.log(`  ${plan.sourceDocRewritten.length} nodes had source_doc values rewritten to doc/ IDs`);
  console.log(`  ${plan.docsCreated.length} new doc/ nodes created`);
  if (plan.skipped.length) console.log(`  ${plan.skipped.length} nodes already at v2 (skipped)`);

  if (plan.renamed.length) {
    console.log('\nRenamed edges:');
    for (const r of plan.renamed) console.log(`  ${path.relative(process.cwd(), r.file)}: ${r.from} → ${r.to}`);
  }
  if (plan.folded.length) {
    console.log('\nFolded edges:');
    for (const f of plan.folded) console.log(`  ${path.relative(process.cwd(), f.file)}: ${f.from} → ${f.to}`);
  }
  if (plan.docsCreated.length) {
    console.log('\nNew doc nodes:');
    for (const d of plan.docsCreated) console.log(`  + ${d.docId}`);
  }

  if (!APPLY) console.log('\n(re-run with --apply to write changes)');
}

migrate();
