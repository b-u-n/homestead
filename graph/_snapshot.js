#!/usr/bin/env node
/**
 * Filesystem snapshot for the Homestead graph integration workflow.
 *
 * Captures mtime + size for every file we'd want to re-analyze before
 * integrating /graph/_PENDING_INTEGRATION.md. Acts as a baseline since
 * the user is doing parallel uncommitted work — git can't diff what
 * was never committed.
 *
 * Usage:
 *   node graph/_snapshot.js capture       # write _SNAPSHOT.json
 *   node graph/_snapshot.js diff          # changed since baseline
 *   node graph/_snapshot.js diff --since <iso-date>   # changed after a date
 *
 * Scope (configurable below):
 *   /graph/**         all node files + scripts
 *   /md/**            prose archive
 *   /frontend/...     component + flow + screen + store + service code
 *   /backend/src/**   server code
 *   /activities/v2/** workbook v2 corpus
 *   /CLAUDE.md, /README.md
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_PATH = path.join(__dirname, '_SNAPSHOT.json');

// Directories to walk (relative to repo root). Each entry has:
//   - dir: starting directory
//   - exts: file extensions to include
const SCOPE = [
  { dir: 'graph',                       exts: ['.md', '.js', '.json'] },
  { dir: 'md',                          exts: ['.md'] },
  { dir: 'frontend/components',         exts: ['.js', '.jsx', '.ts', '.tsx'] },
  { dir: 'frontend/flows',              exts: ['.js', '.jsx', '.ts', '.tsx'] },
  { dir: 'frontend/screens',            exts: ['.js', '.jsx', '.ts', '.tsx'] },
  { dir: 'frontend/stores',             exts: ['.js', '.jsx', '.ts', '.tsx'] },
  { dir: 'frontend/services',           exts: ['.js', '.jsx', '.ts', '.tsx'] },
  { dir: 'frontend/app',                exts: ['.js', '.jsx', '.ts', '.tsx'] },
  { dir: 'backend/src',                 exts: ['.js', '.ts'] },
  { dir: 'backend/prompts',             exts: ['.md'] },
  { dir: 'activities/v2',               exts: ['.md', '.json', '.js'] },
];

// Skip these even within scope
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'public']);

// Standalone files (relative to repo root)
const STANDALONE = ['CLAUDE.md', 'README.md'];

// ─── Walk ───────────────────────────────────────────────────────────────────

function walk(dir, exts, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, exts, out);
    } else if (e.isFile() && exts.includes(path.extname(e.name))) {
      const st = fs.statSync(full);
      const rel = path.relative(REPO_ROOT, full);
      out[rel] = { mtime: st.mtimeMs, size: st.size };
    }
  }
}

function snapshotNow() {
  const out = {};
  for (const { dir, exts } of SCOPE) {
    walk(path.join(REPO_ROOT, dir), exts, out);
  }
  for (const rel of STANDALONE) {
    const full = path.join(REPO_ROOT, rel);
    if (fs.existsSync(full)) {
      const st = fs.statSync(full);
      out[rel] = { mtime: st.mtimeMs, size: st.size };
    }
  }
  return out;
}

// ─── Capture ────────────────────────────────────────────────────────────────

function capture() {
  const snap = snapshotNow();
  const payload = {
    capturedAt: new Date().toISOString(),
    fileCount: Object.keys(snap).length,
    files: snap,
  };
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Captured ${payload.fileCount} files → ${path.relative(process.cwd(), SNAPSHOT_PATH)}`);
  console.log(`At: ${payload.capturedAt}`);
}

// ─── Diff ───────────────────────────────────────────────────────────────────

function loadSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error(`No snapshot at ${SNAPSHOT_PATH}. Run \`node graph/_snapshot.js capture\` first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
}

function diff(opts) {
  const baseline = loadSnapshot();
  const current = snapshotNow();

  const added = [];
  const removed = [];
  const modified = [];

  const sinceMs = opts.since ? new Date(opts.since).getTime() : null;
  const baselineFiles = baseline.files;

  for (const [rel, cur] of Object.entries(current)) {
    const base = baselineFiles[rel];
    if (!base) {
      if (sinceMs === null || cur.mtime > sinceMs) added.push(rel);
      continue;
    }
    if (cur.mtime !== base.mtime || cur.size !== base.size) {
      if (sinceMs === null || cur.mtime > sinceMs) modified.push(rel);
    }
  }
  for (const rel of Object.keys(baselineFiles)) {
    if (!current[rel]) removed.push(rel);
  }

  const total = added.length + removed.length + modified.length;
  if (total === 0) {
    console.log(`No changes since ${baseline.capturedAt}${sinceMs ? ` and after ${opts.since}` : ''}.`);
    return;
  }

  console.log(`Since baseline (${baseline.capturedAt})${sinceMs ? `, restricted to mtimes after ${opts.since}` : ''}:`);
  console.log(`  ${added.length} added, ${modified.length} modified, ${removed.length} removed`);

  // Bucket by top-level area for scannability
  const buckets = {};
  const tag = (rel) => {
    if (rel.startsWith('graph/'))          return 'graph';
    if (rel.startsWith('md/'))             return 'md (prose archive)';
    if (rel.startsWith('frontend/'))       return 'frontend code';
    if (rel.startsWith('backend/'))        return 'backend code';
    if (rel.startsWith('activities/v2/'))  return 'activities/v2';
    return 'root';
  };
  for (const rel of added) (buckets[tag(rel)] ||= { added: [], modified: [], removed: [] }).added.push(rel);
  for (const rel of modified) (buckets[tag(rel)] ||= { added: [], modified: [], removed: [] }).modified.push(rel);
  for (const rel of removed) (buckets[tag(rel)] ||= { added: [], modified: [], removed: [] }).removed.push(rel);

  const order = ['graph', 'md (prose archive)', 'frontend code', 'backend code', 'activities/v2', 'root'];
  for (const t of order) {
    const b = buckets[t];
    if (!b) continue;
    console.log(`\n${t}:`);
    for (const rel of b.added)    console.log(`  + ${rel}`);
    for (const rel of b.modified) console.log(`  ~ ${rel}`);
    for (const rel of b.removed)  console.log(`  - ${rel}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

const [, , cmd, ...args] = process.argv;
switch (cmd) {
  case 'capture': capture(); break;
  case 'diff': {
    const sinceIdx = args.indexOf('--since');
    const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;
    diff({ since });
    break;
  }
  default:
    console.log('Usage:');
    console.log('  node graph/_snapshot.js capture');
    console.log('  node graph/_snapshot.js diff');
    console.log('  node graph/_snapshot.js diff --since <iso-date>');
    process.exit(cmd ? 1 : 0);
}
