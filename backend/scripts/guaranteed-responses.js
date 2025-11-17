#!/usr/bin/env node

/**
 * Guaranteed Responses Cron Job
 *
 * Runs hourly to check for posts with expired guaranteedResponseTime
 * and resets them to null so they can receive a guaranteed response again
 *
 * Setup in crontab:
 * 0 * * * * /path/to/node /path/to/guaranteed-responses.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const WishingWellPost = require('../src/models/WishingWellPost');

async function processGuaranteedResponses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homestead', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`[${new Date().toISOString()}] Connected to MongoDB`);

    const now = new Date();

    // Find posts where guaranteedResponseTime has passed
    const expiredPosts = await WishingWellPost.find({
      guaranteedResponseTime: { $lte: now, $ne: null }
    });

    console.log(`Found ${expiredPosts.length} posts with expired guaranteed response times`);

    // Reset guaranteedResponseTime to null for these posts
    const result = await WishingWellPost.updateMany(
      { guaranteedResponseTime: { $lte: now, $ne: null } },
      { $set: { guaranteedResponseTime: null } }
    );

    console.log(`Updated ${result.modifiedCount} posts`);

    // Log details for each expired post
    expiredPosts.forEach(post => {
      console.log(`  - Post ${post._id}: expired at ${post.guaranteedResponseTime}, resetting`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log(`[${new Date().toISOString()}] Job complete, disconnected from MongoDB`);

    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing guaranteed responses:`, error);
    process.exit(1);
  }
}

// Run the job
processGuaranteedResponses();
