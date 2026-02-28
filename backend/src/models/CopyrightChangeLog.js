const mongoose = require('mongoose');

const copyrightChangeLogSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  previous: { type: Object },
  updated: { type: Object },
  source: { type: String, enum: ['settings', 'submission'], default: 'settings' },
  createdAt: { type: Date, default: Date.now }
});

copyrightChangeLogSchema.index({ accountId: 1, createdAt: -1 });

module.exports = mongoose.model('CopyrightChangeLog', copyrightChangeLogSchema);
