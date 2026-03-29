const mongoose = require('mongoose');

const boardStateSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PixelBoard',
    required: true
  },
  pixelsRemaining: {
    type: Number,
    default: 0
  },
  lastDrawTime: {
    type: Date,
    default: null
  },
  // Daily Drop: when budget was last refreshed
  lastBudgetRefresh: {
    type: Date,
    default: null
  },
  // Chain: when this player joined the chain
  joinedChainAt: {
    type: Date,
    default: null
  },
  // Pixel positions claimed this credit cycle (cleared on budget reset)
  // Stored as "x,y" strings for easy lookup
  touchedPixels: {
    type: [String],
    default: []
  }
}, { _id: false });

const pixelPalsPlayerSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true
  },
  // Per-board state tracking (replaces flat fields)
  boardStates: [boardStateSchema],
  // Personal saved color palette
  savedColors: {
    type: [String],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pixelPalsPlayerSchema.index({ accountId: 1 });

// Helper to get or create board state for a specific board
pixelPalsPlayerSchema.methods.getBoardState = function(boardId) {
  const boardIdStr = boardId.toString();
  let state = this.boardStates.find(s => s.boardId.toString() === boardIdStr);
  if (!state) {
    this.boardStates.push({ boardId, pixelsRemaining: 0 });
    state = this.boardStates[this.boardStates.length - 1];
  }
  return state;
};

pixelPalsPlayerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PixelPalsPlayer', pixelPalsPlayerSchema);
