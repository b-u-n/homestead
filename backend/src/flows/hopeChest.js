const HopeChestEntry = require('../models/HopeChestEntry');
const Account = require('../models/Account');

async function accountFromSession(sessionId) {
  if (!sessionId) return null;
  return Account.findOne({ 'activeSessions.sessionId': sessionId });
}

module.exports = {
  name: 'hopeChest',

  handlers: {
    'hopeChest:write': {
      validate: (data) => {
        const { sessionId, content } = data;
        if (!sessionId) return { valid: false, error: 'Missing sessionId' };
        if (!content || typeof content !== 'string') return { valid: false, error: 'Missing content' };
        if (content.length > 5000) return { valid: false, error: 'Content too long' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, content, sourcePrototypeId, sourceFieldRef } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: false, error: 'No account for session' };

        const entry = await HopeChestEntry.create({
          accountId: account._id,
          content,
          sourcePrototypeId: sourcePrototypeId || null,
          sourceFieldRef: sourceFieldRef || null
        });

        return { success: true, data: entry.toObject() };
      }
    },

    'hopeChest:list': {
      validate: () => ({ valid: true }),
      handler: async (data) => {
        const { sessionId, limit = 100 } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: true, data: [] };

        const entries = await HopeChestEntry.find({ accountId: account._id })
          .sort({ createdAt: -1 })
          .limit(Math.min(limit, 500))
          .lean();

        return { success: true, data: entries };
      }
    }
  }
};
