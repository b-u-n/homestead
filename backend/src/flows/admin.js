const ShopItem = require('../models/ShopItem');
const ModerationQueue = require('../models/ModerationQueue');
const ModerationAction = require('../models/ModerationAction');
const Account = require('../models/Account');
const { createNotification } = require('./notifications');
const { isAdmin: isAdminCheck } = require('../middleware/permissions');

function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}

function isAdmin(account) {
  return isAdminCheck(account);
}

module.exports = {
  name: 'admin',

  handlers: {
    /**
     * List admin queue items by category
     */
    'admin:queue:list': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, category } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        let results = {};

        if (!category || category === 'new') {
          // New pending submissions
          results.newSubmissions = await ModerationQueue.find({
            contentType: 'bazaar-revision',
            status: 'pending'
          }).sort({ createdAt: 1 }).limit(50).lean();
        }

        if (!category || category === 'flagged') {
          // Flagged by mods
          results.flagged = await ModerationQueue.find({
            status: 'flagged-for-admin'
          }).sort({ createdAt: 1 }).limit(50).lean();
        }

        if (!category || category === 'escalated') {
          // Revisions to platform-approved items (no mod queue entry — find directly)
          const platformApprovedItems = await ShopItem.find({
            platformStatus: 'approved-for-platform',
            'revisions.status': 'pending'
          }).lean();

          results.escalated = platformApprovedItems.map(item => {
            const pendingRevisions = item.revisions
              .map((rev, idx) => ({ ...rev, revisionIndex: idx }))
              .filter(rev => rev.status === 'pending');
            return {
              item,
              pendingRevisions
            };
          }).filter(entry => entry.pendingRevisions.length > 0);
        }

        if (!category || category === 'platform') {
          // Pending platform approval (requested by mods)
          results.platformApproval = await ShopItem.find({
            platformStatus: 'pending-platform-approval'
          }).sort({ updatedAt: -1 }).limit(50).lean();
        }

        if (!category || category === 'actions') {
          results.recentActions = await ModerationAction.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        }

        return { success: true, data: results };
      }
    },

    /**
     * Full audit log with filters
     */
    'admin:actions:list': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, actionType, actorId, limit: queryLimit } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const query = {};
        if (actionType) query.actionType = actionType;
        if (actorId) query['actor.id'] = actorId;

        const actions = await ModerationAction.find(query)
          .sort({ createdAt: -1 })
          .limit(queryLimit || 100)
          .lean();

        return { success: true, data: actions };
      }
    },

    /**
     * Approve item for platform use
     */
    'admin:submission:approveForPlatform': {
      validate: (data) => {
        if (!data.sessionId || !data.itemId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const adminUser = buildUserObject(account);

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        item.platformStatus = 'approved-for-platform';
        item.platformApprovedBy = adminUser;
        item.shopStatus = 'in-shop';

        // Approve the latest revision (acts as mod approval too)
        const lastIdx = item.revisions.length - 1;
        if (lastIdx >= 0) {
          const latestRevision = item.revisions[lastIdx];
          if (latestRevision.status !== 'approved') {
            latestRevision.status = 'approved';
            latestRevision.reviewedBy = adminUser;
            latestRevision.reviewedAt = new Date();
            latestRevision.reviewNote = note?.trim();
          }
          item.currentApprovedRevisionIndex = lastIdx;
        }
        await item.save();

        // Resolve any pending moderation queue entries for this item
        const ModerationQueue = require('../models/ModerationQueue');
        await ModerationQueue.updateMany(
          { contentId: item._id, status: 'pending' },
          { status: 'resolved', resolvedBy: adminUser, resolvedAt: new Date() }
        );

        await new ModerationAction({
          actor: adminUser,
          actionType: 'approve-for-platform',
          contentType: 'bazaar-revision',
          contentId: item._id,
          note: note?.trim()
        }).save();

        await createNotification(context.io, {
          recipientId: item.user.id,
          type: 'bazaar:platformApproved',
          message: `Your item "${item.title}" has been approved for platform use!`,
          navigation: {
            flow: 'drawingBoard',
            dropId: 'drawingBoard:submissionDetail',
            params: { itemId: item._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: adminUser.name,
            avatar: adminUser.avatar
          }
        });

        context.io.emit('admin:queueUpdated', { reason: 'platform-approved' });
        context.io.emit('bazaar:submissionUpdated', {
          itemId: item._id,
          storeType: item.storeType
        });

        return { success: true, message: 'Item approved for platform use.' };
      }
    },

    /**
     * Return item for platform review
     */
    'admin:submission:returnForPlatform': {
      validate: (data) => {
        if (!data.sessionId || !data.itemId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const adminUser = buildUserObject(account);

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        item.platformStatus = 'none';
        await item.save();

        await new ModerationAction({
          actor: adminUser,
          actionType: 'return-for-platform',
          contentType: 'bazaar-revision',
          contentId: item._id,
          note: note?.trim()
        }).save();

        await createNotification(context.io, {
          recipientId: item.user.id,
          type: 'bazaar:platformReturned',
          message: `Your item "${item.title}" was returned for platform review.`,
          navigation: {
            flow: 'drawingBoard',
            dropId: 'drawingBoard:submissionDetail',
            params: { itemId: item._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: adminUser.name,
            avatar: adminUser.avatar
          }
        });

        context.io.emit('admin:queueUpdated', { reason: 'platform-returned' });

        return { success: true, message: 'Item returned for platform review.' };
      }
    },

    /**
     * List escalated items (revisions to platform-approved art)
     */
    'admin:escalated:list': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({ 'activeSessions.sessionId': data.sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const items = await ShopItem.find({
          platformStatus: 'approved-for-platform',
          'revisions.status': 'pending'
        }).lean();

        const escalated = items.map(item => {
          const pendingRevisions = item.revisions
            .map((rev, idx) => ({ ...rev, revisionIndex: idx }))
            .filter(rev => rev.status === 'pending');
          return { item, pendingRevisions };
        }).filter(entry => entry.pendingRevisions.length > 0);

        return { success: true, data: escalated };
      }
    },

    /**
     * Approve an escalated revision on a platform-approved item
     */
    'admin:escalated:approveRevision': {
      validate: (data) => {
        if (!data.sessionId || !data.itemId || data.revisionIndex === undefined) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, revisionIndex, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const adminUser = buildUserObject(account);

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        const revision = item.revisions[revisionIndex];
        if (!revision) {
          return { success: false, error: 'Revision not found' };
        }

        revision.status = 'approved';
        revision.reviewedBy = adminUser;
        revision.reviewNote = note?.trim();
        revision.reviewedAt = new Date();
        item.currentApprovedRevisionIndex = revisionIndex;
        await item.save();

        await new ModerationAction({
          actor: adminUser,
          actionType: 'approve-revision',
          contentType: 'bazaar-revision',
          contentId: item._id,
          revisionIndex,
          note: note?.trim()
        }).save();

        await createNotification(context.io, {
          recipientId: item.user.id,
          type: 'bazaar:revisionApproved',
          message: `Your revision for "${item.title}" has been approved!`,
          navigation: {
            flow: 'drawingBoard',
            dropId: 'drawingBoard:submissionDetail',
            params: { itemId: item._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: adminUser.name,
            avatar: adminUser.avatar
          }
        });

        context.io.emit('admin:queueUpdated', { reason: 'escalated-approved' });
        context.io.emit('bazaar:submissionUpdated', {
          itemId: item._id,
          storeType: item.storeType
        });

        return { success: true, message: 'Escalated revision approved.' };
      }
    },

    /**
     * Return an escalated revision
     */
    'admin:escalated:returnRevision': {
      validate: (data) => {
        if (!data.sessionId || !data.itemId || data.revisionIndex === undefined) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, revisionIndex, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account || !isAdmin(account)) {
          return { success: false, error: 'Not authorized' };
        }

        const adminUser = buildUserObject(account);

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        const revision = item.revisions[revisionIndex];
        if (!revision) {
          return { success: false, error: 'Revision not found' };
        }

        revision.status = 'returned';
        revision.reviewedBy = adminUser;
        revision.reviewNote = note?.trim();
        revision.reviewedAt = new Date();
        await item.save();

        await new ModerationAction({
          actor: adminUser,
          actionType: 'return-revision',
          contentType: 'bazaar-revision',
          contentId: item._id,
          revisionIndex,
          note: note?.trim()
        }).save();

        await createNotification(context.io, {
          recipientId: item.user.id,
          type: 'bazaar:revisionReturned',
          message: `Your revision for "${item.title}" has been returned for changes.`,
          navigation: {
            flow: 'drawingBoard',
            dropId: 'drawingBoard:submissionDetail',
            params: { itemId: item._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: adminUser.name,
            avatar: adminUser.avatar
          }
        });

        context.io.emit('admin:queueUpdated', { reason: 'escalated-returned' });

        return { success: true, message: 'Escalated revision returned.' };
      }
    }
  }
};
