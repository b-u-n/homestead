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

  // Permissions
  permissions: [{
    type: String,
    enum: ['admin', 'moderator', 'creator']
  }],

  // Current layer
  currentLayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Layer',
    default: null
  },

  // Sound settings overrides (only stores user-modified values)
  // Keys are sound names, values are objects with overridden properties
  // e.g. { "campfire": { "volume": 0.5, "enabled": false }, "emote": { "volume": 0.8 } }
  soundSettings: {
    type: Map,
    of: {
      volume: { type: Number, min: 0, max: 1 },
      enabled: { type: Boolean },
    },
    default: new Map()
  },

  // Active notifications (max 10, overflow goes to Notification collection as history)
  activeNotifications: [{
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true
    },
    type: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 200
    },
    navigation: {
      flow: String,
      dropId: String,
      params: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
      }
    },
    actor: {
      accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
      },
      name: String,
      avatar: String
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

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