#!/usr/bin/env node

/**
 * Dump every collection in the MongoDB database to local JSON files.
 * No mongodump dependency — uses the app's mongoose connection.
 *
 * Usage:
 *   node backend/scripts/backupDb.js [outputDir]
 *
 * Default output: exports/db-backup-<ISO timestamp>/<collection>.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = process.argv[2]
    || path.join(__dirname, '../../exports', `db-backup-${stamp}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  fs.mkdirSync(outDir, { recursive: true });

  const collections = await db.listCollections().toArray();
  let totalDocs = 0;
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(outDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2));
    totalDocs += docs.length;
    console.log(`${name}: ${docs.length} docs -> ${file}`);
  }

  console.log(`\nBacked up ${collections.length} collections (${totalDocs} docs) to:\n${outDir}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
