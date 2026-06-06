#!/usr/bin/env node

/**
 * Upsert an entity override on a location's RoomLayoutOverlay document.
 *
 * Usage:
 *   node backend/scripts/setEntityOverride.js <locationId> <entityId> key=value [key=value ...]
 *
 * Example (set the campfire's zIndex, providing its source position):
 *   node backend/scripts/setEntityOverride.js town-square campfire x=974 y=774 width=100 height=100 zIndex=9999
 *
 * If an override for the entity already exists, provided keys are merged onto it
 * (so `zIndex=9999` alone updates just the z). For a NEW override, x, y, width and
 * height are required because the frontend applies overrides wholesale.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const RoomLayoutOverlay = require('../src/models/RoomLayoutOverlay');

async function main() {
  const [locationId, entityId, ...pairs] = process.argv.slice(2);
  if (!locationId || !entityId || pairs.length === 0) {
    console.error('Usage: node backend/scripts/setEntityOverride.js <locationId> <entityId> key=value [...]');
    process.exit(1);
  }

  const updates = {};
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (!['x', 'y', 'width', 'height', 'zIndex'].includes(key) || value === undefined || Number.isNaN(Number(value))) {
      console.error(`Invalid argument: ${pair} (expected x/y/width/height/zIndex=<number>)`);
      process.exit(1);
    }
    updates[key] = Number(value);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const overlay = await RoomLayoutOverlay.findOne({ locationId })
    || new RoomLayoutOverlay({ locationId, tiles: [], entityOverrides: [], hiddenEntityIds: [] });

  const existing = overlay.entityOverrides.find(o => o.entityId === entityId);
  if (existing) {
    Object.assign(existing, updates);
    console.log(`Updated override for '${entityId}' in ${locationId}:`, existing.toObject());
  } else {
    const required = ['x', 'y', 'width', 'height'];
    const missing = required.filter(k => updates[k] === undefined);
    if (missing.length > 0) {
      console.error(`No existing override for '${entityId}' — new overrides need ${missing.join(', ')} too.`);
      await mongoose.disconnect();
      process.exit(2);
    }
    overlay.entityOverrides.push({ entityId, zIndex: 0, ...updates });
    console.log(`Created override for '${entityId}' in ${locationId}:`, { entityId, zIndex: 0, ...updates });
  }

  await overlay.save();
  await mongoose.disconnect();
  console.log('Saved.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
