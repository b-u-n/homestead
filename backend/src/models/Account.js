const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  activeSessions: [{
    sessionId: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastScreen: {
    type: String,
    default: 'Landing'
  },
  
  // OAuth account linking (optional)
  googleId: {
    type: String,
    sparse: true // Allow null values but maintain uniqueness when present
  },
  discordId: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    sparse: true
  },
  name: {
    type: String
  },
  googleData: {
    type: Object // Store full Google user data
  },
  discordData: {
    type: Object // Store full Discord user data
  },
  authToken: {
    type: String
  },
  linkedAt: {
    type: Date
  },
  
  // Progress tracking
  completedScreens: [{
    type: String
  }],
  userData: {
    username: String,
    avatar: String,
    avatarData: Object
  },

  // Hearts system
  hearts: {
    type: Number,
    default: 9, // Start with 9 hearts
    min: 0,
    max: 9 // Maximum active hearts
  },
  heartBank: {
    type: Number,
    default: 0, // Unlimited storage
    min: 0
  },
  lastBankWithdrawal: {
    type: Date,
    default: null
  },
  dailyWithdrawalsRemaining: {
    type: Number,
    default: 1, // Can withdraw once per day by default
    min: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
accountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Account', accountSchema);