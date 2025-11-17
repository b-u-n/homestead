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
  firstResponderSessionId: {
    type: String,
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
