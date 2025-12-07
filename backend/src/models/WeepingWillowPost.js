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

const responseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  user: {
    type: userSchema,
    required: true
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
  user: {
    type: userSchema,
    required: true
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
weepingWillowPostSchema.index({ 'user.id': 1 }); // Find posts by user

module.exports = mongoose.model('WeepingWillowPost', weepingWillowPostSchema);
