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

const moderationActionSchema = new mongoose.Schema({
  actor: {
    type: userSchema,
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'approve-revision',
      'return-revision',
      'flag-for-admin',
      'approve-comment',
      'return-comment',
      'request-platform-approval',
      'approve-for-platform',
      'return-for-platform'
    ]
  },
  contentType: {
    type: String,
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
    required: true
  },
  revisionIndex: {
    type: Number
  },
  note: {
    type: String,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
moderationActionSchema.index({ createdAt: -1 });
moderationActionSchema.index({ 'actor.id': 1 });

module.exports = mongoose.model('ModerationAction', moderationActionSchema);
