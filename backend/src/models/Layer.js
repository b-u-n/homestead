const mongoose = require('mongoose');

const layerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // Display order (lower = higher priority in list)
  order: {
    type: Number,
    default: 0
  },
  // Whether this layer is the default for new users
  isDefault: {
    type: Boolean,
    default: false
  },
  // Whether this layer is active and joinable
  isActive: {
    type: Boolean,
    default: true
  },
  // Maximum players allowed (0 = unlimited)
  maxPlayers: {
    type: Number,
    default: 0
  },
  // Creator of the layer
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
layerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure only one default layer exists
layerSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Layer', layerSchema);
