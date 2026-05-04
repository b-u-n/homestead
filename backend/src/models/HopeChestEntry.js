const mongoose = require('mongoose');

const hopeChestEntrySchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  sourcePrototypeId: {
    type: String,
    default: null
  },
  sourceFieldRef: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

hopeChestEntrySchema.index({ accountId: 1, createdAt: -1 });

module.exports = mongoose.model('HopeChestEntry', hopeChestEntrySchema);
