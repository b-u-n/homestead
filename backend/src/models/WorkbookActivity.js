const mongoose = require('mongoose');

const workbookActivitySchema = new mongoose.Schema({
  activityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  workbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workbook',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  steps: [{
    stepId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'checkbox', 'slider', 'multiselect'],
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Compound index for efficient lookups
workbookActivitySchema.index({ workbookId: 1, activityId: 1 });

module.exports = mongoose.model('WorkbookActivity', workbookActivitySchema);
