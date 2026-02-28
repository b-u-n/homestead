import AdminDashboard from '../components/drops/AdminDashboard';
import AdminReviewItem from '../components/drops/AdminReviewItem';
import AdminActionLog from '../components/drops/AdminActionLog';

export const adminFlow = {
  name: 'admin',
  title: 'Admin',
  startAt: 'admin:dashboard',

  drops: {
    'admin:dashboard': {
      component: AdminDashboard,
      input: {},
      output: {
        action: 'string',
        queueId: 'string',
        itemId: 'string',
        revisionIndex: 'number',
        tab: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'reviewItem',
          goto: 'admin:reviewItem'
        },
        {
          when: (output) => output.action === 'viewActionLog',
          goto: 'admin:actionLog'
        }
      ]
    },

    'admin:reviewItem': {
      component: AdminReviewItem,
      title: 'Review Item',
      depth: 1,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'admin:dashboard'
        },
        {
          when: (output) => output.action === 'actioned',
          goto: 'admin:dashboard'
        }
      ]
    },

    'admin:actionLog': {
      component: AdminActionLog,
      title: 'Full Action Log',
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'admin:dashboard'
        }
      ]
    }
  }
};

export default adminFlow;
