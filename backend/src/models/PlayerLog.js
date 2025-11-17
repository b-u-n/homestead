const mongoose = require('mongoose');

const playerLogSchema = new mongoose.Schema({
  // Socket ID of the player
  socketId: {
    type: String,
    required: true,
    index: true
  },

  // Action type (e.g., 'map:move', 'auth:login', 'room:join')
  action: {
    type: String,
    required: true,
    index: true
  },

  // Action data (flexible object to store any action-specific data)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Username (if available)
  username: {
    type: String,
    default: null,
    index: true
  },

  // User ID (if available)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },

  // Room ID (if action is room-specific)
  roomId: {
    type: String,
    default: null,
    index: true
  },

  // Timestamp of the action
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound indexes for common queries
playerLogSchema.index({ username: 1, timestamp: -1 });
playerLogSchema.index({ action: 1, timestamp: -1 });
playerLogSchema.index({ roomId: 1, timestamp: -1 });
playerLogSchema.index({ timestamp: -1 }); // For recent logs

// TTL index - automatically delete logs older than 30 days (optional)
// Uncomment if you want automatic log cleanup
// playerLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('PlayerLog', playerLogSchema);
