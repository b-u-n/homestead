import WorkbookLanding from '../components/drops/WorkbookLanding';
import WorkbookResumePicker from '../components/drops/WorkbookResumePicker';
import WorkbookActivity from '../components/drops/WorkbookActivity';

/**
 * Workbook Flow Definition
 *
 * landing → resume-picker → activity
 *  - resume-picker auto-skips to activity when there are no in-progress instances.
 *  - When skipped, it emits action: 'startFresh' (no instanceId).
 *  - When user picks an in-progress row, it emits action: 'resume' + instanceId.
 */
export const workbookFlow = {
  name: 'workbook',
  title: 'Workbook',
  startAt: 'workbook:landing',

  drops: {
    'workbook:landing': {
      component: WorkbookLanding,
      input: {},
      next: [
        {
          when: (output) => output.action === 'selectActivity',
          goto: 'workbook:resume-picker'
        }
      ]
    },

    'workbook:resume-picker': {
      component: WorkbookResumePicker,
      depth: 1,
      title: (accumulatedData) => accumulatedData?.['workbook:landing']?.activityTitle || 'Activity',
      input: {},
      next: [
        {
          when: (output) => output.action === 'resume' || output.action === 'startFresh',
          goto: 'workbook:activity'
        }
      ]
    },

    'workbook:activity': {
      component: WorkbookActivity,
      depth: 1, // Stays at depth 1 — picker is replaced by activity, not stacked.
      title: (accumulatedData) => accumulatedData?.['workbook:landing']?.activityTitle || 'Activity',
      input: {},
      // WorkbookActivity owns its own scroll so Prev/Next can sit OUTSIDE the
      // scroll as a pinned footer.
      scrollContent: false,
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'workbook:landing'
        },
        {
          when: (output) => output.action === 'complete',
          goto: 'workbook:landing'
        }
      ]
    }
  }
};

export default workbookFlow;
