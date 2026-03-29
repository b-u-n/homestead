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
  avatar: String,
  color: String
}, { _id: false });

const contributionSchema = new mongoose.Schema({
  user: {
    type: userSchema,
    required: true
  },
  pixels: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    color: { type: String }
  }],
  creditsCost: {
    type: Number,
    default: 0
  },
  newPositions: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const contributorStatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  totalPixels: {
    type: Number,
    default: 0
  },
  lastContributedAt: {
    type: Date,
    default: Date.now
  },
  contributionCount: {
    type: Number,
    default: 0
  },
  nextCreditAt: {
    type: Date,
    default: null
  },
  creditNotified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const pixelBoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 60
  },
  width: {
    type: Number,
    default: 32,
    min: 8,
    max: 64
  },
  height: {
    type: Number,
    default: 32,
    min: 8,
    max: 64
  },
  // Flat pixel array: length = width * height
  // Each entry is a hex color string or null (transparent)
  pixels: [{
    type: String,
    default: null
  }],
  boardType: {
    type: String,
    enum: ['shared', 'personal'],
    default: 'shared'
  },
  pixelsPerTurn: {
    type: Number,
    min: 1,
    default: 8
  },
  // Game mode determines draw rules
  gameMode: {
    type: String,
    enum: ['chain', 'daily-drop', 'live-canvas', 'free'],
    default: 'daily-drop'
  },
  // Daily Drop: how often budget refreshes
  dropInterval: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'daily'
  },
  // Live Canvas: cooldown between draws in seconds
  liveCooldownSeconds: {
    type: Number,
    default: 180,
    min: 30,
    max: 600
  },
  // Chain Mode: ordered list of players
  chainOrder: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    name: String
  }],
  currentChainIndex: {
    type: Number,
    default: 0
  },
  creator: {
    type: userSchema,
    required: true
  },
  contributions: [contributionSchema],
  contributorStats: [contributorStatSchema],
  // Generated PNG URL (set on board complete)
  imageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pixelBoardSchema.index({ status: 1, createdAt: -1 });
pixelBoardSchema.index({ 'creator.id': 1 });
pixelBoardSchema.index({ status: 1, 'contributorStats.nextCreditAt': 1, 'contributorStats.creditNotified': 1 });

pixelBoardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PixelBoard', pixelBoardSchema);
