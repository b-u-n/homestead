#!/usr/bin/env node
/**
 * One-shot: deletes every WorkbookProgress row belonging to the shared
 * activities-demo account (session id `demo-activities-page-session`).
 * Used to reset the demo page's history list. Idempotent.
 */
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Account = require('../src/models/Account');
const WorkbookProgress = require('../src/models/WorkbookProgress');

const DEMO_SESSION_ID = 'demo-activities-page-session';

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set — aborting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

    const account = await Account.findOne({ 'activeSessions.sessionId': DEMO_SESSION_ID });
    if (!account) {
      console.log('No demo account found — nothing to clear.');
      return;
    }
    console.log(`Demo account: ${account._id}`);

    const result = await WorkbookProgress.deleteMany({ accountId: account._id });
    console.log(`Deleted ${result.deletedCount} WorkbookProgress row(s).`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
