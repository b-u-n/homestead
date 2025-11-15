const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'room_create',
      'room_update',
      'room_delete',
      'room_lock',
      'room_unlock',
      'user_join_room',
      'user_leave_room',
      'permission_grant',
      'permission_revoke',
      'item_create',
      'item_update',
      'item_delete',
      'moderation_action'
    ]
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    enum: ['Room', 'User']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

actionSchema.index({ actor: 1, createdAt: -1 });
actionSchema.index({ target: 1, createdAt: -1 });
actionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Action', actionSchema);