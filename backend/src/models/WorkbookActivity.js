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
    index: true
  },
  title: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    default: null
  },
  tags: {
    conditions: [String],
    themes: [String],
    experience_level: String,
    difficulty: String
  },
  steps: [{
    stepId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'text', 'checkbox', 'slider', 'multiselect',
        'psychoeducation', 'rating', 'likert', 'guided-exercise',
        'prompt-sequence', 'journal', 'checklist-assessment',
        'sortable-list', 'action-plan', 'likert-reflection'
      ],
      required: true
    },
    prompt: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Extended step fields for new step types
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    min: Number,
    max: Number,
    labels: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    items: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    scale: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    instructions: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    repeats: Number,
    mode: String,
    prompts: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    timerMinutes: Number,
    minWords: Number,
    placeholder: String,
    showWordCount: Boolean,
    showReread: Boolean,
    scoring: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ratingLabel: String,
    ratingMin: Number,
    ratingMax: Number,
    minItems: Number,
    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    sourceStepId: String,
    reflections: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Index for tag-based queries
workbookActivitySchema.index({ 'tags.conditions': 1 });
workbookActivitySchema.index({ 'tags.themes': 1 });

// Compound index for efficient lookups
workbookActivitySchema.index({ workbookId: 1, activityId: 1 });

module.exports = mongoose.model('WorkbookActivity', workbookActivitySchema);
