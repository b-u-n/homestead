const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lastScreen: {
    type: String,
    default: 'Landing'
  },
  
  // Google account linking (optional)
  googleId: {
    type: String,
    sparse: true // Allow null values but maintain uniqueness when present
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