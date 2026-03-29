const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  color: {
    type: String
  }
}, { _id: false });

const revisionSchema = new mongoose.Schema({
  contentUrl: {
    type: String // For image/video — GCS URL
  },
  textContent: {
    type: String // For text/prompt media types
  },
  note: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'returned', 'superseded'],
    default: 'pending'
  },
  reviewedBy: userSchema,
  reviewNote: {
    type: String,
    maxlength: 1000
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  user: {
    type: userSchema,
    required: true
  },
  visible: {
    type: Boolean,
    default: false // Comments require mod approval before being visible
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const purchaseSchema = new mongoose.Schema({
  user: {
    type: userSchema,
    required: true
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const shopItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 2000
  },
  storeType: {
    type: String,
    required: true,
    enum: ['map-sprite', 'toy', 'emoji', 'decoration', 'avvie', 'spell', 'sketch']
  },
  subtype: {
    type: String // e.g. 'plushie' for toys
  },
  mediaType: {
    type: String,
    required: true,
    enum: ['image', 'text', 'video', 'prompt'],
    default: 'image'
  },
  tags: [{
    type: String
  }],
  platformAssetId: {
    type: String,
    default: null
  },
  intendedPlatformUse: {
    type: String,
    enum: ['texture', 'icon', 'illustration', 'ui-element', 'background', 'other', null],
    default: null
  },
  copyright: {
    ipConfirmed: { type: Boolean, default: false },
    authorizeAdvertising: { type: Boolean, default: false },
    attribution: {
      type: String,
      enum: ['real-name', 'username', 'none'],
      default: 'username'
    },
    realName: { type: String, maxlength: 200 },
    contactInfo: { type: String, maxlength: 500 },
    attributionLink: { type: String, maxlength: 500 },
    confirmedFromIp: { type: String },
    confirmedAt: { type: Date },
  },
  submittedFromIp: { type: String },
  user: {
    type: userSchema,
    required: true
  },

  revisions: [revisionSchema],
  currentApprovedRevisionIndex: {
    type: Number,
    default: null
  },

  shopStatus: {
    type: String,
    enum: ['not-listed', 'in-shop'],
    default: 'not-listed'
  },
  platformStatus: {
    type: String,
    enum: ['none', 'pending-platform-approval', 'approved-for-platform'],
    default: 'none'
  },
  platformApprovedBy: userSchema,

  purchaseCount: {
    type: Number,
    default: 0
  },
  purchasedBy: [purchaseSchema],
  comments: [commentSchema],

  // Visibility: public (normal) or private (personal gallery, owner-only)
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },

  // Source game board (for completed Pixel Pals boards)
  sourceBoard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PixelBoard',
    default: null
  },

  // Participants who contributed (get discount on purchase)
  participantIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
shopItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
shopItemSchema.index({ storeType: 1, shopStatus: 1, createdAt: -1 });
shopItemSchema.index({ 'user.id': 1 });
shopItemSchema.index({ tags: 1 });
shopItemSchema.index({ platformAssetId: 1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);
