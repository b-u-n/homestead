/**
 * Seed 8 clinical bookshelves with tagFilters. Activities self-populate
 * via the `workbook:load` tag-filter resolution in flows/workbook.js.
 *
 * Idempotent: each bookshelf is upserted by bookshelfId. Re-running replaces.
 *
 * Called once from `backend/src/server.js` after `connectDB()` resolves.
 */
const Workbook = require('../models/Workbook');

const BOOKSHELVES = [
  {
    bookshelfId: 'anxiety',
    title: 'Working with anxiety',
    tagFilters: {
      conditions: [
        'generalized-anxiety-disorder',
        'anxiety-disorders',
        'panic',
        'panic-disorder',
        'social-anxiety',
        'specific-phobia',
        'health-anxiety',
        'chronic-worry'
      ],
      themes: []
    }
  },
  {
    bookshelfId: 'depression',
    title: 'Working with low mood',
    tagFilters: {
      conditions: [
        'major-depressive-disorder',
        'persistent-depressive-disorder',
        'depression'
      ],
      themes: []
    }
  },
  {
    bookshelfId: 'sleep',
    title: 'Sleep & rest',
    tagFilters: {
      conditions: ['insomnia', 'sleep-hygiene'],
      themes: ['sleep']
    }
  },
  {
    bookshelfId: 'relationships',
    title: 'Relationships & connection',
    tagFilters: {
      conditions: ['relationships', 'interpersonal', 'attachment', 'boundaries'],
      themes: ['interpersonal']
    }
  },
  {
    bookshelfId: 'stress',
    title: 'Stress & coping',
    tagFilters: {
      conditions: ['stress', 'chronic-stress', 'overwhelm'],
      themes: ['coping']
    }
  },
  {
    bookshelfId: 'self-compassion',
    title: 'Self-compassion',
    tagFilters: {
      conditions: ['self-criticism', 'self-compassion'],
      themes: ['self-compassion', 'gratitude']
    }
  },
  {
    bookshelfId: 'crisis',
    title: 'Crisis support',
    tagFilters: {
      conditions: ['crisis', 'safety', 'suicidality'],
      themes: ['crisis-intervention', 'safety']
    }
  },
  {
    bookshelfId: 'daily-wellness',
    title: 'Daily wellness',
    tagFilters: {
      conditions: ['lifestyle', 'wellness', 'habits'],
      themes: ['mindfulness', 'body-scan', 'breath', 'wellness']
    }
  }
];

async function seedClinicalBookshelves() {
  let upserted = 0;
  for (const b of BOOKSHELVES) {
    try {
      // Preserve existing activities array if any (it may be statically populated for legacy bookshelves);
      // tagFilters is the source of truth for v2 activities.
      const existing = await Workbook.findOne({ bookshelfId: b.bookshelfId }).lean();
      await Workbook.findOneAndUpdate(
        { bookshelfId: b.bookshelfId },
        {
          $set: {
            title: b.title,
            tagFilters: b.tagFilters,
            ...(existing?.activities ? {} : { activities: [] })
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserted++;
    } catch (err) {
      console.error(`[seedClinicalBookshelves] ${b.bookshelfId}: ${err.message}`);
    }
  }
  console.log(`[seedClinicalBookshelves] upserted ${upserted}/${BOOKSHELVES.length} bookshelves`);
}

module.exports = seedClinicalBookshelves;
