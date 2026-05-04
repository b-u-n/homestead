const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true
  },
  currentPersonaId: {
    type: String,
    default: 'neutral'
  },
  availablePersonaIds: {
    type: [String],
    default: ['warm', 'neutral', 'brisk', 'playful', 'clinical']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Persona', personaSchema);
