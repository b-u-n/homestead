const mongoose = require('mongoose');

/**
 * WorkbookActivity — therapeutic activity composed of one or more steps.
 *
 * v2 step schema (preferred) — composition of canonical primitives:
 *   {
 *     stepId, title?, layout?, collect?,
 *     components: [{ ref, props, bind? }]
 *   }
 *
 * v1 step schema (legacy, still supported) — single typed step:
 *   {
 *     stepId, type, prompt, options/items/scale/...
 *   }
 *
 * The frontend WorkbookActivity drop dispatches on `step.components` first;
 * if absent, it falls back to the v1 type-switch renderer. Existing activities
 * (anxiety-workbook seed) keep working unchanged.
 */
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

    // ── v2 composition fields ────────────────────────────────────────────
    title: { type: String, default: null },
    layout: { type: String, default: 'vertical' }, // 'vertical' | 'split-2' | 'grid-2x2' | 'overlay'
    components: { type: mongoose.Schema.Types.Mixed, default: null },
    collect: { type: String, default: 'merge' },   // 'merge' | 'first' | 'array'

    // ── v1 legacy fields (kept for backwards compat with existing seeds) ──
    type: {
      type: String,
      enum: [
        'text', 'checkbox', 'slider', 'multiselect',
        'psychoeducation', 'rating', 'likert', 'guided-exercise',
        'prompt-sequence', 'journal', 'checklist-assessment',
        'sortable-list', 'action-plan', 'likert-reflection',
        'assessment-results'
      ],
      default: undefined
    },
    prompt: { type: mongoose.Schema.Types.Mixed, default: null },
    options: { type: mongoose.Schema.Types.Mixed, default: null },
    content: { type: mongoose.Schema.Types.Mixed, default: null },
    min: Number,
    max: Number,
    labels: { type: mongoose.Schema.Types.Mixed, default: null },
    items: { type: mongoose.Schema.Types.Mixed, default: null },
    scale: { type: mongoose.Schema.Types.Mixed, default: null },
    instructions: { type: mongoose.Schema.Types.Mixed, default: null },
    repeats: Number,
    mode: String,
    prompts: { type: mongoose.Schema.Types.Mixed, default: null },
    timerMinutes: Number,
    minWords: Number,
    placeholder: String,
    showWordCount: Boolean,
    showReread: Boolean,
    scoring: { type: mongoose.Schema.Types.Mixed, default: null },
    ratingLabel: String,
    ratingMin: Number,
    ratingMax: Number,
    minItems: Number,
    sections: { type: mongoose.Schema.Types.Mixed, default: null },
    sourceStepId: String,
    reflections: { type: mongoose.Schema.Types.Mixed, default: null }
  }]
}, {
  timestamps: true
});

workbookActivitySchema.index({ 'tags.conditions': 1 });
workbookActivitySchema.index({ 'tags.themes': 1 });
workbookActivitySchema.index({ workbookId: 1, activityId: 1 });

module.exports = mongoose.model('WorkbookActivity', workbookActivitySchema);
