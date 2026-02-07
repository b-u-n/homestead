/**
 * Migration: Strip hardcoded domains from avatar URLs
 *
 * Converts absolute avatar URLs like:
 *   http://192.168.0.198:9000/api/avatars/filename.png
 *   https://homestead.heartsbox.com/api/avatars/filename.png
 * To relative paths:
 *   /api/avatars/filename.png
 *
 * Affects: accounts, wishingwellposts, weepingwillowposts
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homestead';

function stripDomain(url) {
  if (!url) return url;
  const idx = url.indexOf('/api/avatars/');
  if (idx !== -1) return url.slice(idx);
  return url;
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  // --- Accounts ---
  console.log('\n--- Migrating account avatar URLs ---');
  const accounts = await db.collection('accounts').find({
    'userData.avatar': { $regex: '://.*?/api/avatars/' }
  }).toArray();
  console.log(`Found ${accounts.length} accounts with absolute avatar URLs`);

  for (const account of accounts) {
    const oldUrl = account.userData.avatar;
    const newUrl = stripDomain(oldUrl);
    const update = { $set: { 'userData.avatar': newUrl } };

    // Also fix notification actor avatars
    if (account.activeNotifications?.length > 0) {
      const fixedNotifications = account.activeNotifications.map(n => {
        if (n.actor?.avatar) {
          n.actor.avatar = stripDomain(n.actor.avatar);
        }
        return n;
      });
      update.$set.activeNotifications = fixedNotifications;
    }

    await db.collection('accounts').updateOne({ _id: account._id }, update);
    console.log(`  ${account.userData.username}: ${oldUrl} -> ${newUrl}`);
  }

  // Also fix notifications on accounts that weren't caught above
  console.log('\n--- Migrating notification actor avatars ---');
  const accountsWithNotifs = await db.collection('accounts').find({
    'activeNotifications.actor.avatar': { $regex: '://.*?/api/avatars/' }
  }).toArray();
  console.log(`Found ${accountsWithNotifs.length} accounts with absolute notification avatar URLs`);

  for (const account of accountsWithNotifs) {
    const fixedNotifications = account.activeNotifications.map(n => {
      if (n.actor?.avatar) {
        n.actor.avatar = stripDomain(n.actor.avatar);
      }
      return n;
    });
    await db.collection('accounts').updateOne(
      { _id: account._id },
      { $set: { activeNotifications: fixedNotifications } }
    );
    console.log(`  Fixed notifications for ${account.userData?.username || account._id}`);
  }

  // --- WishingWellPosts ---
  console.log('\n--- Migrating WishingWellPost avatars ---');
  const wishPosts = await db.collection('wishingwellposts').find({}).toArray();
  let wishCount = 0;
  for (const post of wishPosts) {
    let changed = false;
    const update = {};

    if (post.user?.avatar && post.user.avatar.includes('://')) {
      update['user.avatar'] = stripDomain(post.user.avatar);
      changed = true;
    }

    if (post.responses?.length > 0) {
      const fixedResponses = post.responses.map(r => {
        if (r.user?.avatar && r.user.avatar.includes('://')) {
          r.user.avatar = stripDomain(r.user.avatar);
          changed = true;
        }
        return r;
      });
      if (changed) update.responses = fixedResponses;
    }

    if (post.tips?.length > 0) {
      const fixedTips = post.tips.map(t => {
        if (t.user?.avatar && t.user.avatar.includes('://')) {
          t.user.avatar = stripDomain(t.user.avatar);
          changed = true;
        }
        return t;
      });
      if (changed || Object.keys(update).length > 0) update.tips = fixedTips;
    }

    if (changed) {
      await db.collection('wishingwellposts').updateOne({ _id: post._id }, { $set: update });
      wishCount++;
    }
  }
  console.log(`Fixed ${wishCount}/${wishPosts.length} wishing well posts`);

  // --- WeepingWillowPosts ---
  console.log('\n--- Migrating WeepingWillowPost avatars ---');
  const weepPosts = await db.collection('weepingwillowposts').find({}).toArray();
  let weepCount = 0;
  for (const post of weepPosts) {
    let changed = false;
    const update = {};

    if (post.user?.avatar && post.user.avatar.includes('://')) {
      update['user.avatar'] = stripDomain(post.user.avatar);
      changed = true;
    }

    if (post.responses?.length > 0) {
      const fixedResponses = post.responses.map(r => {
        if (r.user?.avatar && r.user.avatar.includes('://')) {
          r.user.avatar = stripDomain(r.user.avatar);
          changed = true;
        }
        return r;
      });
      if (changed) update.responses = fixedResponses;
    }

    if (changed) {
      await db.collection('weepingwillowposts').updateOne({ _id: post._id }, { $set: update });
      weepCount++;
    }
  }
  console.log(`Fixed ${weepCount}/${weepPosts.length} weeping willow posts`);

  console.log('\n--- Migration complete ---');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
