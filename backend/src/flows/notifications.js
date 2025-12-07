const Notification = require('../models/Notification');
const Account = require('../models/Account');

const MAX_ACTIVE_NOTIFICATIONS = 10;

/**
 * Notifications Flow
 * Handles notification retrieval, marking as read, and real-time delivery
 *
 * Architecture:
 * - Notification collection: Permanent history of all notifications (never deleted)
 * - Account.activeNotifications: Up to 10 most recent unread/active notifications
 * - When dismissed, notification is removed from activeNotifications but stays in history
 */
module.exports = {
  name: 'notifications',

  handlers: {
    /**
     * Get active notifications for the current user (from Account)
     */
    'notifications:get': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId } = data;

        // Get user account
        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Get active notifications from account (already sorted by createdAt desc)
        const notifications = account.activeNotifications || [];
        const unreadCount = notifications.filter(n => !n.read).length;

        return {
          success: true,
          data: {
            notifications: notifications.map(n => ({
              _id: n.notificationId,
              type: n.type,
              message: n.message,
              navigation: n.navigation,
              actor: n.actor,
              read: n.read,
              createdAt: n.createdAt
            })),
            unreadCount
          }
        };
      }
    },

    /**
     * Get notification history (from Notification collection)
     */
    'notifications:history': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, limit = 50, offset = 0 } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Get all notifications from history
        const notifications = await Notification.find({ recipientId: account._id })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean();

        const total = await Notification.countDocuments({ recipientId: account._id });

        return {
          success: true,
          data: {
            notifications,
            total,
            hasMore: offset + notifications.length < total
          }
        };
      }
    },

    /**
     * Get unread notification count
     */
    'notifications:unreadCount': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const unreadCount = (account.activeNotifications || []).filter(n => !n.read).length;

        return {
          success: true,
          data: { unreadCount }
        };
      }
    },

    /**
     * Mark a notification as read
     */
    'notifications:markRead': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        if (!data.notificationId) {
          return { valid: false, error: 'Notification ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, notificationId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Find and update the notification in activeNotifications
        const notifIndex = account.activeNotifications.findIndex(
          n => n.notificationId.toString() === notificationId
        );

        if (notifIndex === -1) {
          return { success: false, error: 'Notification not found in active list' };
        }

        account.activeNotifications[notifIndex].read = true;
        await account.save();

        // Also update in history
        await Notification.findByIdAndUpdate(notificationId, { read: true });

        const unreadCount = account.activeNotifications.filter(n => !n.read).length;

        return {
          success: true,
          data: {
            notification: account.activeNotifications[notifIndex],
            unreadCount
          }
        };
      }
    },

    /**
     * Mark all active notifications as read
     */
    'notifications:markAllRead': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Mark all active notifications as read
        const notificationIds = [];
        account.activeNotifications.forEach(n => {
          n.read = true;
          notificationIds.push(n.notificationId);
        });
        await account.save();

        // Also update in history
        await Notification.updateMany(
          { _id: { $in: notificationIds } },
          { read: true }
        );

        return {
          success: true,
          data: { unreadCount: 0 }
        };
      }
    },

    /**
     * Dismiss a notification (remove from active list, keep in history)
     */
    'notifications:dismiss': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        if (!data.notificationId) {
          return { valid: false, error: 'Notification ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, notificationId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Remove from activeNotifications (but it stays in Notification collection)
        const notifIndex = account.activeNotifications.findIndex(
          n => n.notificationId.toString() === notificationId
        );

        if (notifIndex === -1) {
          return { success: false, error: 'Notification not found in active list' };
        }

        account.activeNotifications.splice(notifIndex, 1);
        await account.save();

        const unreadCount = account.activeNotifications.filter(n => !n.read).length;

        return {
          success: true,
          data: { unreadCount }
        };
      }
    },

    /**
     * Dismiss all notifications (clear active list, keep in history)
     */
    'notifications:dismissAll': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'Session ID required' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Clear activeNotifications (history remains in Notification collection)
        account.activeNotifications = [];
        await account.save();

        return {
          success: true,
          data: { unreadCount: 0 }
        };
      }
    }
  }
};

/**
 * Helper function to create and send a notification
 * Called from other flows (e.g., weepingWillow, wishingWell)
 *
 * 1. Always saves to Notification collection (permanent history)
 * 2. Adds to Account.activeNotifications (max 10, FIFO overflow)
 * 3. Broadcasts to recipient's active sessions
 *
 * @param {Object} io - Socket.IO server instance
 * @param {Object} params - Notification parameters
 * @param {ObjectId} params.recipientId - Account ID of recipient
 * @param {string} params.type - Notification type
 * @param {string} params.message - Notification message
 * @param {Object} params.navigation - Navigation data
 * @param {Object} params.actor - Actor info (who triggered)
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(io, { recipientId, type, message, navigation, actor }) {
  // 1. Always save to Notification collection (permanent history)
  const notification = new Notification({
    recipientId,
    type,
    message,
    navigation,
    actor,
    read: false,
    createdAt: new Date()
  });
  await notification.save();

  // 2. Add to Account's activeNotifications
  const account = await Account.findById(recipientId);
  if (account) {
    // Create the embedded notification object
    const activeNotif = {
      notificationId: notification._id,
      type,
      message,
      navigation,
      actor,
      read: false,
      createdAt: notification.createdAt
    };

    // Add to beginning of array
    account.activeNotifications.unshift(activeNotif);

    // If over limit, remove oldest (they stay in Notification collection as history)
    if (account.activeNotifications.length > MAX_ACTIVE_NOTIFICATIONS) {
      account.activeNotifications = account.activeNotifications.slice(0, MAX_ACTIVE_NOTIFICATIONS);
    }

    await account.save();

    // 3. Broadcast to all connected clients (frontend filters by recipientId)
    io.emit('notifications:new', {
      recipientId: recipientId.toString(),
      notification: {
        _id: notification._id,
        type,
        message,
        navigation: navigation ? {
          flow: navigation.flow,
          dropId: navigation.dropId,
          params: navigation.params instanceof Map
            ? Object.fromEntries(navigation.params)
            : navigation.params
        } : null,
        actor,
        read: false,
        createdAt: notification.createdAt
      }
    });
  }

  return notification;
}

module.exports.createNotification = createNotification;
