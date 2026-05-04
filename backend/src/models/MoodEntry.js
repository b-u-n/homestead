const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  moodValue: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  sourceActivityId: {
    type: String,
    default: null
  },
  sourceSaveEvent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

moodEntrySchema.index({ accountId: 1, createdAt: -1 });

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
