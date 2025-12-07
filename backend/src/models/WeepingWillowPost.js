const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  responderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
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

const weepingWillowPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  hearts: {
    type: Number,
    required: true,
    min: 1
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
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
  firstResponderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying
weepingWillowPostSchema.index({ createdAt: -1 }); // Sort by newest
weepingWillowPostSchema.index({ hearts: -1 }); // Sort by value
weepingWillowPostSchema.index({ 'responses.0': 1 }); // Filter by has responses

module.exports = mongoose.model('WeepingWillowPost', weepingWillowPostSchema);
