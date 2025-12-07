/**
 * Theme Settings WebSocket handlers
 * Manages user theme/color preferences for UI customization
 */

const Account = require('../models/Account');

// Helper to convert nested Maps to plain objects
const convertThemeSettingsToObject = (themeSettings) => {
  if (!themeSettings) {
    return { globalSettings: { minkyColor: null, woolColors: {} }, flowSettings: {} };
  }

  const result = {
    globalSettings: {
      minkyColor: themeSettings.globalSettings?.minkyColor || null,
      woolColors: {}
    },
    flowSettings: {}
  };

  // Convert globalSettings woolColors Map
  if (themeSettings.globalSettings?.woolColors) {
    const woolColors = themeSettings.globalSettings.woolColors;
    if (woolColors instanceof Map) {
      result.globalSettings.woolColors = Object.fromEntries(woolColors);
    } else if (typeof woolColors === 'object') {
      result.globalSettings.woolColors = woolColors;
    }
  }

  // Convert flowSettings Map
  if (themeSettings.flowSettings) {
    const flowSettings = themeSettings.flowSettings;
    if (flowSettings instanceof Map) {
      for (const [flowName, settings] of flowSettings) {
        result.flowSettings[flowName] = {
          enabled: settings.enabled || false,
          minkyColor: settings.minkyColor || null,
          woolColors: settings.woolColors instanceof Map
            ? Object.fromEntries(settings.woolColors)
            : (settings.woolColors || {})
        };
      }
    } else if (typeof flowSettings === 'object') {
      result.flowSettings = flowSettings;
    }
  }

  return result;
};

module.exports = (socket, io) => {
  /**
   * Get user's theme settings
   */
  socket.on('themeSettings:get', async (data, callback) => {
    try {
      const account = socket.user;

      // Return empty settings for guests
      if (!account) {
        return callback({
          success: true,
          globalSettings: { minkyColor: null, woolColors: {} },
          flowSettings: {}
        });
      }

      const settings = convertThemeSettingsToObject(account.themeSettings);
      callback({ success: true, ...settings });
    } catch (error) {
      console.error('Error getting theme settings:', error);
      callback({ success: false, error: 'Failed to get theme settings' });
    }
  });

  /**
   * Update theme settings (full update)
   */
  socket.on('themeSettings:update', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      const { globalSettings, flowSettings } = data;

      // Initialize themeSettings if needed
      if (!account.themeSettings) {
        account.themeSettings = {
          globalSettings: { minkyColor: null, woolColors: new Map() },
          flowSettings: new Map()
        };
      }

      // Update global settings
      if (globalSettings) {
        if (globalSettings.minkyColor !== undefined) {
          account.themeSettings.globalSettings.minkyColor = globalSettings.minkyColor;
        }

        if (globalSettings.woolColors) {
          if (!account.themeSettings.globalSettings.woolColors) {
            account.themeSettings.globalSettings.woolColors = new Map();
          }
          for (const [variant, colors] of Object.entries(globalSettings.woolColors)) {
            account.themeSettings.globalSettings.woolColors.set(variant, colors);
          }
        }
      }

      // Update flow settings
      if (flowSettings) {
        if (!account.themeSettings.flowSettings) {
          account.themeSettings.flowSettings = new Map();
        }
        for (const [flowName, settings] of Object.entries(flowSettings)) {
          const existingFlow = account.themeSettings.flowSettings.get(flowName) || {
            enabled: false,
            minkyColor: null,
            woolColors: new Map()
          };

          if (settings.enabled !== undefined) {
            existingFlow.enabled = settings.enabled;
          }
          if (settings.minkyColor !== undefined) {
            existingFlow.minkyColor = settings.minkyColor;
          }
          if (settings.woolColors) {
            if (!existingFlow.woolColors || !(existingFlow.woolColors instanceof Map)) {
              existingFlow.woolColors = new Map();
            }
            for (const [variant, colors] of Object.entries(settings.woolColors)) {
              existingFlow.woolColors.set(variant, colors);
            }
          }

          account.themeSettings.flowSettings.set(flowName, existingFlow);
        }
      }

      account.markModified('themeSettings');
      await account.save();

      const resultSettings = convertThemeSettingsToObject(account.themeSettings);
      callback({ success: true, ...resultSettings });
    } catch (error) {
      console.error('Error updating theme settings:', error);
      callback({ success: false, error: 'Failed to update theme settings' });
    }
  });

  /**
   * Reset theme settings to defaults
   */
  socket.on('themeSettings:resetAll', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      account.themeSettings = {
        globalSettings: { minkyColor: null, woolColors: new Map() },
        flowSettings: new Map()
      };
      account.markModified('themeSettings');
      await account.save();

      callback({
        success: true,
        globalSettings: { minkyColor: null, woolColors: {} },
        flowSettings: {}
      });
    } catch (error) {
      console.error('Error resetting theme settings:', error);
      callback({ success: false, error: 'Failed to reset theme settings' });
    }
  });

  /**
   * Reset a specific flow's theme settings
   */
  socket.on('themeSettings:resetFlow', async (data, callback) => {
    try {
      const account = socket.user;

      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      const { flowName } = data;

      if (!flowName || typeof flowName !== 'string') {
        return callback({ success: false, error: 'Flow name is required' });
      }

      if (account.themeSettings?.flowSettings) {
        account.themeSettings.flowSettings.delete(flowName);
        account.markModified('themeSettings');
        await account.save();
      }

      const resultSettings = convertThemeSettingsToObject(account.themeSettings);
      callback({ success: true, ...resultSettings });
    } catch (error) {
      console.error('Error resetting flow theme settings:', error);
      callback({ success: false, error: 'Failed to reset flow theme settings' });
    }
  });
};
