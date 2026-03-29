const Account = require('../models/Account');
const { getAccessibleFeatures, setFeatureLevel } = require('../utils/featureAccess');

module.exports = {
  name: 'features',

  handlers: {
    /**
     * Get all feature IDs accessible by the current player
     */
    'features:mine': {
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

        const features = getAccessibleFeatures(account);
        return {
          success: true,
          data: {
            featureLevel: account.featureLevel || 0,
            features
          }
        };
      }
    },

    /**
     * Set a player's feature level (admin only)
     */
    'features:setLevel': {
      validate: (data) => {
        if (!data.sessionId) {
          return { valid: false, error: 'sessionId is required' };
        }
        if (!data.targetAccountId) {
          return { valid: false, error: 'targetAccountId is required' };
        }
        if (typeof data.level !== 'number' || data.level < 0) {
          return { valid: false, error: 'level must be a non-negative number' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, targetAccountId, level } = data;

        // Verify caller is admin
        const caller = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!caller || !caller.permissions.includes('admin')) {
          return { success: false, error: 'Admin permission required' };
        }

        const updated = await setFeatureLevel(targetAccountId, level);
        if (!updated) {
          return { success: false, error: 'Target account not found' };
        }

        return {
          success: true,
          data: {
            accountId: targetAccountId,
            featureLevel: updated.featureLevel
          }
        };
      }
    }
  }
};
