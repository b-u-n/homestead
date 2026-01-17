const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who receives the notification
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },

  // Notification type (for filtering and display logic)
  type: {
    type: String,
    required: true,
    enum: [
      'weepingWillow:response',  // Someone responded to your post
      'weepingWillow:bounty',    // You earned a bounty
      'wishingWell:tip',         // Someone tipped your post
      'reportIssue:statusChanged', // Issue report status changed
      'reportIssue:comment',     // New comment on issue report
      'system'                   // System notification
    ],
    index: true
  },

  // Human-readable message
  message: {
    type: String,
    required: true,
    maxlength: 200
  },

  // Navigation data - where to go when clicked
  // e.g., { flow: 'weepingWillow', dropId: 'weepingWillow:viewPost', params: { postId: '...' } }
  navigation: {
    flow: String,           // Flow name to open
    dropId: String,         // Specific drop to navigate to
    params: {               // Parameters to pass to the drop
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },

  // Actor info (who triggered the notification)
  actor: {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    name: String,
    avatar: String
  },

  // Read state
  read: {
    type: Boolean,
    default: false,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

// Note: Notifications are never deleted - they serve as permanent history

module.exports = mongoose.model('Notification', notificationSchema);
