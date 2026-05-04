#!/usr/bin/env node

/**
 * Export a RoomLayoutOverlay document to a JS array literal that can be
 * pasted directly into a frontend/locations/sections/<location>.js entities array.
 *
 * Usage:
 *   node backend/scripts/exportLayoutOverlay.js <locationId>
 *
 * Example:
 *   node backend/scripts/exportLayoutOverlay.js town-square
 *
 * Outputs to stdout. Maps platformAssetId back to its require() path using
 * frontend/constants/platformAssets.js as the source of truth.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const RoomLayoutOverlay = require('../src/models/RoomLayoutOverlay');

const PLATFORM_ASSETS_PATH = path.join(__dirname, '../../frontend/constants/platformAssets.js');

// Parse the platformAssets.js file with a regex to recover { id -> require path }.
function loadAssetRequirePaths() {
  const src = fs.readFileSync(PLATFORM_ASSETS_PATH, 'utf-8');
  const map = {};
  const re = /\{\s*id:\s*'([^']+)'\s*,[^}]*image:\s*require\(\s*'([^']+)'\s*\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

async function main() {
  const locationId = process.argv[2];
  if (!locationId) {
    console.error('Usage: node backend/scripts/exportLayoutOverlay.js <locationId>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const overlay = await RoomLayoutOverlay.findOne({ locationId }).lean();
  if (!overlay) {
    console.error(`No overlay document found for location: ${locationId}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const tiles = overlay.tiles || [];
  const overrides = overlay.entityOverrides || [];
  const hidden = overlay.hiddenEntityIds || [];

  if (tiles.length === 0 && overrides.length === 0 && hidden.length === 0) {
    console.error(`Overlay for ${locationId} is empty.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const requirePaths = loadAssetRequirePaths();
  const lines = [];
  lines.push(`// Generated from RoomLayoutOverlay (${locationId}) at ${new Date().toISOString()}`);
  lines.push('');

  // ---- Overlay tiles ----
  if (tiles.length > 0) {
    lines.push(`// === Overlay tiles ===`);
    lines.push(`// Paste these into the entities array of frontend/locations/sections/${locationId}.js`);
    tiles.forEach((t, i) => {
      const reqPath = requirePaths[t.platformAssetId];
      const imageLine = reqPath
        ? `image: require('${reqPath}'),`
        : `image: null, // unresolved platformAssetId: ${t.platformAssetId}`;
      lines.push(`{`);
      lines.push(`  id: '${locationId}-overlay-${i}',`);
      lines.push(`  type: 'decoration',`);
      lines.push(`  x: ${t.x},`);
      lines.push(`  y: ${t.y},`);
      lines.push(`  width: ${t.width},`);
      lines.push(`  height: ${t.height},`);
      lines.push(`  zIndex: ${t.zIndex || 0},`);
      lines.push(`  ${imageLine}`);
      lines.push(`  showTitle: false,`);
      lines.push(`},`);
    });
    lines.push('');
  }

  // ---- Entity position overrides ----
  if (overrides.length > 0) {
    lines.push(`// === Entity position overrides ===`);
    lines.push(`// Apply these positional values to the matching hardcoded entity by id`);
    lines.push(`// in frontend/locations/sections/${locationId}.js (or wherever it's defined).`);
    overrides.forEach(o => {
      lines.push(`// id: '${o.entityId}'`);
      lines.push(`//   x: ${o.x}, y: ${o.y}, width: ${o.width}, height: ${o.height}, zIndex: ${o.zIndex || 0}`);
    });
    lines.push('');
  }

  // ---- Hidden entities ----
  if (hidden.length > 0) {
    lines.push(`// === Hidden entities ===`);
    lines.push(`// Remove these entries from the entities array in the source file:`);
    hidden.forEach(id => lines.push(`//   '${id}'`));
    lines.push('');
  }

  console.log(lines.join('\n'));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
