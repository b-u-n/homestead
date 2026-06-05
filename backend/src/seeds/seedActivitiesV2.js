/**
 * Seed activities/v2/*.json into the WorkbookActivity collection on boot.
 *
 * `activities/v2/` is the canonical source of truth — there is no v1.
 * Any activity in the DB that is NOT represented by a JSON file in this
 * directory is treated as stale and removed, so the DB always matches the
 * filesystem after boot.
 *
 * Idempotent: each file is upserted by activityId. Skips files starting
 * with `_` (e.g. _SCHEMA.md, _migrate-r6-r2.js).
 *
 * Called once from `backend/src/server.js` after `connectDB()` resolves.
 */
const path = require('path');
const fs = require('fs');
const WorkbookActivity = require('../models/WorkbookActivity');

const ACTIVITIES_DIR = path.join(__dirname, '../../../activities/v2');

// activityIds of the original (stable) activity set. Everything else seeded
// from activities/v2/ is treated as beta and gated behind the beta view.
// To promote a beta activity, add its activityId to this set.
const STABLE_ACTIVITY_IDS = new Set([
  '5-step-problem-solving',
  'behavioral-experiment',
  'body-scan',
  'breath-meditation',
  'gad7-assessment',
  'gratitude-log',
  'phq9-assessment',
  'lapse-relapse-planning',
  'safety-plan',
  'support-network-map',
  'cognitive-distortions-identification',
  'thought-record',
  'values-inventory',
]);

async function seedActivitiesV2() {
  if (!fs.existsSync(ACTIVITIES_DIR)) {
    console.log('[seedActivitiesV2] no activities/v2 dir — skipping');
    return;
  }

  const files = fs.readdirSync(ACTIVITIES_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  let upserted = 0;
  let failed = 0;
  const canonicalIds = new Set();

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(ACTIVITIES_DIR, file), 'utf8');
      const doc = JSON.parse(raw);

      if (!doc.activityId || !doc.title || !Array.isArray(doc.steps)) {
        console.warn(`[seedActivitiesV2] ${file}: missing activityId/title/steps — skipping`);
        failed++;
        continue;
      }

      // Templates are authoring scaffolds — kept in activities/v2/ as a
      // copy-from base for new activities, but never seeded into Mongo and
      // never surfaced to users. Any prior DB record with this activityId
      // will be pruned by the stale-removal block below since the id is
      // not added to canonicalIds.
      if (doc.template === true) {
        continue;
      }

      canonicalIds.add(doc.activityId);

      // isBeta: prefer the JSON's explicit value when set, else default by
      // membership in STABLE_ACTIVITY_IDS (everything not stable is beta).
      const isBeta = typeof doc.isBeta === 'boolean'
        ? doc.isBeta
        : !STABLE_ACTIVITY_IDS.has(doc.activityId);

      await WorkbookActivity.findOneAndUpdate(
        { activityId: doc.activityId },
        { $set: { ...doc, isBeta } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserted++;
    } catch (err) {
      console.error(`[seedActivitiesV2] ${file}: ${err.message}`);
      failed++;
    }
  }

  // Sync — remove any DB activity that no longer has a JSON file.
  const stale = await WorkbookActivity.deleteMany({
    activityId: { $nin: Array.from(canonicalIds) },
  });

  console.log(
    `[seedActivitiesV2] upserted ${upserted} activities (${failed} failed); ` +
    `removed ${stale?.deletedCount ?? 0} stale`
  );
}

module.exports = seedActivitiesV2;
