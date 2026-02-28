const mongoose = require('mongoose');

const workbookSchema = new mongoose.Schema({
  bookshelfId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  tagFilters: {
    conditions: [String],
    themes: [String]
  },
  activities: [{
    activityId: {
      type: String,
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Workbook', workbookSchema);
