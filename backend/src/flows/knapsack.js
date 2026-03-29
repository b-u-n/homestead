const Account = require('../models/Account');
const ShopItem = require('../models/ShopItem');
const ModerationQueue = require('../models/ModerationQueue');
const { isPortable } = require('../utils/itemHelpers');
const { savePixelArtPNG } = require('../services/pixelImageService');
const mongoose = require('mongoose');

function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}

module.exports = {
  name: 'knapsack',

  handlers: {
    /**
     * Get portable items (items that show in the knapsack)
     */
    'knapsack:items:list': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({
          'activeSessions.sessionId': data.sessionId
        });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const portableItems = (account.userItems || []).filter(
          item => isPortable(item.storeType)
        );

        return {
          success: true,
          data: portableItems
        };
      }
    },

    /**
     * Get ALL user items (for a future "My Stuff" view)
     */
    'knapsack:items:all': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({
          'activeSessions.sessionId': data.sessionId
        });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        return {
          success: true,
          data: account.userItems || []
        };
      }
    },

    /**
     * Create a new item (e.g., blank pixel sketch)
     */
    'knapsack:items:create': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        if (!data.storeType) {
          return { valid: false, error: 'storeType is required' };
        }
        if (!data.title) {
          return { valid: false, error: 'title is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, storeType, title, tags, itemData } = data;

        const account = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const newItem = {
          _id: new mongoose.Types.ObjectId(),
          title: title.trim(),
          storeType,
          tags: tags || [],
          data: itemData || null,
          purchasedAt: new Date(),
          updatedAt: new Date()
        };

        account.userItems.push(newItem);
        await account.save();

        // Return the created item (last in array)
        const created = account.userItems[account.userItems.length - 1];
        return {
          success: true,
          data: created
        };
      }
    },

    /**
     * Update item data (e.g., save pixel art changes)
     */
    'knapsack:items:update': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        if (!data.itemId) {
          return { valid: false, error: 'itemId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, title, itemData, tags } = data;

        const account = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const item = account.userItems.id(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        if (title !== undefined) item.title = title.trim();
        if (itemData !== undefined) item.data = itemData;
        if (tags !== undefined) item.tags = tags;
        item.updatedAt = new Date();

        // Generate PNG for sketch items with pixel data
        if (item.storeType === 'sketch' && itemData?.pixels && itemData?.width && itemData?.height) {
          try {
            const contentUrl = await savePixelArtPNG(
              itemData.pixels, itemData.width, itemData.height,
              account._id.toString()
            );
            item.contentUrl = contentUrl;
          } catch (err) {
            console.error('Failed to generate sketch PNG:', err);
          }
        }

        await account.save();

        return {
          success: true,
          data: item
        };
      }
    },

    /**
     * Delete a portable item
     */
    'knapsack:items:remove': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        if (!data.itemId) {
          return { valid: false, error: 'itemId is required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId } = data;

        const account = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const item = account.userItems.id(itemId);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        if (!isPortable(item.storeType)) {
          return { success: false, error: 'Cannot delete non-portable items from knapsack' };
        }

        account.userItems.pull({ _id: itemId });
        await account.save();

        return {
          success: true,
          message: 'Item removed'
        };
      }
    },

    /**
     * Submit a sketch from knapsack to the shop
     * Generates PNG, creates ShopItem, adds to moderation queue
     */
    'knapsack:items:submitToShop': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'sessionId is required' };
        if (!data.itemId) return { valid: false, error: 'itemId is required' };
        if (data.visibility && !['public', 'private'].includes(data.visibility)) {
          return { valid: false, error: 'visibility must be public or private' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, itemId, visibility } = data;

        const account = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!account) return { success: false, error: 'Account not found' };

        const item = account.userItems.id(itemId);
        if (!item) return { success: false, error: 'Item not found' };
        if (item.storeType !== 'sketch') {
          return { success: false, error: 'Only sketches can be submitted to the shop' };
        }

        const pixelData = item.data;
        if (!pixelData?.pixels || !pixelData?.width || !pixelData?.height) {
          return { success: false, error: 'Sketch has no pixel data' };
        }

        // Generate PNG
        let contentUrl;
        try {
          contentUrl = await savePixelArtPNG(
            pixelData.pixels, pixelData.width, pixelData.height,
            account._id.toString()
          );
        } catch (err) {
          console.error('Failed to generate PNG for shop submission:', err);
          return { success: false, error: 'Failed to generate image' };
        }

        // Create ShopItem
        const shopItem = new ShopItem({
          title: item.title || 'Pixel Sketch',
          description: `Pixel art (${pixelData.width}x${pixelData.height})`,
          storeType: 'sketch',
          mediaType: 'image',
          user: buildUserObject(account),
          visibility: visibility || 'public',
          revisions: [{
            contentUrl,
            note: 'Submitted from knapsack',
            status: 'pending'
          }],
          shopStatus: 'not-listed',
          copyright: {
            ipConfirmed: true,
            confirmedAt: new Date()
          }
        });
        await shopItem.save();

        // Add to moderation queue
        const queueEntry = new ModerationQueue({
          contentType: 'bazaar-revision',
          itemType: 'sketch',
          contentId: shopItem._id,
          revisionIndex: 0,
          status: 'pending'
        });
        await queueEntry.save();

        context.io.emit('moderation:queueUpdated', { contentType: 'bazaar-revision' });

        return {
          success: true,
          message: 'Sketch submitted for review!',
          data: { shopItemId: shopItem._id }
        };
      }
    }
  }
};
