const ShopItem = require('../models/ShopItem');
const ModerationQueue = require('../models/ModerationQueue');
const ModerationAction = require('../models/ModerationAction');
const Account = require('../models/Account');
const { createNotification } = require('./notifications');
const { isModerator } = require('../middleware/permissions');

function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}

/**
 * Check if account has moderator or admin permission.
 * Uses centralized permissions (dev mode grants all).
 */
function isMod(account) {
  return isModerator(account);
}

module.exports = {
  name: 'moderation',

  handlers: {
    /**
     * List moderation queue items
     */
    'moderation:queue:list': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, contentType, itemType, status } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const query = {};
        if (contentType) query.contentType = contentType;
        if (itemType) query.itemType = itemType;
        query.status = status || 'pending';

        const items = await ModerationQueue.find(query)
          .sort({ priority: -1, createdAt: 1 })
          .limit(100)
          .lean();

        return { success: true, data: items };
      }
    },

    /**
     * Get single queue item with full content
     */
    'moderation:queue:get': {
      validate: (data) => {
        if (!data.sessionId || !data.queueId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, queueId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const queueItem = await ModerationQueue.findById(queueId).lean();
        if (!queueItem) {
          return { success: false, error: 'Queue item not found' };
        }

        // Look up the full ShopItem
        const shopItem = await ShopItem.findById(queueItem.contentId).lean();

        return {
          success: true,
          data: { queueItem, shopItem }
        };
      }
    },

    /**
     * Approve a revision
     */
    'moderation:revision:approve': {
      validate: (data) => {
        if (!data.sessionId || !data.queueId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, queueId, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const queueItem = await ModerationQueue.findById(queueId);
        if (!queueItem || queueItem.contentType !== 'bazaar-revision') {
          return { success: false, error: 'Queue item not found or wrong type' };
        }

        const modUser = buildUserObject(account);

        // Update the revision on ShopItem
        const item = await ShopItem.findById(queueItem.contentId);
        if (!item) {
          return { success: false, error: 'Shop item not found' };
        }

        const revision = item.revisions[queueItem.revisionIndex];
        if (!revision) {
          return { success: false, error: 'Revision not found' };
        }

        revision.status = 'approved';
        revision.reviewedBy = modUser;
        revision.reviewNote = note?.trim();
        revision.reviewedAt = new Date();
        item.currentApprovedRevisionIndex = queueItem.revisionIndex;
        item.shopStatus = 'in-shop';
        await item.save();

        // Update queue
        queueItem.status = 'approved';
        queueItem.reviewedBy = modUser;
        queueItem.reviewNote = note?.trim();
        await queueItem.save();

        // Log action
        await new ModerationAction({
          actor: modUser,
          actionType: 'approve-revision',
          contentType: 'bazaar-revision',
          contentId: item._id,
          revisionIndex: queueItem.revisionIndex,
          note: note?.trim()
        }).save();

        // Notify owner
        await createNotification(context.io, {
          recipientId: item.user.id,
          type: 'bazaar:revisionApproved',
          message: `Your submission "${item.title}" has been approved and is now in the shop!`,
          navigation: {
            flow: 'drawingBoard',
            dropId: 'drawingBoard:submissionDetail',
            params: { itemId: item._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: modUser.name,
            avatar: modUser.avatar
          }
        });

        context.io.emit('moderation:queueUpdated', { contentType: 'bazaar-revision' });
        context.io.emit('bazaar:submissionUpdated', {
          itemId: item._id,
          storeType: item.storeType
        });

        return { success: true, message: 'Revision approved.' };
      }
    },

    /**
     * Return a revision with note
     */
    'moderation:revision:return': {
      validate: (data) => {
        if (!data.sessionId || !data.queueId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, queueId, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const queueItem = await ModerationQueue.findById(queueId);
        if (!queueItem || queueItem.contentType !== 'bazaar-revision') {
          return { success: false, error: 'Queue item not found or wrong type' };
        }

        const modUser = buildUserObject(account);

        const item = await ShopItem.findById(queueItem.contentId);
        if (!item) {
          return { success: false, error: 'Shop item not found' };
        }

        const revision = item.revisions[queueItem.revisionIndex];
        if (!revision) {
          return { success: false, error: 'Revision not found' };
        }

        revision.status = 'returned';
        revision.reviewedBy = modUser;
        revision.reviewNote = note?.trim();
        revision.reviewedAt = new Date();
        await item.save();

        queueItem.status = 'returned';
        queueItem.reviewedBy = modUser;
        queueItem.reviewNote = note?.trim();
        await queueItem.save();

        await new ModerationAction({
          actor: modUser,
          actionType: 'return-revision',
          contentType: 'bazaar-revision',
          contentId: item._id,
          revisionIndex: queueItem.revisionIndex,
          note: note?.trim()
        }).save();

        await createNotification(context.io, {
          recipientId: item.user.id,
          type: 'bazaar:revisionReturned',
          message: `Your submission "${item.title}" has been returned for changes.`,
          navigation: {
            flow: 'drawingBoard',
            dropId: 'drawingBoard:submissionDetail',
            params: { itemId: item._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: modUser.name,
            avatar: modUser.avatar
          }
        });

        context.io.emit('moderation:queueUpdated', { contentType: 'bazaar-revision' });

        return { success: true, message: 'Revision returned.' };
      }
    },

    /**
     * Approve a comment
     */
    'moderation:comment:approve': {
      validate: (data) => {
        if (!data.sessionId || !data.queueId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, queueId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const queueItem = await ModerationQueue.findById(queueId);
        if (!queueItem || queueItem.contentType !== 'bazaar-comment') {
          return { success: false, error: 'Queue item not found or wrong type' };
        }

        const modUser = buildUserObject(account);

        const item = await ShopItem.findById(queueItem.contentId);
        if (!item) {
          return { success: false, error: 'Shop item not found' };
        }

        const comment = item.comments[queueItem.commentIndex];
        if (!comment) {
          return { success: false, error: 'Comment not found' };
        }

        comment.visible = true;
        await item.save();

        queueItem.status = 'approved';
        queueItem.reviewedBy = modUser;
        await queueItem.save();

        await new ModerationAction({
          actor: modUser,
          actionType: 'approve-comment',
          contentType: 'bazaar-comment',
          contentId: item._id
        }).save();

        // Notify item owner about new comment
        if (!item.user.id.equals(comment.user.id)) {
          await createNotification(context.io, {
            recipientId: item.user.id,
            type: 'bazaar:comment',
            message: `${comment.user.name} commented on "${item.title}"`,
            navigation: {
              flow: 'drawingBoard',
              dropId: 'drawingBoard:submissionDetail',
              params: { itemId: item._id.toString() }
            },
            actor: {
              accountId: comment.user.id,
              name: comment.user.name,
              avatar: comment.user.avatar
            }
          });
        }

        // Notify commenter that their comment was approved
        await createNotification(context.io, {
          recipientId: comment.user.id,
          type: 'bazaar:commentApproved',
          message: `Your comment on "${item.title}" is now visible`,
          navigation: { flow: 'mailbox', dropId: 'mailbox:list', params: {} },
          actor: {
            accountId: account._id,
            name: modUser.name,
            avatar: modUser.avatar
          }
        });

        context.io.emit('moderation:queueUpdated', { contentType: 'bazaar-comment' });
        context.io.emit('bazaar:submissionUpdated', {
          itemId: item._id,
          storeType: item.storeType
        });

        return { success: true, message: 'Comment approved.' };
      }
    },

    /**
     * Return (remove) a comment
     */
    'moderation:comment:return': {
      validate: (data) => {
        if (!data.sessionId || !data.queueId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, queueId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const queueItem = await ModerationQueue.findById(queueId);
        if (!queueItem || queueItem.contentType !== 'bazaar-comment') {
          return { success: false, error: 'Queue item not found or wrong type' };
        }

        const modUser = buildUserObject(account);

        const item = await ShopItem.findById(queueItem.contentId);
        let removedComment = null;
        if (item && item.comments[queueItem.commentIndex]) {
          removedComment = item.comments[queueItem.commentIndex];
          item.comments[queueItem.commentIndex].visible = false;
          item.comments[queueItem.commentIndex].removed = true;
          await item.save();
        }

        queueItem.status = 'returned';
        queueItem.reviewedBy = modUser;
        await queueItem.save();

        await new ModerationAction({
          actor: modUser,
          actionType: 'return-comment',
          contentType: 'bazaar-comment',
          contentId: queueItem.contentId
        }).save();

        // Notify commenter that their comment was removed
        if (removedComment) {
          const itemTitle = item?.title || queueItem.referenceTitle;
          await createNotification(context.io, {
            recipientId: removedComment.user.id,
            type: 'bazaar:commentRemoved',
            message: `Your comment on "${itemTitle}" was removed by a moderator`,
            navigation: { flow: 'mailbox', dropId: 'mailbox:list', params: {} },
            actor: {
              accountId: account._id,
              name: modUser.name,
              avatar: modUser.avatar
            }
          });
        }

        context.io.emit('moderation:queueUpdated', { contentType: 'bazaar-comment' });

        return { success: true, message: 'Comment removed.' };
      }
    },

    /**
     * Flag item for admin review
     */
    'moderation:item:flag': {
      validate: (data) => {
        if (!data.sessionId || !data.queueId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, queueId, reason } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const modUser = buildUserObject(account);

        const queueItem = await ModerationQueue.findById(queueId);
        if (!queueItem) {
          return { success: false, error: 'Queue item not found' };
        }

        queueItem.status = 'flagged-for-admin';
        queueItem.priority = 'escalated';
        queueItem.flaggedBy.push({
          user: modUser,
          reason: reason?.trim(),
          createdAt: new Date()
        });
        await queueItem.save();

        await new ModerationAction({
          actor: modUser,
          actionType: 'flag-for-admin',
          contentType: queueItem.contentType,
          contentId: queueItem.contentId,
          revisionIndex: queueItem.revisionIndex,
          note: reason?.trim()
        }).save();

        // Notify admins
        const adminAccounts = await Account.find({ permissions: 'admin' });
        for (const admin of adminAccounts) {
          await createNotification(context.io, {
            recipientId: admin._id,
            type: 'admin:newEscalation',
            message: `Item flagged by moderator: ${queueItem.referenceTitle}`,
            navigation: {
              flow: 'admin',
              dropId: 'admin:reviewItem',
              params: { queueId: queueItem._id.toString() }
            },
            actor: {
              accountId: account._id,
              name: modUser.name,
              avatar: modUser.avatar
            }
          });
        }

        context.io.emit('moderation:queueUpdated', { contentType: queueItem.contentType });
        context.io.emit('admin:queueUpdated', { reason: 'flagged' });

        return { success: true, message: 'Item flagged for admin review.' };
      }
    },

    /**
     * Request platform approval for an item
     */
    'moderation:item:requestPlatformApproval': {
      validate: (data) => {
        if (!data.sessionId || !data.itemId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const modUser = buildUserObject(account);

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        item.platformStatus = 'pending-platform-approval';
        await item.save();

        await new ModerationAction({
          actor: modUser,
          actionType: 'request-platform-approval',
          contentType: 'bazaar-revision',
          contentId: item._id
        }).save();

        // Notify admins
        const adminAccounts = await Account.find({ permissions: 'admin' });
        for (const admin of adminAccounts) {
          await createNotification(context.io, {
            recipientId: admin._id,
            type: 'admin:newEscalation',
            message: `Platform approval requested for: ${item.title}`,
            navigation: {
              flow: 'admin',
              dropId: 'admin:reviewItem',
              params: { itemId: item._id.toString() }
            },
            actor: {
              accountId: account._id,
              name: modUser.name,
              avatar: modUser.avatar
            }
          });
        }

        context.io.emit('admin:queueUpdated', { reason: 'platform-approval-request' });

        return { success: true, message: 'Platform approval requested.' };
      }
    },

    /**
     * List recent moderation actions
     */
    'moderation:actions:list': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({ 'activeSessions.sessionId': data.sessionId });
        if (!account || !isMod(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const actions = await ModerationAction.find()
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        return { success: true, data: actions };
      }
    }
  }
};
