const ShopItem = require('../models/ShopItem');
const ModerationQueue = require('../models/ModerationQueue');
const Account = require('../models/Account');
const { getPrice } = require('../utils/bazaarPricing');
const { saveImage } = require('../services/shopContentService');
const { createNotification } = require('./notifications');

// Platform asset catalog (static — same data as frontend)
const PLATFORM_ASSETS = [
  { id: 'loc-town-square', category: 'Locations', name: 'Town Square' },
  { id: 'loc-sugarbee-cafe', category: 'Locations', name: 'Sugarbee Cafe' },
  { id: 'loc-library', category: 'Locations', name: 'Library' },
  { id: 'loc-weeping-willow', category: 'Locations', name: 'Weeping Willow Grove' },
  { id: 'loc-garden', category: 'Locations', name: 'Garden' },
  { id: 'loc-marketplace', category: 'Locations', name: 'Marketplace' },
  { id: 'ui-minky-panel', category: 'UI Elements', name: 'Minky Panel Texture' },
  { id: 'ui-wool-button', category: 'UI Elements', name: 'Wool Button Texture' },
  { id: 'ui-stitched-border', category: 'UI Elements', name: 'Stitched Border' },
  { id: 'bg-slot-bg', category: 'Backgrounds', name: 'Slot Background' },
  { id: 'bg-tiled', category: 'Backgrounds', name: 'Tiled Background' },
  { id: 'char-campfire', category: 'Characters', name: 'Campfire' },
  { id: 'char-wishing-well', category: 'Characters', name: 'Wishing Well' },
  { id: 'char-help-wanted', category: 'Characters', name: 'Help Wanted Board' },
  { id: 'bookshelf-worried', category: 'Bookshelves', name: 'Workshop: Worried' },
  { id: 'bookshelf-sad', category: 'Bookshelves', name: 'Workshop: Sad' },
  { id: 'bookshelf-angry', category: 'Bookshelves', name: 'Workshop: Angry' },
  { id: 'bookshelf-assertiveness', category: 'Bookshelves', name: 'Workshop: Assertiveness' },
];

function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}

module.exports = {
  name: 'bazaar',

  handlers: {
    /**
     * List in-shop items filtered by storeType (stall view)
     */
    'bazaar:shop:list': {
      validate: (data) => {
        if (!data.storeType) {
          return { valid: false, error: 'storeType is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { storeType } = data;

        const items = await ShopItem.find({
          storeType,
          shopStatus: 'in-shop'
        })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        // Map to include approved revision content and computed price
        const shopItems = items.map(item => {
          const approvedRevision = item.currentApprovedRevisionIndex !== null
            ? item.revisions[item.currentApprovedRevisionIndex]
            : null;

          return {
            _id: item._id,
            title: item.title,
            description: item.description,
            storeType: item.storeType,
            subtype: item.subtype,
            mediaType: item.mediaType,
            tags: item.tags,
            user: item.user,
            contentUrl: approvedRevision?.contentUrl || null,
            textContent: approvedRevision?.textContent || null,
            price: getPrice(item.purchaseCount),
            purchaseCount: item.purchaseCount,
            platformStatus: item.platformStatus,
            platformAssetId: item.platformAssetId || null,
            createdAt: item.createdAt
          };
        });

        return { success: true, data: shopItems };
      }
    },

    /**
     * Get a single submission with all details
     */
    'bazaar:submission:get': {
      validate: (data) => {
        if (!data.itemId) {
          return { valid: false, error: 'itemId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const item = await ShopItem.findById(data.itemId).lean();

        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        return {
          success: true,
          data: {
            ...item,
            price: getPrice(item.purchaseCount),
            // Only return visible comments
            comments: item.comments.filter(c => c.visible)
          }
        };
      }
    },

    /**
     * Create a new submission
     */
    'bazaar:submission:create': {
      validate: (data) => {
        const { sessionId, title, storeType, mediaType } = data;
        if (!sessionId || !title || !storeType) {
          return { valid: false, error: 'Missing required fields' };
        }
        if (title.length > 100) {
          return { valid: false, error: 'Title must be 100 characters or less' };
        }
        if (data.description && data.description.length > 2000) {
          return { valid: false, error: 'Description must be 2000 characters or less' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, title, description, storeType, subtype, mediaType,
                tags, platformAssetId, intendedPlatformUse, content, note, copyright } = data;

        // Validate ownership confirmation
        if (!copyright?.ipConfirmed) {
          return { success: false, error: 'Ownership confirmation required' };
        }

        const clientIp = context.socket?.handshake?.address || null;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const user = buildUserObject(account);
        const effectiveMediaType = mediaType || 'image';

        // Save content based on media type
        let contentUrl = null;
        let textContent = null;

        if (effectiveMediaType === 'image' && content) {
          try {
            contentUrl = await saveImage(content, account._id.toString());
          } catch (err) {
            return { success: false, error: err.message };
          }
        } else if (effectiveMediaType === 'text' || effectiveMediaType === 'prompt') {
          textContent = content;
        }

        const shopItem = new ShopItem({
          title: title.trim(),
          description: description?.trim(),
          storeType,
          subtype: subtype?.trim() || undefined,
          mediaType: effectiveMediaType,
          tags: tags || [],
          platformAssetId: platformAssetId || null,
          intendedPlatformUse: intendedPlatformUse || null,
          copyright: {
            ipConfirmed: true,
            authorizeAdvertising: copyright.authorizeAdvertising || false,
            attribution: copyright.attribution || 'username',
            realName: copyright.realName?.trim(),
            contactInfo: copyright.contactInfo?.trim(),
            attributionLink: copyright.attributionLink?.trim(),
            confirmedFromIp: clientIp,
            confirmedAt: new Date(),
          },
          submittedFromIp: clientIp,
          user,
          revisions: [{
            contentUrl,
            textContent,
            note: note?.trim(),
            status: 'pending',
            createdAt: new Date()
          }],
          currentApprovedRevisionIndex: null,
          shopStatus: 'not-listed',
          platformStatus: 'none'
        });

        await shopItem.save();

        // Add to moderation queue
        const queueEntry = new ModerationQueue({
          contentType: 'bazaar-revision',
          itemType: storeType,
          contentId: shopItem._id,
          revisionIndex: 0,
          referenceTitle: title.trim(),
          submittedBy: user,
          status: 'pending',
          priority: 'normal'
        });
        await queueEntry.save();

        // Broadcast new submission
        context.io.emit('bazaar:newSubmission', {
          itemId: shopItem._id,
          storeType
        });

        // Notify moderators
        context.io.emit('moderation:queueUpdated', {
          contentType: 'bazaar-revision',
          itemType: storeType
        });

        return {
          success: true,
          message: 'Submission created! It will be reviewed by a moderator.',
          data: shopItem
        };
      }
    },

    /**
     * List current user's submissions
     */
    'bazaar:submissions:mine': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({ 'activeSessions.sessionId': data.sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const items = await ShopItem.find({ 'user.id': account._id })
          .sort({ createdAt: -1 })
          .lean();

        const submissions = items.map(item => ({
          ...item,
          price: getPrice(item.purchaseCount)
        }));

        return { success: true, data: submissions };
      }
    },

    /**
     * Add a comment to a submission
     */
    'bazaar:submission:comment': {
      validate: (data) => {
        const { sessionId, itemId, content } = data;
        if (!sessionId || !itemId || !content) {
          return { valid: false, error: 'Missing required fields' };
        }
        if (content.length > 5000) {
          return { valid: false, error: 'Comment must be 5000 characters or less' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, content } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        const user = buildUserObject(account);

        const comment = {
          content: content.trim(),
          user,
          visible: false,
          createdAt: new Date()
        };

        item.comments.push(comment);
        await item.save();

        const commentIndex = item.comments.length - 1;

        // Add to moderation queue
        const queueEntry = new ModerationQueue({
          contentType: 'bazaar-comment',
          itemType: item.storeType,
          contentId: item._id,
          commentIndex,
          referenceTitle: item.title,
          submittedBy: user,
          status: 'pending',
          priority: 'normal'
        });
        await queueEntry.save();

        context.io.emit('moderation:queueUpdated', {
          contentType: 'bazaar-comment',
          itemType: item.storeType
        });

        return {
          success: true,
          message: 'Comment submitted for review.',
          data: { comment, commentIndex }
        };
      }
    },

    /**
     * Submit a revision to an existing item
     */
    'bazaar:submission:revise': {
      validate: (data) => {
        const { sessionId, itemId, content } = data;
        if (!sessionId || !itemId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, content, note } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        // Only owner can revise
        if (!item.user.id.equals(account._id)) {
          return { success: false, error: 'Only the item owner can submit revisions' };
        }

        const user = buildUserObject(account);

        // Save content
        let contentUrl = null;
        let textContent = null;

        if (item.mediaType === 'image' && content) {
          try {
            contentUrl = await saveImage(content, account._id.toString());
          } catch (err) {
            return { success: false, error: err.message };
          }
        } else if (item.mediaType === 'text' || item.mediaType === 'prompt') {
          textContent = content;
        }

        // If pending revision exists, supersede it
        for (let i = 0; i < item.revisions.length; i++) {
          if (item.revisions[i].status === 'pending') {
            item.revisions[i].status = 'superseded';

            // Also supersede the matching queue entry
            await ModerationQueue.updateMany(
              { contentId: item._id, revisionIndex: i, status: 'pending' },
              { status: 'superseded' }
            );
          }
        }

        // Append new revision
        const newRevision = {
          contentUrl,
          textContent,
          note: note?.trim(),
          status: 'pending',
          createdAt: new Date()
        };
        item.revisions.push(newRevision);
        const revisionIndex = item.revisions.length - 1;

        await item.save();

        // If platform-approved → send to admin queue directly (not mod queue)
        if (item.platformStatus === 'approved-for-platform') {
          // Notify admins about escalated revision
          const adminAccounts = await Account.find({ permissions: 'admin' });
          for (const admin of adminAccounts) {
            await createNotification(context.io, {
              recipientId: admin._id,
              type: 'bazaar:escalatedToAdmin',
              message: `Revision submitted for platform-approved item: ${item.title}`,
              navigation: {
                flow: 'admin',
                dropId: 'admin:reviewItem',
                params: { itemId: item._id.toString(), revisionIndex }
              },
              actor: {
                accountId: account._id,
                name: user.name,
                avatar: user.avatar
              }
            });
          }

          context.io.emit('admin:queueUpdated', {
            reason: 'escalated-revision',
            itemId: item._id
          });
        } else {
          // Normal mod queue
          const queueEntry = new ModerationQueue({
            contentType: 'bazaar-revision',
            itemType: item.storeType,
            contentId: item._id,
            revisionIndex,
            referenceTitle: item.title,
            submittedBy: user,
            status: 'pending',
            priority: 'normal'
          });
          await queueEntry.save();

          context.io.emit('moderation:queueUpdated', {
            contentType: 'bazaar-revision',
            itemType: item.storeType
          });
        }

        context.io.emit('bazaar:submissionUpdated', {
          itemId: item._id,
          storeType: item.storeType
        });

        return {
          success: true,
          message: 'Revision submitted for review.',
          data: { item, revisionIndex }
        };
      }
    },

    /**
     * Purchase an item from the shop
     */
    'bazaar:submission:purchase': {
      validate: (data) => {
        const { sessionId, itemId } = data;
        if (!sessionId || !itemId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId } = data;

        const buyer = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!buyer) {
          return { success: false, error: 'Account not found' };
        }

        const item = await ShopItem.findById(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        if (item.shopStatus !== 'in-shop') {
          return { success: false, error: 'Item is not available for purchase' };
        }

        // Check if already purchased
        const alreadyPurchased = item.purchasedBy.some(p => p.user.id.equals(buyer._id));
        if (alreadyPurchased) {
          return { success: false, error: 'You already own this item' };
        }

        const price = getPrice(item.purchaseCount);
        const totalHearts = buyer.hearts + buyer.heartBank;

        if (totalHearts < price) {
          return { success: false, error: `Not enough hearts. You have ${totalHearts}, need ${price}` };
        }

        // Deduct hearts: active first, then bank (wishing well tip pattern)
        let remaining = price;
        if (buyer.hearts >= remaining) {
          buyer.hearts -= remaining;
          remaining = 0;
        } else {
          remaining -= buyer.hearts;
          buyer.hearts = 0;
          buyer.heartBank -= remaining;
          remaining = 0;
        }

        // Get approved revision content for personal copy
        const approvedRevision = item.currentApprovedRevisionIndex !== null
          ? item.revisions[item.currentApprovedRevisionIndex]
          : null;

        // Add personal copy to buyer's userItems
        buyer.userItems.push({
          shopItemId: item._id,
          title: item.title,
          storeType: item.storeType,
          subtype: item.subtype,
          mediaType: item.mediaType,
          contentUrl: approvedRevision?.contentUrl || null,
          textContent: approvedRevision?.textContent || null,
          tags: item.tags,
          purchasedAt: new Date()
        });

        await buyer.save();

        // Update item
        const buyerUser = buildUserObject(buyer);
        item.purchasedBy.push({
          user: buyerUser,
          purchasedAt: new Date()
        });
        item.purchaseCount += 1;
        await item.save();

        // Award hearts to seller: active (up to 9), overflow to bank
        const seller = await Account.findById(item.user.id);
        if (seller) {
          const heartsToActive = Math.min(price, 9 - seller.hearts);
          const heartsToBank = price - heartsToActive;
          seller.hearts += heartsToActive;
          seller.heartBank += heartsToBank;
          await seller.save();

          // Notify seller
          await createNotification(context.io, {
            recipientId: seller._id,
            type: 'bazaar:purchase',
            message: `${buyerUser.name} purchased your item "${item.title}" for ${price} hearts!`,
            navigation: {
              flow: 'drawingBoard',
              dropId: 'drawingBoard:submissionDetail',
              params: { itemId: item._id.toString() }
            },
            actor: {
              accountId: buyer._id,
              name: buyerUser.name,
              avatar: buyerUser.avatar
            }
          });
        }

        context.io.emit('bazaar:newPurchase', {
          itemId: item._id,
          storeType: item.storeType,
          purchaseCount: item.purchaseCount,
          newPrice: getPrice(item.purchaseCount)
        });

        return {
          success: true,
          message: `Purchased "${item.title}" for ${price} hearts!`,
          data: {
            buyerBalance: { hearts: buyer.hearts, heartBank: buyer.heartBank },
            item: {
              _id: item._id,
              purchaseCount: item.purchaseCount,
              price: getPrice(item.purchaseCount)
            }
          }
        };
      }
    },

    /**
     * List current user's comments across all items
     */
    'bazaar:comments:mine': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({ 'activeSessions.sessionId': data.sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const items = await ShopItem.find({ 'comments.user.id': account._id })
          .sort({ createdAt: -1 })
          .lean();

        const comments = [];
        for (const item of items) {
          const approvedRevision = item.currentApprovedRevisionIndex !== null
            ? item.revisions[item.currentApprovedRevisionIndex]
            : null;

          for (const comment of item.comments) {
            if (comment.user.id.toString() === account._id.toString()) {
              comments.push({
                itemId: item._id,
                itemTitle: item.title,
                contentUrl: approvedRevision?.contentUrl || null,
                comment: {
                  _id: comment._id,
                  content: comment.content,
                  visible: comment.visible,
                  removed: comment.removed || false,
                  createdAt: comment.createdAt
                }
              });
            }
          }
        }

        comments.sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt));

        return { success: true, data: comments };
      }
    },

    /**
     * Return platform asset catalog
     */
    'bazaar:assets:list': {
      validate: () => ({ valid: true }),

      handler: async (data, context) => {
        return { success: true, data: PLATFORM_ASSETS };
      }
    }
  }
};
