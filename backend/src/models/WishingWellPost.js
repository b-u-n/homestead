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
    maxlength: 5000
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

const tipSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1
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

const wishingWellPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  user: {
    type: userSchema,
    required: true
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
wishingWellPostSchema.index({ 'user.id': 1 }); // Find posts by user

module.exports = mongoose.model('WishingWellPost', wishingWellPostSchema);
