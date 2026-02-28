const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  color: {
    type: String
  }
}, { _id: false });

const flagSchema = new mongoose.Schema({
  user: {
    type: userSchema,
    required: true
  },
  reason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const moderationQueueSchema = new mongoose.Schema({
  contentType: {
    type: String,
    required: true,
    enum: ['bazaar-revision', 'bazaar-comment']
  },
  itemType: {
    type: String // The storeType of the parent item — e.g. 'map-sprite', 'emoji'
    // Enables future per-stall moderator permissions
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
    required: true
  },
  revisionIndex: {
    type: Number // For bazaar-revision, which revision to review
  },
  commentIndex: {
    type: Number // For bazaar-comment, which comment to review
  },
  referenceTitle: {
    type: String // Quick display without lookup
  },
  submittedBy: {
    type: userSchema,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'returned', 'flagged-for-admin', 'superseded'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['normal', 'escalated'],
    default: 'normal'
  },
  reviewedBy: userSchema,
  reviewNote: {
    type: String,
    maxlength: 1000
  },
  flaggedBy: [flagSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
moderationQueueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
moderationQueueSchema.index({ status: 1, contentType: 1, createdAt: 1 });
moderationQueueSchema.index({ priority: 1, status: 1 });
moderationQueueSchema.index({ contentId: 1 });
moderationQueueSchema.index({ itemType: 1, status: 1 });

module.exports = mongoose.model('ModerationQueue', moderationQueueSchema);
