const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  artifactDomain: {
    type: String,
    required: true,
    index: true
  },
  artifactSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  sourceActivityId: {
    type: String,
    default: null,
    index: true
  },
  savedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  referentDate: {
    type: Date,
    default: null
  },
  moodRating: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  titleOrTheme: {
    type: String,
    default: null
  },
  summaryFields: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

historyEntrySchema.index({ accountId: 1, savedAt: -1 });
historyEntrySchema.index({ accountId: 1, sourceActivityId: 1, savedAt: -1 });

module.exports = mongoose.model('HistoryEntry', historyEntrySchema);
