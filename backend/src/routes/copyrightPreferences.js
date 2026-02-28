/**
 * Copyright Preferences WebSocket handlers
 * Manages user copyright/attribution preferences for bazaar submissions
 */

const Account = require('../models/Account');
const CopyrightChangeLog = require('../models/CopyrightChangeLog');

const VALID_ATTRIBUTIONS = ['real-name', 'username', 'none'];

module.exports = (socket, io) => {
  /**
   * Get user's copyright preferences
   */
  socket.on('copyrightPreferences:get', async (data, callback) => {
    try {
      const { sessionId } = data;
      if (!sessionId) {
        return callback({ success: false, error: 'sessionId is required' });
      }

      const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
      if (!account) {
        return callback({ success: false, error: 'Account not found' });
      }

      // Mongoose hydrates subdocs with schema defaults even when unset in DB.
      // Check raw MongoDB document to see if preferences were explicitly saved.
      const raw = await Account.collection.findOne(
        { _id: account._id },
        { projection: { copyrightPreferences: 1 } }
      );
      const preferences = raw?.copyrightPreferences || null;
      callback({ success: true, data: { preferences } });
    } catch (error) {
      console.error('Error getting copyright preferences:', error);
      callback({ success: false, error: 'Failed to get copyright preferences' });
    }
  });

  /**
   * Update copyright preferences
   */
  socket.on('copyrightPreferences:update', async (data, callback) => {
    try {
      const { sessionId, preferences, source } = data;
      if (!sessionId) {
        return callback({ success: false, error: 'sessionId is required' });
      }
      if (!preferences || typeof preferences !== 'object') {
        return callback({ success: false, error: 'preferences object is required' });
      }

      const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
      if (!account) {
        return callback({ success: false, error: 'Account not found' });
      }

      // Validate attribution enum
      if (preferences.attribution && !VALID_ATTRIBUTIONS.includes(preferences.attribution)) {
        return callback({ success: false, error: 'Invalid attribution value' });
      }

      // Snapshot previous state for audit log
      const previous = account.copyrightPreferences
        ? JSON.parse(JSON.stringify(account.copyrightPreferences))
        : null;

      // Build updated preferences
      const updated = {
        authorizeAdvertising: preferences.authorizeAdvertising || false,
        attribution: preferences.attribution || 'username',
        realName: preferences.realName?.trim() || undefined,
        contactInfo: preferences.contactInfo?.trim() || undefined,
        attributionLink: preferences.attributionLink?.trim() || undefined,
      };

      account.copyrightPreferences = updated;
      account.markModified('copyrightPreferences');
      await account.save();

      // Audit log
      await new CopyrightChangeLog({
        accountId: account._id,
        previous,
        updated,
        source: source || 'settings',
      }).save();

      callback({ success: true, data: { preferences: updated } });
    } catch (error) {
      console.error('Error updating copyright preferences:', error);
      callback({ success: false, error: 'Failed to update copyright preferences' });
    }
  });

  /**
   * Reset copyright preferences
   */
  socket.on('copyrightPreferences:reset', async (data, callback) => {
    try {
      const { sessionId } = data;
      if (!sessionId) {
        return callback({ success: false, error: 'sessionId is required' });
      }

      const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
      if (!account) {
        return callback({ success: false, error: 'Account not found' });
      }

      const previous = account.copyrightPreferences
        ? JSON.parse(JSON.stringify(account.copyrightPreferences))
        : null;

      account.copyrightPreferences = undefined;
      account.markModified('copyrightPreferences');
      await account.save();

      // Audit log
      await new CopyrightChangeLog({
        accountId: account._id,
        previous,
        updated: null,
        source: 'settings',
      }).save();

      callback({ success: true, data: { preferences: null } });
    } catch (error) {
      console.error('Error resetting copyright preferences:', error);
      callback({ success: false, error: 'Failed to reset copyright preferences' });
    }
  });
};
