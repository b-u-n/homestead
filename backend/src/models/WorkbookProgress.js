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
  // The step the user was last on. Persisted on every navigation so resume
  // returns to the exact step (not just the first-incomplete one).
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
