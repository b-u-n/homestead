const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  responderSessionId: {
    type: String,
    required: true
  },
  responderName: {
    type: String,
    required: true
  },
  responderAvatar: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const tipSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  tipperSessionId: {
    type: String,
    required: true
  },
  tipperName: {
    type: String,
    required: true
  },
  tipperAvatar: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const wishingWellPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  authorSessionId: {
    type: String,
    required: true,
    index: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String
  },
  responses: [responseSchema],
  tips: [tipSchema],
  totalTips: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying
wishingWellPostSchema.index({ createdAt: -1 }); // Sort by newest
wishingWellPostSchema.index({ totalTips: -1 }); // Sort by value
wishingWellPostSchema.index({ 'responses.0': 1 }); // Filter by has responses

module.exports = mongoose.model('WishingWellPost', wishingWellPostSchema);
