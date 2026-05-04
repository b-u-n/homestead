const MoodEntry = require('../models/MoodEntry');
const Account = require('../models/Account');

async function accountFromSession(sessionId) {
  if (!sessionId) return null;
  return Account.findOne({ 'activeSessions.sessionId': sessionId });
}

module.exports = {
  name: 'mood',

  handlers: {
    'mood:write': {
      validate: (data) => {
        const { sessionId, moodValue } = data;
        if (!sessionId) return { valid: false, error: 'Missing sessionId' };
        if (typeof moodValue !== 'number') return { valid: false, error: 'Missing moodValue' };
        if (moodValue < 1 || moodValue > 10) return { valid: false, error: 'moodValue must be 1-10' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, moodValue, sourceActivityId, sourceSaveEvent } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: false, error: 'No account for session' };

        const entry = await MoodEntry.create({
          accountId: account._id,
          moodValue,
          sourceActivityId: sourceActivityId || null,
          sourceSaveEvent: sourceSaveEvent || null
        });

        return { success: true, data: entry.toObject() };
      }
    },

    'mood:list': {
      validate: () => ({ valid: true }),
      handler: async (data) => {
        const { sessionId, limit = 100 } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: true, data: [] };

        const entries = await MoodEntry.find({ accountId: account._id })
          .sort({ createdAt: -1 })
          .limit(Math.min(limit, 500))
          .lean();

        return { success: true, data: entries };
      }
    },

    'mood:since': {
      validate: (data) => {
        if (!data.timestamp) return { valid: false, error: 'Missing timestamp' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, timestamp } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: true, data: [] };

        const entries = await MoodEntry.find({
          accountId: account._id,
          createdAt: { $gt: new Date(timestamp) }
        })
          .sort({ createdAt: 1 })
          .lean();

        return { success: true, data: entries };
      }
    }
  }
};
