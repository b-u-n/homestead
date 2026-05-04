const mongoose = require('mongoose');
const Workbook = require('../models/Workbook');
const WorkbookActivity = require('../models/WorkbookActivity');
const WorkbookProgress = require('../models/WorkbookProgress');
const HistoryEntry = require('../models/HistoryEntry');
const Account = require('../models/Account');

// Treat non-ObjectId strings (including legacy frontend placeholders) as missing
// rather than letting Mongoose throw a CastError downstream.
const safeInstanceId = (v) =>
  typeof v === 'string' && mongoose.Types.ObjectId.isValid(v) ? v : null;

// --- helpers for HistoryEntry summary extraction ---------------------------------
// Walk every step's saved value and return the first match for `bindKey`.
// Tolerates both `collect: 'merge'` (object keyed by bind) and `collect: 'first'`
// (raw value). For `collect: 'first'`, we can't tell which bind it was, so we only
// match when the step.stepId itself equals bindKey (e.g. a step named 'journal').
function findBindValue(stepData, bindKey) {
  if (!stepData || typeof stepData !== 'object') return null;
  for (const [stepId, value] of Object.entries(stepData)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && value[bindKey] != null) {
      return value[bindKey];
    }
    if (stepId === bindKey && value != null) {
      return value;
    }
  }
  return null;
}

function truncate(s, n) {
  if (typeof s !== 'string') return s;
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function buildSummaryFields({ preMood, postMood, journal }) {
  const fields = [];
  if (preMood != null) fields.push({ label: 'Mood before', value: `${preMood}/10` });
  if (postMood != null) {
    const value = preMood != null ? `${preMood}/10 → ${postMood}/10` : `${postMood}/10`;
    fields.push({ label: 'Mood after', value });
  }
  if (journal && typeof journal === 'string' && journal.trim()) {
    fields.push({ label: 'Reflection', value: truncate(journal.trim(), 140) });
  }
  return fields;
}
// --------------------------------------------------------------------------------

/**
 * Workbook Flow
 * Handles workbook loading, activity progress, and completion tracking
 */
module.exports = {
  name: 'workbook',

  handlers: {
    /**
     * Load a workbook by bookshelfId
     * Returns the workbook with its activities
     */
    'workbook:load': {
      validate: (data) => {
        const { bookshelfId } = data;
        if (!bookshelfId) {
          return { valid: false, error: 'Missing bookshelfId' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { bookshelfId, sessionId } = data;

        // Beta gate: only beta users can access activities
        if (sessionId) {
          const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
          if (!account || !account.beta) {
            return { success: true, data: { workbook: { bookshelfId, title: bookshelfId, activities: [] }, progress: [] } };
          }
        }

        // Find workbook by bookshelfId
        let workbook = await Workbook.findOne({ bookshelfId }).lean();

        // If workbook doesn't exist, create a placeholder
        if (!workbook) {
          const placeholderWorkbook = new Workbook({
            bookshelfId,
            title: bookshelfId.charAt(0).toUpperCase() + bookshelfId.slice(1),
            activities: [
              { activityId: `${bookshelfId}-1`, emoji: '📝', title: 'Activity 1' },
              { activityId: `${bookshelfId}-2`, emoji: '💭', title: 'Activity 2' },
              { activityId: `${bookshelfId}-3`, emoji: '🎯', title: 'Activity 3' },
              { activityId: `${bookshelfId}-4`, emoji: '✨', title: 'Activity 4' },
              { activityId: `${bookshelfId}-5`, emoji: '🌱', title: 'Activity 5' },
              { activityId: `${bookshelfId}-6`, emoji: '💪', title: 'Activity 6' }
            ]
          });
          await placeholderWorkbook.save();
          workbook = placeholderWorkbook.toObject();
        }

        // Tag-based activity resolution: if workbook has tagFilters, resolve activities by tags
        if (workbook.tagFilters && (workbook.tagFilters.conditions?.length || workbook.tagFilters.themes?.length)) {
          const tagQuery = { $or: [] };
          if (workbook.tagFilters.conditions?.length) {
            tagQuery.$or.push({ 'tags.conditions': { $in: workbook.tagFilters.conditions } });
          }
          if (workbook.tagFilters.themes?.length) {
            tagQuery.$or.push({ 'tags.themes': { $in: workbook.tagFilters.themes } });
          }

          const matchedActivities = await WorkbookActivity.find(tagQuery)
            .select('activityId title emoji')
            .lean();

          if (matchedActivities.length > 0) {
            workbook.activities = matchedActivities.map(a => ({
              activityId: a.activityId,
              emoji: a.emoji || '📝',
              title: a.title
            }));
          }
        }

        // Get user's progress if logged in
        let progress = [];
        if (sessionId) {
          const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
          if (account) {
            // Get progress for all matched activity IDs
            const activityIds = (workbook.activities || []).map(a => a.activityId);
            progress = await WorkbookProgress.find({
              accountId: account._id,
              activityId: { $in: activityIds }
            }).lean();
          }
        }

        return {
          success: true,
          data: {
            workbook,
            progress
          }
        };
      }
    },

    /**
     * Load a specific activity with its steps
     */
    'workbook:activity:load': {
      validate: (data) => {
        const { activityId } = data;
        if (!activityId) {
          return { valid: false, error: 'Missing activityId' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { activityId, sessionId } = data;
        const instanceId = safeInstanceId(data.instanceId);

        // Find activity
        let activity = await WorkbookActivity.findOne({ activityId }).lean();

        // If activity doesn't exist, create a placeholder
        if (!activity) {
          // Need to find the workbook first
          const bookshelfId = activityId.split('-')[0];
          let workbook = await Workbook.findOne({ bookshelfId });

          if (!workbook) {
            return { success: false, error: 'Workbook not found' };
          }

          const placeholderActivity = new WorkbookActivity({
            activityId,
            workbookId: workbook._id,
            title: `Activity ${activityId.split('-')[1] || '1'}`,
            steps: [
              {
                stepId: `${activityId}-step-1`,
                type: 'text',
                prompt: 'How are you feeling right now?',
                options: null
              },
              {
                stepId: `${activityId}-step-2`,
                type: 'checkbox',
                prompt: 'Which of these resonate with you?',
                options: ['Option A', 'Option B', 'Option C', 'Option D']
              },
              {
                stepId: `${activityId}-step-3`,
                type: 'text',
                prompt: 'What would you like to explore further?',
                options: null
              }
            ]
          });
          await placeholderActivity.save();
          activity = placeholderActivity.toObject();
        }

        // Get user's progress if logged in. If instanceId is provided, return
        // that specific instance; otherwise progress is null (caller will create
        // a new instance via workbook:activity:start).
        let progress = null;
        if (sessionId && instanceId) {
          const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
          if (account) {
            progress = await WorkbookProgress.findOne({
              _id: instanceId,
              accountId: account._id,
              activityId
            }).lean();
          }
        }

        return {
          success: true,
          data: {
            activity,
            progress
          }
        };
      }
    },

    /**
     * Start an activity. With `instanceId`, resumes that specific in-progress
     * instance. Without it, ALWAYS creates a new instance — the user can have
     * many in-progress instances and many completed instances of the same
     * activity. Returns the instance _id so subsequent step/complete calls can
     * target it.
     */
    'workbook:activity:start': {
      validate: (data) => {
        const { sessionId, activityId } = data;
        if (!sessionId || !activityId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, activityId } = data;
        const instanceId = safeInstanceId(data.instanceId);

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const activity = await WorkbookActivity.findOne({ activityId });
        if (!activity) {
          return { success: false, error: 'Activity not found' };
        }

        let progress;
        if (instanceId) {
          progress = await WorkbookProgress.findOne({
            _id: instanceId,
            accountId: account._id,
            activityId
          });
          if (!progress) {
            return { success: false, error: 'Instance not found' };
          }
        } else {
          progress = new WorkbookProgress({
            accountId: account._id,
            workbookId: activity.workbookId,
            activityId,
            completedSteps: [],
            stepData: new Map(),
            status: 'in-progress'
          });
        }

        progress.lastAccessedAt = new Date();
        await progress.save();

        return {
          success: true,
          data: {
            progress: progress.toObject(),
            instanceId: progress._id.toString()
          }
        };
      }
    },

    /**
     * Persistence concept: every state change in the activity (every input
     * tweak, every chip toggle, every step navigation) is written to the
     * instance via `workbook:state:save`. `workbook:step:complete` then
     * additionally marks a step as completed when the user clicks Next.
     *
     * Persist a draft of the activity state — the full stepData snapshot plus
     * the user's current step index. Does NOT mark any step as completed.
     * Idempotent: safe to call as often as needed (debounce on the client).
     */
    'workbook:state:save': {
      validate: (data) => {
        if (!data.sessionId || !data.activityId) {
          return { valid: false, error: 'Missing sessionId or activityId' };
        }
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, activityId } = data;
        const instanceId = safeInstanceId(data.instanceId);
        if (!instanceId) return { success: false, error: 'Invalid instanceId' };

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) return { success: false, error: 'Account not found' };

        const progress = await WorkbookProgress.findOne({
          _id: instanceId,
          accountId: account._id,
          activityId
        });
        if (!progress) return { success: false, error: 'Instance not found' };

        if (data.stepData && typeof data.stepData === 'object') {
          progress.stepData = new Map(Object.entries(data.stepData));
        }
        if (typeof data.currentStepIndex === 'number' && data.currentStepIndex >= 0) {
          progress.currentStepIndex = data.currentStepIndex;
        }
        progress.lastAccessedAt = new Date();
        await progress.save();
        return { success: true };
      }
    },

    /**
     * Save step data and mark step as complete on a specific instance.
     * Falls back to most-recent in-progress instance if instanceId is missing
     * (transitional — frontend should always pass it).
     */
    'workbook:step:complete': {
      validate: (data) => {
        const { sessionId, activityId, stepId, stepData } = data;
        if (!sessionId || !activityId || !stepId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, activityId, stepId, stepData } = data;
        const instanceId = safeInstanceId(data.instanceId);

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        let progress;
        if (instanceId) {
          progress = await WorkbookProgress.findOne({ _id: instanceId, accountId: account._id, activityId });
        } else {
          progress = await WorkbookProgress.findOne({
            accountId: account._id,
            activityId,
            status: 'in-progress'
          }).sort({ lastAccessedAt: -1 });
        }

        if (!progress) {
          return { success: false, error: 'Progress not found. Start the activity first.' };
        }

        progress.stepData.set(stepId, stepData);

        if (!progress.completedSteps.includes(stepId)) {
          progress.completedSteps.push(stepId);
        }

        progress.lastAccessedAt = new Date();
        await progress.save();

        context.socket.emit('workbook:progress:updated', {
          activityId,
          stepId,
          progress: progress.toObject()
        });

        return {
          success: true,
          data: {
            progress: progress.toObject(),
            instanceId: progress._id.toString()
          }
        };
      }
    },

    /**
     * Mark an instance as complete + auto-write a HistoryEntry capturing the
     * full snapshot, headline mood (post → pre fallback), and summary fields
     * (mood-before/after delta + journal reflection).
     */
    'workbook:activity:complete': {
      validate: (data) => {
        const { sessionId, activityId } = data;
        if (!sessionId || !activityId) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, activityId } = data;
        const instanceId = safeInstanceId(data.instanceId);

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        let progress;
        if (instanceId) {
          progress = await WorkbookProgress.findOne({ _id: instanceId, accountId: account._id, activityId });
        } else {
          progress = await WorkbookProgress.findOne({
            accountId: account._id,
            activityId,
            status: 'in-progress'
          }).sort({ lastAccessedAt: -1 });
        }

        if (!progress) {
          return { success: false, error: 'Progress not found' };
        }

        progress.status = 'completed';
        progress.lastAccessedAt = new Date();
        await progress.save();

        // Auto-write a HistoryEntry for the diary surface.
        try {
          const activity = await WorkbookActivity.findOne({ activityId });
          const stepData = progress.stepData instanceof Map
            ? Object.fromEntries(progress.stepData)
            : (progress.stepData || {});
          const preMood = findBindValue(stepData, 'pre_mood');
          const postMood = findBindValue(stepData, 'post_mood');
          const journal = findBindValue(stepData, 'journal');

          await HistoryEntry.create({
            accountId: account._id,
            artifactDomain: 'workbook-activity',
            sourceActivityId: activityId,
            titleOrTheme: activity ? activity.title : activityId,
            artifactSnapshot: stepData,
            moodRating: postMood ?? preMood ?? null,
            summaryFields: buildSummaryFields({ preMood, postMood, journal }),
            savedAt: new Date()
          });
        } catch (err) {
          // Non-fatal: completion still succeeds even if history write fails.
          console.error('[workbook:activity:complete] history write error:', err);
        }

        context.socket.emit('workbook:activity:completed', {
          activityId,
          progress: progress.toObject()
        });

        return {
          success: true,
          message: 'Activity completed!',
          data: {
            progress: progress.toObject()
          }
        };
      }
    },

    /**
     * List in-progress instances of a specific activity for the resume picker.
     * Returns each instance's _id, lastAccessedAt, and step progress.
     */
    'workbook:activity:list-instances': {
      validate: (data) => {
        if (!data.sessionId || !data.activityId) {
          return { valid: false, error: 'Missing sessionId or activityId' };
        }
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, activityId } = data;
        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) return { success: true, data: [] };

        // Returns BOTH in-progress and completed instances so the picker can
        // surface "Start fresh → resume → completed" all on one surface.
        const [activity, instances] = await Promise.all([
          WorkbookActivity.findOne({ activityId }).lean(),
          WorkbookProgress.find({
            accountId: account._id,
            activityId,
            status: { $in: ['in-progress', 'completed'] }
          }).sort({ lastAccessedAt: -1 }).lean()
        ]);

        const totalSteps = activity && Array.isArray(activity.steps) ? activity.steps.length : null;

        return {
          success: true,
          data: instances.map(p => ({
            instanceId: p._id.toString(),
            activityId: p.activityId,
            status: p.status,
            stepsCompleted: Array.isArray(p.completedSteps) ? p.completedSteps.length : 0,
            totalSteps,
            lastAccessedAt: p.lastAccessedAt
          }))
        };
      }
    },

    /**
     * List ALL in-progress instances across all activities — feeds the diary's
     * "In progress" section. Joined with WorkbookActivity for title/emoji.
     */
    'workbook:progress:in-progress': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'Missing sessionId' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId } = data;
        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) return { success: true, data: [] };

        const instances = await WorkbookProgress.find({
          accountId: account._id,
          status: 'in-progress'
        }).sort({ lastAccessedAt: -1 }).lean();

        const activityIds = [...new Set(instances.map(i => i.activityId))];
        const activities = await WorkbookActivity.find({
          activityId: { $in: activityIds }
        }).lean();
        const activityMap = new Map(activities.map(a => [a.activityId, a]));

        return {
          success: true,
          data: instances.map(p => {
            const a = activityMap.get(p.activityId);
            return {
              instanceId: p._id.toString(),
              activityId: p.activityId,
              activityTitle: a ? a.title : p.activityId,
              activityEmoji: a ? a.emoji : null,
              stepsCompleted: Array.isArray(p.completedSteps) ? p.completedSteps.length : 0,
              totalSteps: a && Array.isArray(a.steps) ? a.steps.length : null,
              lastAccessedAt: p.lastAccessedAt
            };
          })
        };
      }
    },

    /**
     * Get all progress for a user
     */
    'workbook:progress:get': {
      validate: (data) => {
        const { sessionId } = data;
        if (!sessionId) {
          return { valid: false, error: 'Missing sessionId' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, workbookId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const query = { accountId: account._id };
        if (workbookId) {
          query.workbookId = workbookId;
        }

        const progress = await WorkbookProgress.find(query).lean();

        return {
          success: true,
          data: {
            progress
          }
        };
      }
    },

    /**
     * Mid-step write-through for primitives that target platform stores.
     * Routes to mood / hopeChest / history flows so a primitive inside an
     * activity can fire `mood:write` etc. without leaving the workbook flow.
     */
    'workbook:component:write-through': {
      validate: (data) => {
        if (!data?.sessionId) return { valid: false, error: 'Missing sessionId' };
        if (!data?.target) return { valid: false, error: 'Missing target' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, target, payload, sourceActivityId } = data;
        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) return { success: false, error: 'Account not found' };

        try {
          if (target === 'mood') {
            const MoodEntry = require('../models/MoodEntry');
            const entry = await MoodEntry.create({
              accountId: account._id,
              moodValue: payload.moodValue,
              sourceActivityId: sourceActivityId || payload.sourceActivityId || null,
              sourceSaveEvent: payload.sourceSaveEvent || null
            });
            return { success: true, data: entry.toObject() };
          }
          if (target === 'hope-chest' || target === 'hopeChest') {
            const HopeChestEntry = require('../models/HopeChestEntry');
            const entry = await HopeChestEntry.create({
              accountId: account._id,
              content: payload.content,
              sourcePrototypeId: sourceActivityId || payload.sourcePrototypeId || null,
              sourceFieldRef: payload.sourceFieldRef || null
            });
            return { success: true, data: entry.toObject() };
          }
          if (target === 'history') {
            const HistoryEntry = require('../models/HistoryEntry');
            const entry = await HistoryEntry.create({
              accountId: account._id,
              artifactDomain: payload.artifactDomain,
              artifactSnapshot: payload.artifactSnapshot ?? null,
              sourceActivityId: sourceActivityId || payload.sourceActivityId || null,
              moodRating: payload.moodRating ?? null,
              titleOrTheme: payload.titleOrTheme || null,
              summaryFields: payload.summaryFields ?? null,
              referentDate: payload.referentDate ? new Date(payload.referentDate) : null
            });
            return { success: true, data: entry.toObject() };
          }
          if (target === 'safety-plan') {
            // Deferred per plan — log only.
            console.log('[workbook:component:write-through] safety-plan (deferred):', payload);
            return { success: true, data: { deferred: true } };
          }
          return { success: false, error: `Unknown write-through target: ${target}` };
        } catch (err) {
          console.error('Write-through error:', err);
          return { success: false, error: err.message };
        }
      }
    }
  }
};
