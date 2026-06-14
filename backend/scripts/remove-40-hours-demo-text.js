#!/usr/bin/env node
/**
 * One-shot: removes the entire sentence containing "40 hours" from the
 * activities-demo copy stored in the `text` collection (DemoText model).
 *
 * The demo page's intro/bottom copy lives only in the DB (no seed in code —
 * see backend/src/routes/demoText.js), so this can't be done with a file edit.
 *
 * Dry-run by default: prints which doc/sentence would change and exits without
 * writing. Pass --apply to actually persist the edit. Idempotent.
 *
 *   node backend/scripts/remove-40-hours-demo-text.js          # preview
 *   node backend/scripts/remove-40-hours-demo-text.js --apply  # write
 */
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DemoText = require('../src/models/DemoText');

const APPLY = process.argv.includes('--apply');

// Matches a full sentence that contains "40 hours" (any spacing, optional
// plural, case-insensitive): from the previous sentence boundary up to and
// including this sentence's terminator, plus any trailing whitespace.
const SENTENCE_WITH_PHRASE = /\s*[^.!?\n]*?40\s*hours?[^.!?\n]*[.!?]+/gi;

const stripSentence = (content) => {
  const removed = [];
  const next = content.replace(SENTENCE_WITH_PHRASE, (match) => {
    removed.push(match.trim());
    return '';
  });
  // Tidy up spacing left behind by the removal.
  const cleaned = next
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.!?,;])/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  return { cleaned, removed };
};

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set — aborting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
    console.log(APPLY ? 'Mode: APPLY (will write)\n' : 'Mode: DRY RUN (no writes — pass --apply to persist)\n');

    // Case-insensitive match on the literal phrase, flexible whitespace.
    const docs = await DemoText.find({ content: { $regex: /40\s*hours?/i } });

    if (!docs.length) {
      console.log('No demo-text documents contain "40 hours" — nothing to do.');
      return;
    }

    let changed = 0;
    for (const doc of docs) {
      const { cleaned, removed } = stripSentence(doc.content);
      if (cleaned === doc.content || !removed.length) {
        console.log(`[key="${doc.key}"] phrase present but no full sentence matched — skipping (review manually).`);
        continue;
      }
      console.log(`[key="${doc.key}"] removing ${removed.length} sentence(s):`);
      removed.forEach((s) => console.log(`   - "${s}"`));

      if (APPLY) {
        doc.content = cleaned;
        doc.updatedAt = new Date();
        await doc.save();
        console.log(`   ✓ saved.`);
      }
      changed++;
    }

    console.log(`\n${APPLY ? 'Updated' : 'Would update'} ${changed} document(s).`);
    if (!APPLY && changed) console.log('Re-run with --apply to persist.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
