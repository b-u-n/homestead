const mongoose = require('mongoose');

const workbookProgressSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  workbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workbook',
    index: true
  },
  activityId: {
    type: String,
    required: true
  },
  completedSteps: [{
    type: String
  }],
  stepData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  // High-water mark — the furthest step the user has reached. Monotonic:
  // advances only on forward navigation, never decreases on back. Resume
  // returns the user to this step, not to a transient "last viewed" index.
  // Backward navigation is a client-only view operation that does not write.
  currentStepIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  // Optional user-given name so they can find the session later
  // ("grief letter — Aug 12", "first DIBs pass"). When null, the resume
  // picker falls back to the session's createdAt as the displayed label.
  sessionName: {
    type: String,
    default: null,
    trim: true,
    maxlength: 80
  }
}, {
  timestamps: true
});

// Each document is one INSTANCE of an activity attempt — a user can have many
// in-progress instances and many completed instances of the same activity.
workbookProgressSchema.index({ accountId: 1, workbookId: 1 });
workbookProgressSchema.index({ accountId: 1, activityId: 1, lastAccessedAt: -1 });
workbookProgressSchema.index({ accountId: 1, status: 1, lastAccessedAt: -1 });

module.exports = mongoose.model('WorkbookProgress', workbookProgressSchema);
