/**
 * Sound Settings WebSocket handlers
 * Manages user sound preferences
 */

const Account = require('../models/Account');

module.exports = (socket, io) => {
  /**
   * Get user's sound settings
   */
  socket.on('soundSettings:get', async (data, callback) => {
    try {
      const account = socket.user;

      // Return empty settings for guests
      if (!account) {
        return callback({ success: true, settings: {} });
      }

      // Convert Map to plain object
      const settings = account.soundSettings
        ? Object.fromEntries(account.soundSettings)
        : {};

      callback({ success: true, settings });
    } catch (error) {
      console.error('Error getting sound settings:', error);
      callback({ success: false, error: 'Failed to get sound settings' });
    }
  });

  /**
   * Update a single sound setting
   */
  socket.on('soundSettings:update', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      const { soundKey, settings } = data;

      if (!soundKey || typeof soundKey !== 'string') {
        return callback({ success: false, error: 'Sound key is required' });
      }

      // Validate settings
      if (settings.volume !== undefined) {
        if (typeof settings.volume !== 'number' || settings.volume < 0 || settings.volume > 1) {
          return callback({ success: false, error: 'Volume must be a number between 0 and 1' });
        }
      }

      if (settings.enabled !== undefined && typeof settings.enabled !== 'boolean') {
        return callback({ success: false, error: 'Enabled must be a boolean' });
      }

      // Initialize soundSettings if needed
      if (!account.soundSettings) {
        account.soundSettings = new Map();
      }

      // Get existing settings for this sound or create new
      const existingSettings = account.soundSettings.get(soundKey) || {};

      // Merge new settings
      const newSettings = { ...existingSettings };
      if (settings.volume !== undefined) newSettings.volume = settings.volume;
      if (settings.enabled !== undefined) newSettings.enabled = settings.enabled;

      // If settings are back to defaults (no overrides), remove the entry
      if (Object.keys(newSettings).length === 0 ||
          (newSettings.volume === undefined && newSettings.enabled === undefined)) {
        account.soundSettings.delete(soundKey);
      } else {
        account.soundSettings.set(soundKey, newSettings);
      }

      await account.save();

      callback({
        success: true,
        settings: Object.fromEntries(account.soundSettings)
      });
    } catch (error) {
      console.error('Error updating sound setting:', error);
      callback({ success: false, error: 'Failed to update sound setting' });
    }
  });

  /**
   * Update multiple sound settings at once
   */
  socket.on('soundSettings:updateBatch', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      const { settings } = data;

      if (!settings || typeof settings !== 'object') {
        return callback({ success: false, error: 'Settings object is required' });
      }

      // Initialize soundSettings if needed
      if (!account.soundSettings) {
        account.soundSettings = new Map();
      }

      // Process each sound setting
      for (const [soundKey, soundSettings] of Object.entries(settings)) {
        if (!soundSettings || typeof soundSettings !== 'object') continue;

        const newSettings = {};

        if (soundSettings.volume !== undefined) {
          if (typeof soundSettings.volume === 'number' &&
              soundSettings.volume >= 0 &&
              soundSettings.volume <= 1) {
            newSettings.volume = soundSettings.volume;
          }
        }

        if (soundSettings.enabled !== undefined && typeof soundSettings.enabled === 'boolean') {
          newSettings.enabled = soundSettings.enabled;
        }

        // Only store if there are overrides
        if (Object.keys(newSettings).length > 0) {
          account.soundSettings.set(soundKey, newSettings);
        } else {
          account.soundSettings.delete(soundKey);
        }
      }

      await account.save();

      callback({
        success: true,
        settings: Object.fromEntries(account.soundSettings)
      });
    } catch (error) {
      console.error('Error updating sound settings batch:', error);
      callback({ success: false, error: 'Failed to update sound settings' });
    }
  });

  /**
   * Reset a sound to default settings
   */
  socket.on('soundSettings:reset', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      const { soundKey } = data;

      if (!soundKey || typeof soundKey !== 'string') {
        return callback({ success: false, error: 'Sound key is required' });
      }

      if (account.soundSettings) {
        account.soundSettings.delete(soundKey);
        await account.save();
      }

      callback({
        success: true,
        settings: account.soundSettings
          ? Object.fromEntries(account.soundSettings)
          : {}
      });
    } catch (error) {
      console.error('Error resetting sound setting:', error);
      callback({ success: false, error: 'Failed to reset sound setting' });
    }
  });

  /**
   * Reset all sounds to defaults
   */
  socket.on('soundSettings:resetAll', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      account.soundSettings = new Map();
      await account.save();

      callback({ success: true, settings: {} });
    } catch (error) {
      console.error('Error resetting all sound settings:', error);
      callback({ success: false, error: 'Failed to reset sound settings' });
    }
  });
};
