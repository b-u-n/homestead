#!/usr/bin/env node

/**
 * Bulk-resize overlay tiles of a single asset type to that asset's canonical
 * editor dimensions (the `editorWidth` / `editorHeight` declared in
 * frontend/constants/platformAssets.js).
 *
 * Why this exists:
 *   When a `platformAssets.js` entry's `editorWidth/editorHeight` is added or
 *   changed AFTER tiles have been placed, the previously-placed tiles keep
 *   the dimensions they were saved with. This script retroactively conforms
 *   them to the catalog values.
 *
 * Scope:
 *   - Only tiles whose `platformAssetId` matches the supplied id are touched.
 *   - Only the `tiles` array is rewritten. `entityOverrides` and
 *     `hiddenEntityIds` on the same overlay document are left untouched.
 *
 * Usage:
 *   node backend/scripts/resizeOverlayTiles.js <locationId> <platformAssetId>
 *
 * Example:
 *   node backend/scripts/resizeOverlayTiles.js town-square path-midpoint
 *
 * Exits with status 0 on success (including no-op), non-zero on bad args or
 * missing catalog dimensions.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const RoomLayoutOverlay = require('../src/models/RoomLayoutOverlay');

const PLATFORM_ASSETS_PATH = path.join(__dirname, '../../frontend/constants/platformAssets.js');

// Parse platformAssets.js to find { id, editorWidth, editorHeight } for the requested asset.
// We don't actually require() it (it imports from frontend with require() of PNGs). A
// regex over the source is enough — the editor entries have a stable shape.
function loadAssetDims(assetId) {
  const src = fs.readFileSync(PLATFORM_ASSETS_PATH, 'utf-8');
  // Find the line declaring this asset id.
  const idEscaped = assetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lineRe = new RegExp(`\\{[^}]*\\bid:\\s*'${idEscaped}'[^}]*\\}`);
  const match = src.match(lineRe);
  if (!match) return null;
  const block = match[0];
  const wMatch = block.match(/editorWidth:\s*(\d+(?:\.\d+)?)/);
  const hMatch = block.match(/editorHeight:\s*(\d+(?:\.\d+)?)/);
  if (!wMatch || !hMatch) return null;
  return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
}

async function main() {
  const locationId = process.argv[2];
  const assetId = process.argv[3];
  if (!locationId || !assetId) {
    console.error('Usage: node backend/scripts/resizeOverlayTiles.js <locationId> <platformAssetId>');
    process.exit(1);
  }

  const dims = loadAssetDims(assetId);
  if (!dims) {
    console.error(`Asset "${assetId}" has no editorWidth/editorHeight in platformAssets.js — declare them and rerun.`);
    process.exit(2);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const overlay = await RoomLayoutOverlay.findOne({ locationId });
  if (!overlay) {
    console.error(`No overlay document for location "${locationId}".`);
    await mongoose.disconnect();
    process.exit(0);
  }

  let resized = 0;
  overlay.tiles.forEach(tile => {
    if (tile.platformAssetId === assetId) {
      tile.width = dims.width;
      tile.height = dims.height;
      resized += 1;
    }
  });

  if (resized === 0) {
    console.log(`No tiles in "${locationId}" use platformAssetId "${assetId}". Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  await overlay.save();
  console.log(`Resized ${resized} tile(s) of "${assetId}" in "${locationId}" to ${dims.width}x${dims.height}.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
