const mongoose = require('mongoose');
const HistoryEntry = require('../models/HistoryEntry');
const Account = require('../models/Account');

const isValidId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

async function accountFromSession(sessionId) {
  if (!sessionId) return null;
  return Account.findOne({ 'activeSessions.sessionId': sessionId });
}

module.exports = {
  name: 'history',

  handlers: {
    'history:write': {
      validate: (data) => {
        const { sessionId, artifactDomain } = data;
        if (!sessionId) return { valid: false, error: 'Missing sessionId' };
        if (!artifactDomain) return { valid: false, error: 'Missing artifactDomain' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, artifactDomain, artifactSnapshot, sourceActivityId, moodRating, titleOrTheme, summaryFields, referentDate } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: false, error: 'No account for session' };

        const entry = await HistoryEntry.create({
          accountId: account._id,
          artifactDomain,
          artifactSnapshot: artifactSnapshot ?? null,
          sourceActivityId: sourceActivityId || null,
          moodRating: moodRating ?? null,
          titleOrTheme: titleOrTheme || null,
          summaryFields: summaryFields ?? null,
          referentDate: referentDate ? new Date(referentDate) : null
        });

        return { success: true, data: entry.toObject() };
      }
    },

    'history:list': {
      validate: () => ({ valid: true }),
      handler: async (data) => {
        const { sessionId, artifactDomain, sourceActivityId, limit = 50 } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: true, data: [] };

        const query = { accountId: account._id };
        if (artifactDomain) query.artifactDomain = artifactDomain;
        if (sourceActivityId) query.sourceActivityId = sourceActivityId;

        const entries = await HistoryEntry.find(query)
          .sort({ savedAt: -1 })
          .limit(Math.min(limit, 200))
          .lean();

        return { success: true, data: entries };
      }
    },

    'history:byActivity': {
      validate: (data) => {
        if (!data.sourceActivityId) return { valid: false, error: 'Missing sourceActivityId' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, sourceActivityId, limit = 50 } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: true, data: [] };

        const entries = await HistoryEntry.find({
          accountId: account._id,
          sourceActivityId
        })
          .sort({ savedAt: -1 })
          .limit(Math.min(limit, 200))
          .lean();

        return { success: true, data: entries };
      }
    },

    'history:get': {
      validate: (data) => {
        if (!isValidId(data.entryId)) return { valid: false, error: 'Invalid entryId' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, entryId } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: false, error: 'No account for session' };

        const entry = await HistoryEntry.findOne({
          _id: entryId,
          accountId: account._id
        }).lean();

        if (!entry) return { success: false, error: 'Entry not found' };
        return { success: true, data: entry };
      }
    }
  }
};
