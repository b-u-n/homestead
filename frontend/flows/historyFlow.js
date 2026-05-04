import HistoryLanding from '../components/drops/HistoryLanding';
import HistoryInstance from '../components/drops/HistoryInstance';
import WorkbookActivity from '../components/drops/WorkbookActivity';

/**
 * History Flow Definition (Diary)
 *
 * landing → instance (read-only detail)
 * landing → activity (resume an in-progress instance — same component as the
 *   workbook flow uses, so the back chevron returns to the diary cleanly).
 */
export const historyFlow = {
  name: 'history',
  title: 'Diary',
  startAt: 'history:landing',

  drops: {
    'history:landing': {
      component: HistoryLanding,
      input: {},
      next: [
        {
          when: (output) => output.action === 'openInstance',
          goto: 'history:instance'
        },
        {
          when: (output) => output.action === 'resumeActivity',
          goto: 'history:resume-activity'
        }
      ]
    },

    'history:instance': {
      component: HistoryInstance,
      depth: 1,
      title: (accumulatedData) => 'Past session',
      input: {}
    },

    'history:resume-activity': {
      component: WorkbookActivity,
      depth: 1,
      title: (accumulatedData) => accumulatedData?.['history:landing']?.activityTitle || 'Activity',
      input: {},
      next: [
        // Either action returns to the diary landing.
        { when: (output) => output.action === 'back', goto: 'history:landing' },
        { when: (output) => output.action === 'complete', goto: 'history:landing' }
      ]
    }
  }
};

export default historyFlow;
