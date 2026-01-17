const Workbook = require('../models/Workbook');
const WorkbookActivity = require('../models/WorkbookActivity');
const WorkbookProgress = require('../models/WorkbookProgress');
const Account = require('../models/Account');

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

        // Get user's progress if logged in
        let progress = [];
        if (sessionId) {
          const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
          if (account) {
            progress = await WorkbookProgress.find({
              accountId: account._id,
              workbookId: workbook._id
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

        // Get user's progress if logged in
        let progress = null;
        if (sessionId) {
          const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
          if (account) {
            progress = await WorkbookProgress.findOne({
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
     * Start an activity - creates or retrieves progress record
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

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Find the activity to get workbookId
        const activity = await WorkbookActivity.findOne({ activityId });
        if (!activity) {
          return { success: false, error: 'Activity not found' };
        }

        // Find or create progress
        let progress = await WorkbookProgress.findOne({
          accountId: account._id,
          activityId
        });

        if (!progress) {
          progress = new WorkbookProgress({
            accountId: account._id,
            workbookId: activity.workbookId,
            activityId,
            completedSteps: [],
            stepData: new Map(),
            status: 'in-progress'
          });
          await progress.save();
        }

        // Update last accessed
        progress.lastAccessedAt = new Date();
        await progress.save();

        return {
          success: true,
          data: {
            progress: progress.toObject()
          }
        };
      }
    },

    /**
     * Save step data and mark step as complete
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

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        let progress = await WorkbookProgress.findOne({
          accountId: account._id,
          activityId
        });

        if (!progress) {
          return { success: false, error: 'Progress not found. Start the activity first.' };
        }

        // Save step data
        progress.stepData.set(stepId, stepData);

        // Mark step as completed if not already
        if (!progress.completedSteps.includes(stepId)) {
          progress.completedSteps.push(stepId);
        }

        progress.lastAccessedAt = new Date();
        await progress.save();

        // Emit progress update to user's other sessions
        context.socket.emit('workbook:progress:updated', {
          activityId,
          stepId,
          progress: progress.toObject()
        });

        return {
          success: true,
          data: {
            progress: progress.toObject()
          }
        };
      }
    },

    /**
     * Mark an activity as complete
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

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        const progress = await WorkbookProgress.findOne({
          accountId: account._id,
          activityId
        });

        if (!progress) {
          return { success: false, error: 'Progress not found' };
        }

        progress.status = 'completed';
        progress.lastAccessedAt = new Date();
        await progress.save();

        // Emit completion event
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
    }
  }
};
