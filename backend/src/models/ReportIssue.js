const mongoose = require('mongoose');

const reportIssueSchema = new mongoose.Schema({
  // User's description of the issue
  text: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // System metadata collected with user consent
  metadata: {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    sessionId: {
      type: String
    },
    username: {
      type: String
    },
    email: {
      type: String
    },
    userAgent: {
      type: String
    },
    platform: {
      type: String,
      enum: ['web', 'ios', 'android']
    },
    screenSize: {
      type: String
    },
    currentRoute: {
      type: String
    },
    appVersion: {
      type: String
    },
    consentGiven: {
      type: Boolean,
      default: false
    }
  },

  // Request status
  status: {
    type: String,
    enum: ['reported', 'under_investigation', 'assigned', 'resolved'],
    default: 'reported'
  },

  // Staff member handling the request
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },

  // Comments - visible conversation between user and staff
  comments: [{
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    authorType: {
      type: String,
      enum: ['user', 'staff'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Internal staff notes - hidden from user
  internalNotes: [{
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

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
reportIssueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ReportIssue', reportIssueSchema);
