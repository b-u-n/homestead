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
    required: true,
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

// Compound indexes for efficient queries
workbookProgressSchema.index({ accountId: 1, workbookId: 1 });
workbookProgressSchema.index({ accountId: 1, activityId: 1 });
workbookProgressSchema.index({ accountId: 1, workbookId: 1, activityId: 1 }, { unique: true });

module.exports = mongoose.model('WorkbookProgress', workbookProgressSchema);
