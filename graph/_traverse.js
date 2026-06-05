#!/usr/bin/env node
/**
 * Homestead knowledge-graph CLI (schema v2).
 *
 * Zero-dependency. Parses YAML frontmatter from every .md file under
 * /graph/{concept,spec,pattern,component,token,doc,drift}/ and exposes:
 *
 *   validate          — schema enforcement (R1–R10 in _SCHEMA.md)
 *   query <id>        — node + outgoing edges + incoming (computed)
 *   path <from> <to>  — shortest undirected path through the graph
 *   audit             — staleness, unreferenced, untested, unmoored, expired drift
 *   diff <git-ref>    — node-level delta in /graph/ since a ref (uses git)
 *
 * Run from anywhere: paths resolve relative to this script's own dir.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRAPH_DIR = __dirname;
const SCHEMA_VERSION = 2;

const NODE_TYPES = ['concept', 'spec', 'pattern', 'component', 'token', 'doc', 'drift'];

// Edge type → allowed source types → allowed target types.
// For "same as source" edges (child_of, feeds_into, supersedes), validation
// additionally enforces source._type === target._type below.
const EDGE_RULES = {
  governs:     { from: ['spec', 'concept'],                                    to: ['component', 'concept'] },
  child_of:    { from: ['concept', 'drift', 'component'],                      to: ['concept', 'drift', 'component'], sameType: true },
  feeds_into:  { from: ['concept', 'component', 'doc'],                        to: ['concept', 'component', 'doc'],   sameType: true },
  belongs_to:  { from: ['component'],                                          to: ['concept'] },
  uses:        { from: ['component'],                                          to: ['component'] },
  follows:     { from: ['component'],                                          to: ['pattern'] },
  pairs_with:  { from: ['component'],                                          to: ['component'] },
  references:  { from: ['spec', 'pattern'],                                    to: ['spec', 'pattern', 'token', 'doc'] },
  supersedes:  { from: ['spec', 'component'],                                  to: ['spec', 'component'], sameType: true },
  source_doc:  { from: ['concept', 'spec', 'pattern', 'component', 'token', 'drift'], to: ['doc'] },
  drifts_from: { from: ['drift'],                                              to: ['spec', 'doc'] },
  affects:     { from: ['drift'],                                              to: ['component', 'token', 'doc'] },
};
const EDGE_NAMES = Object.keys(EDGE_RULES);

const STATUS_ENUM = {
  drift: ['open', 'accepted', 'resolved'],
  default: ['stable', 'wip', 'deprecated', 'drifting'],
};

const REQUIRED_COMMON = ['schema_version', 'id', 'type', 'title', 'status', 'last_audited'];
const DRIFT_REQUIRED = ['cause'];
const DRIFT_CAUSES = ['ambiguous_in_spec', 'overridden_in_code', 'parallel_authoring', 'unimplemented'];

// ─── Frontmatter parser ─────────────────────────────────────────────────────
// Supports: scalars, inline arrays `[a, b]`, block arrays (- item lines),
// comments (#), empty values. Does NOT support nested objects — by design;
// see R6 (audit_log lives in body, not frontmatter).

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  for (let raw of lines) {
    const line = raw.replace(/\s+#.*$/, ''); // strip trailing comments
    if (!line.trim()) { currentKey = null; continue; }

    // Block-array continuation: "  - item"
    const itemMatch = line.match(/^\s+-\s*(.+)$/);
    if (itemMatch && currentKey) {
      fm[currentKey].push(coerce(itemMatch[1].trim()));
      continue;
    }

    // key: value  OR  key:  (start of block array)
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kvMatch) continue;
    const key = kvMatch[1];
    const rest = kvMatch[2].trim();

    if (rest === '') { fm[key] = []; currentKey = key; continue; }

    // Inline array: [a, b, c]
    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1).trim();
      fm[key] = inner === '' ? [] : inner.split(',').map(s => coerce(s.trim()));
      currentKey = null;
      continue;
    }

    fm[key] = coerce(rest);
    currentKey = null;
  }
  return fm;
}

function coerce(s) {
  if (s === 'null' || s === '') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ─── Load all nodes into memory ──────────────────────────────────────────────

function loadGraph() {
  const nodes = {};
  const errors = [];
  for (const type of NODE_TYPES) {
    const dir = path.join(GRAPH_DIR, type);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const full = path.join(dir, file);
      const text = fs.readFileSync(full, 'utf8');
      const fm = parseFrontmatter(text);
      if (!fm) { errors.push(`${full}: no frontmatter`); continue; }
      const slug = file.replace(/\.md$/, '');
      const expectedId = `${type}/${slug}`;
      nodes[expectedId] = { ...fm, _file: full, _type: type, _slug: slug, _expectedId: expectedId };
    }
  }
  return { nodes, loadErrors: errors };
}

// ─── Validate ────────────────────────────────────────────────────────────────

function validate() {
  const { nodes, loadErrors } = loadGraph();
  const errors = [...loadErrors];
  const warnings = [];

  for (const [id, n] of Object.entries(nodes)) {
    const where = path.relative(process.cwd(), n._file);

    // R1: required common fields
    for (const field of REQUIRED_COMMON) {
      if (n[field] === undefined || n[field] === null || n[field] === '') {
        errors.push(`${where}: R1 missing required field '${field}'`);
      }
    }

    // R2: id format + path match
    if (n.id !== id) {
      errors.push(`${where}: R2 frontmatter id '${n.id}' does not match expected '${id}' (from path)`);
    }
    if (n.type !== n._type) {
      errors.push(`${where}: R2 frontmatter type '${n.type}' does not match folder '${n._type}'`);
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(n._slug)) {
      errors.push(`${where}: R2 slug '${n._slug}' must be URL-safe (alphanumeric, hyphen, underscore, dot only)`);
    }

    // R10: schema_version
    if (n.schema_version !== SCHEMA_VERSION) {
      warnings.push(`${where}: R10 schema_version ${n.schema_version} ≠ current ${SCHEMA_VERSION}`);
    }

    // R7: status enum
    const validStatus = n._type === 'drift' ? STATUS_ENUM.drift : STATUS_ENUM.default;
    if (n.status && !validStatus.includes(n.status)) {
      errors.push(`${where}: R7 status '${n.status}' not in [${validStatus.join(', ')}] for type ${n._type}`);
    }

    // R3/R4: edges
    for (const edge of EDGE_NAMES) {
      const targets = n[edge];
      if (targets === undefined) continue;
      if (!Array.isArray(targets)) {
        errors.push(`${where}: R3 edge '${edge}' must be an array`);
        continue;
      }
      const rule = EDGE_RULES[edge];
      if (!rule.from.includes(n._type)) {
        errors.push(`${where}: R4 edge '${edge}' not allowed from type '${n._type}' (allowed: ${rule.from.join(', ')})`);
      }
      for (const target of targets) {
        if (!nodes[target]) {
          errors.push(`${where}: R3 edge '${edge}' → '${target}' (target does not exist)`);
          continue;
        }
        if (!rule.to.includes(nodes[target]._type)) {
          errors.push(`${where}: R4 edge '${edge}' → '${target}' has wrong target type '${nodes[target]._type}' (allowed: ${rule.to.join(', ')})`);
        }
        if (rule.sameType && nodes[target]._type !== n._type) {
          errors.push(`${where}: R4 edge '${edge}' → '${target}' must be same type as source (source '${n._type}', target '${nodes[target]._type}')`);
        }
      }
    }

    // R8: drift requirements
    if (n._type === 'drift') {
      for (const field of DRIFT_REQUIRED) {
        if (!n[field]) errors.push(`${where}: R8 drift missing '${field}'`);
      }
      if (n.cause && !DRIFT_CAUSES.includes(n.cause)) {
        errors.push(`${where}: R8 drift cause '${n.cause}' not in [${DRIFT_CAUSES.join(', ')}]`);
      }
      if (!n.drifts_from || n.drifts_from.length === 0) {
        errors.push(`${where}: R8 drift missing 'drifts_from'`);
      }
      if (!n.affects || n.affects.length === 0) {
        errors.push(`${where}: R8 drift needs at least one 'affects' target`);
      }
    }
  }

  if (errors.length) {
    for (const e of errors) console.error('ERR  ' + e);
  }
  if (warnings.length) {
    for (const w of warnings) console.warn('WARN ' + w);
  }
  if (errors.length === 0) {
    console.log(`OK   ${Object.keys(nodes).length} nodes validated${warnings.length ? ` (${warnings.length} warnings)` : ''}`);
  }
  process.exit(errors.length ? 1 : 0);
}

// ─── Inverse edge computation ───────────────────────────────────────────────

function computeIncoming(nodes, targetId) {
  const incoming = {};
  for (const [srcId, n] of Object.entries(nodes)) {
    for (const edge of EDGE_NAMES) {
      const targets = n[edge];
      if (!Array.isArray(targets)) continue;
      if (targets.includes(targetId)) {
        (incoming[edge] ||= []).push(srcId);
      }
    }
  }
  return incoming;
}

// ─── Query ───────────────────────────────────────────────────────────────────

function query(id) {
  const { nodes } = loadGraph();
  const n = nodes[id];
  if (!n) {
    console.error(`Node not found: ${id}`);
    process.exit(1);
  }
  console.log(`${id} (${n.status || '?'})`);
  console.log(`Type:    ${n._type}`);
  console.log(`Title:   ${n.title}`);
  console.log(`Audited: ${n.last_audited}`);
  if (n.tags) console.log(`Tags:    ${n.tags.join(', ')}`);
  if (n.file) console.log(`File:    ${Array.isArray(n.file) ? n.file.join(', ') : n.file}`);
  if (n.surface) console.log(`Surface: ${n.surface}`);
  if (n.aliases) console.log(`Aliases: ${n.aliases.join(', ')}`);
  if (n.cause) console.log(`Cause:   ${n.cause}`);

  console.log('\nOutgoing:');
  let outCount = 0;
  for (const edge of EDGE_NAMES) {
    if (Array.isArray(n[edge]) && n[edge].length) {
      console.log(`  ${edge}:`);
      for (const t of n[edge]) console.log(`    - ${t}`);
      outCount += n[edge].length;
    }
  }
  if (!outCount) console.log('  (none)');

  console.log('\nIncoming (computed):');
  const incoming = computeIncoming(nodes, id);
  const inCount = Object.values(incoming).reduce((a, b) => a + b.length, 0);
  for (const [edge, sources] of Object.entries(incoming)) {
    console.log(`  ${edge} ←`);
    for (const s of sources) console.log(`    - ${s}`);
  }
  if (!inCount) console.log('  (none)');
}

// ─── Path ────────────────────────────────────────────────────────────────────

function findPath(from, to) {
  const { nodes } = loadGraph();
  if (!nodes[from]) { console.error(`Node not found: ${from}`); process.exit(1); }
  if (!nodes[to])   { console.error(`Node not found: ${to}`);   process.exit(1); }

  const adj = {};
  for (const [srcId, n] of Object.entries(nodes)) {
    for (const edge of EDGE_NAMES) {
      const targets = n[edge];
      if (!Array.isArray(targets)) continue;
      for (const t of targets) {
        (adj[srcId] ||= []).push({ to: t, edge, dir: 'out' });
        (adj[t]     ||= []).push({ to: srcId, edge, dir: 'in' });
      }
    }
  }

  const queue = [[from]];
  const visited = new Set([from]);
  while (queue.length) {
    const route = queue.shift();
    const tail = route[route.length - 1];
    if (tail === to) {
      console.log(`Path (${route.length - 1} hops):`);
      for (let i = 0; i < route.length; i++) {
        if (i === 0) console.log(`  ${route[i]}`);
        else {
          const link = (adj[route[i - 1]] || []).find(e => e.to === route[i]);
          const arrow = link?.dir === 'out' ? `--[${link.edge}]-->` : `<--[${link?.edge}]--`;
          console.log(`    ${arrow}`);
          console.log(`  ${route[i]}`);
        }
      }
      return;
    }
    for (const { to: next } of adj[tail] || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push([...route, next]);
    }
  }
  console.log(`No path from ${from} to ${to}.`);
  process.exit(1);
}

// ─── Audit ───────────────────────────────────────────────────────────────────

function audit() {
  const { nodes } = loadGraph();
  const now = new Date();
  const STALE_DAYS = 180;
  const allIds = new Set(Object.keys(nodes));

  const referenced = new Set();
  for (const n of Object.values(nodes)) {
    for (const edge of EDGE_NAMES) {
      if (Array.isArray(n[edge])) for (const t of n[edge]) referenced.add(t);
    }
  }

  const stale = [];
  const unreferenced = [];
  const untested = [];
  const unmoored = [];
  const expired_drift = [];

  for (const [id, n] of Object.entries(nodes)) {
    if (n.last_audited) {
      const days = (now - new Date(n.last_audited)) / 86400000;
      if (days > STALE_DAYS) stale.push(`${id} (${Math.round(days)}d)`);
    }
    const hasOutgoing = EDGE_NAMES.some(e => Array.isArray(n[e]) && n[e].length);
    if (!referenced.has(id) && !hasOutgoing) unreferenced.push(id);

    if (n._type === 'spec' && !(n.tested_by && n.tested_by.length)) untested.push(id);

    if (n._type === 'component') {
      const hasGoverner = [...allIds].some(srcId => {
        const src = nodes[srcId];
        return (src._type === 'spec' || src._type === 'concept') && Array.isArray(src.governs) && src.governs.includes(id);
      });
      const hasBelongs = Array.isArray(n.belongs_to) && n.belongs_to.length;
      if (!hasGoverner && !hasBelongs) unmoored.push(id);
    }

    if (n._type === 'drift' && n.status === 'open') {
      const created = new Date(n.last_audited);
      const days = (now - created) / 86400000;
      const limit = n.auto_accept_after ?? 90;
      if (days > limit) expired_drift.push(`${id} (${Math.round(days)}d > ${limit}d → should flip to accepted)`);
    }
  }

  const sections = [
    ['Stale (last_audited > 180 days)', stale],
    ['Unreferenced (no edges in or out)', unreferenced],
    ['Untested specs (no tested_by)', untested],
    ['Unmoored components (no spec/concept governs, no belongs_to)', unmoored],
    ['Expired open drift (past auto_accept_after)', expired_drift],
  ];

  let total = 0;
  for (const [title, items] of sections) {
    if (items.length) {
      console.log(`\n${title}:`);
      for (const item of items) console.log(`  - ${item}`);
      total += items.length;
    }
  }
  if (total === 0) console.log('Audit clean.');
  else console.log(`\n${total} audit findings across ${sections.filter(s => s[1].length).length} categories.`);
}

// ─── Diff ────────────────────────────────────────────────────────────────────

function diff(ref) {
  if (!ref) { console.error('Usage: diff <git-ref>'); process.exit(1); }
  let out;
  try {
    out = execSync(`git diff --name-status ${ref} -- graph/`, { cwd: path.resolve(GRAPH_DIR, '..'), encoding: 'utf8' });
  } catch (e) {
    console.error(`git diff failed: ${e.message}`);
    process.exit(1);
  }
  if (!out.trim()) { console.log(`No graph changes since ${ref}.`); return; }
  const lines = out.trim().split('\n');
  const added = [], removed = [], modified = [];
  for (const line of lines) {
    const [status, file] = line.split('\t');
    if (!file.endsWith('.md')) continue;
    const id = file.replace(/^graph\//, '').replace(/\.md$/, '');
    if (status === 'A') added.push(id);
    else if (status === 'D') removed.push(id);
    else modified.push(id);
  }
  if (added.length)    { console.log('Added:');    for (const x of added)    console.log(`  + ${x}`); }
  if (removed.length)  { console.log('Removed:');  for (const x of removed)  console.log(`  - ${x}`); }
  if (modified.length) { console.log('Modified:'); for (const x of modified) console.log(`  ~ ${x}`); }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const [, , cmd, ...args] = process.argv;

switch (cmd) {
  case 'validate': validate(); break;
  case 'query':    query(args[0]); break;
  case 'path':     findPath(args[0], args[1]); break;
  case 'audit':    audit(); break;
  case 'diff':     diff(args[0]); break;
  default:
    console.log('Homestead graph CLI');
    console.log('Usage:');
    console.log('  node graph/_traverse.js validate');
    console.log('  node graph/_traverse.js query <id>');
    console.log('  node graph/_traverse.js path <from-id> <to-id>');
    console.log('  node graph/_traverse.js audit');
    console.log('  node graph/_traverse.js diff <git-ref>');
    process.exit(cmd ? 1 : 0);
}
