/**
 * Migration: Convert old author/responder fields to user object pattern
 *
 * This migrates:
 * - WeepingWillowPost: authorId/authorName/authorAvatar -> user object
 * - WeepingWillowPost responses: responderId/responderName/responderAvatar -> user object
 * - WishingWellPost: authorSessionId/authorName/authorAvatar -> user object
 * - WishingWellPost responses: responderSessionId/responderName/responderAvatar -> user object
 * - WishingWellPost tips: tipperSessionId/tipperName/tipperAvatar -> user object
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homestead';

// Color pool from frontend AvatarGenerationScreen
const COLOR_POOL = [
  '#FF9999', // rose
  '#FFAB66', // coral
  '#FFDD66', // sunshine
  '#99FFD6', // mint
  '#B3E6FF', // sky
  '#DDBBFF', // lavender
  '#7044C7', // plum
  '#C49A6B', // caramel
  '#FF6B6B', // crimson
  '#FF99CC', // bubblegum
  '#66B366', // forest
  '#6BB6FF', // ocean
  '#FFF8E1', // vanilla
  '#FFFFFF', // cloud
  '#B3B3B3', // silver
  '#666666', // charcoal
];

function getRandomColor() {
  return COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  // First, assign random colors to accounts that don't have one
  console.log('\n--- Assigning colors to accounts without colors ---');
  const allAccounts = await db.collection('accounts').find({}).toArray();
  for (const account of allAccounts) {
    const existingColor = account.userData?.avatarData?.variables?.color;
    if (!existingColor && account.userData?.username) {
      const randomColor = getRandomColor();
      await db.collection('accounts').updateOne(
        { _id: account._id },
        {
          $set: {
            'userData.avatarData.variables.color': randomColor
          }
        }
      );
      console.log(`  Assigned ${randomColor} to ${account.userData.username}`);
    }
  }

  // Re-fetch accounts after color assignment
  const accounts = await db.collection('accounts').find({}).toArray();
  const accountById = new Map();
  const sessionToAccount = new Map();
  for (const account of accounts) {
    accountById.set(account._id.toString(), account);
    if (account.activeSessions) {
      for (const session of account.activeSessions) {
        sessionToAccount.set(session.sessionId, account);
      }
    }
  }

  // Helper to get color from account
  // Color is stored in avatarData.variables.color
  const getColorFromAccount = (account) => {
    return account?.userData?.avatarData?.variables?.color || null;
  };

  // Migrate WeepingWillowPosts
  console.log('\n--- Migrating WeepingWillowPosts ---');
  const weepingWillowPosts = await db.collection('weepingwillowposts').find({}).toArray();
  console.log(`Found ${weepingWillowPosts.length} posts`);

  for (const post of weepingWillowPosts) {
    // Look up author account by ID, session, or name
    let authorAccount = null;
    if (post.authorId) {
      authorAccount = accountById.get(post.authorId.toString());
    } else if (post.user?.id) {
      authorAccount = accountById.get(post.user.id.toString());
    }
    // Fallback: try session ID if we still have it
    if (!authorAccount && post.authorSessionId) {
      authorAccount = sessionToAccount.get(post.authorSessionId);
    }
    // Last resort: match by username
    if (!authorAccount && (post.authorName || post.user?.name)) {
      const name = post.authorName || post.user?.name;
      authorAccount = accounts.find(a => a.userData?.username === name);
    }
    const authorColor = getColorFromAccount(authorAccount);

    const update = {
      $set: {
        user: {
          id: authorAccount?._id || post.authorId || post.user?.id || null,
          name: authorAccount?.userData?.username || post.authorName || post.user?.name || 'Anonymous',
          avatar: authorAccount?.userData?.avatar || post.authorAvatar || post.user?.avatar || null,
          color: authorColor
        }
      },
      $unset: {
        authorId: '',
        authorName: '',
        authorAvatar: '',
        authorColor: '',
        authorSessionId: ''
      }
    };

    // Migrate responses
    if (post.responses && post.responses.length > 0) {
      const migratedResponses = post.responses.map(response => {
        // Look up responder account by ID, session, or name
        let responderAccount = null;
        if (response.responderId) {
          responderAccount = accountById.get(response.responderId.toString());
        } else if (response.user?.id) {
          responderAccount = accountById.get(response.user.id.toString());
        }
        if (!responderAccount && response.responderSessionId) {
          responderAccount = sessionToAccount.get(response.responderSessionId);
        }
        if (!responderAccount && (response.responderName || response.user?.name)) {
          const name = response.responderName || response.user?.name;
          responderAccount = accounts.find(a => a.userData?.username === name);
        }
        const responderColor = getColorFromAccount(responderAccount);

        return {
          _id: response._id,
          content: response.content,
          user: {
            id: responderAccount?._id || response.responderId || response.user?.id || null,
            name: responderAccount?.userData?.username || response.responderName || response.user?.name || 'Anonymous',
            avatar: responderAccount?.userData?.avatar || response.responderAvatar || response.user?.avatar || null,
            color: responderColor
          },
          createdAt: response.createdAt
        };
      });
      update.$set.responses = migratedResponses;
    }

    await db.collection('weepingwillowposts').updateOne({ _id: post._id }, update);
    console.log(`  Migrated post ${post._id} (color: ${authorColor})`);
  }

  // Migrate WishingWellPosts
  console.log('\n--- Migrating WishingWellPosts ---');
  const wishingWellPosts = await db.collection('wishingwellposts').find({}).toArray();
  console.log(`Found ${wishingWellPosts.length} posts`);

  for (const post of wishingWellPosts) {
    // Look up account by session ID or existing user.id
    const authorAccount = post.authorSessionId
      ? sessionToAccount.get(post.authorSessionId)
      : (post.user?.id ? accountById.get(post.user.id.toString()) : null);
    const authorColor = getColorFromAccount(authorAccount);

    const update = {
      $set: {
        user: {
          id: authorAccount?._id || post.user?.id || null,
          name: post.authorName || post.user?.name || 'Anonymous',
          avatar: post.authorAvatar || post.user?.avatar || null,
          color: authorColor
        }
      },
      $unset: {
        authorSessionId: '',
        authorName: '',
        authorAvatar: '',
        authorColor: ''
      }
    };

    // Migrate responses
    if (post.responses && post.responses.length > 0) {
      const migratedResponses = post.responses.map(response => {
        const responderAccount = response.responderSessionId
          ? sessionToAccount.get(response.responderSessionId)
          : (response.user?.id ? accountById.get(response.user.id.toString()) : null);
        const responderColor = getColorFromAccount(responderAccount);

        return {
          _id: response._id,
          content: response.content,
          user: {
            id: responderAccount?._id || response.user?.id || null,
            name: response.responderName || response.user?.name || 'Anonymous',
            avatar: response.responderAvatar || response.user?.avatar || null,
            color: responderColor
          },
          createdAt: response.createdAt
        };
      });
      update.$set.responses = migratedResponses;
    }

    // Migrate tips
    if (post.tips && post.tips.length > 0) {
      const migratedTips = post.tips.map(tip => {
        const tipperAccount = tip.tipperSessionId
          ? sessionToAccount.get(tip.tipperSessionId)
          : (tip.user?.id ? accountById.get(tip.user.id.toString()) : null);
        const tipperColor = getColorFromAccount(tipperAccount);

        return {
          _id: tip._id,
          amount: tip.amount,
          user: {
            id: tipperAccount?._id || tip.user?.id || null,
            name: tip.tipperName || tip.user?.name || 'Anonymous',
            avatar: tip.tipperAvatar || tip.user?.avatar || null,
            color: tipperColor
          },
          createdAt: tip.createdAt
        };
      });
      update.$set.tips = migratedTips;
    }

    await db.collection('wishingwellposts').updateOne({ _id: post._id }, update);
    console.log(`  Migrated post ${post._id} (color: ${authorColor})`);
  }

  console.log('\n--- Migration complete ---');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
