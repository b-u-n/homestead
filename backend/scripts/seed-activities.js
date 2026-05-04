#!/usr/bin/env node
/**
 * One-shot seed: populates the WorkbookActivity collection from
 * activities/v2/*.json and the Workbook collection from the canonical
 * clinical bookshelves list. Idempotent — safe to re-run.
 *
 * Usage (from anywhere):
 *   node backend/scripts/seed-activities.js
 *
 * Reads MONGODB_URI from backend/.env (same as the server).
 */
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const seedActivitiesV2 = require('../src/seeds/seedActivitiesV2');
const seedClinicalBookshelves = require('../src/seeds/seedClinicalBookshelves');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set — aborting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

    await seedActivitiesV2();
    await seedClinicalBookshelves();

    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
