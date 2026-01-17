import WorkbookLanding from '../components/drops/WorkbookLanding';
import WorkbookActivity from '../components/drops/WorkbookActivity';

/**
 * Workbook Flow Definition
 *
 * Navigation flow:
 * landing (grid of activities) -> activity (multi-step form)
 * activity -> back to landing or complete
 */
export const workbookFlow = {
  name: 'workbook',
  title: 'Workbook',
  startAt: 'workbook:landing',

  drops: {
    'workbook:landing': {
      component: WorkbookLanding,
      input: {
        bookshelfId: 'string'
      },
      output: {
        action: 'selectActivity',
        activityId: 'string',
        bookshelfId: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'selectActivity',
          goto: 'workbook:activity'
        }
      ]
    },

    'workbook:activity': {
      component: WorkbookActivity,
      depth: 1, // Stacked modal on top of landing
      input: {
        activityId: 'string',
        bookshelfId: 'string'
      },
      output: {
        action: 'back' | 'complete'
      },
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
