import ModerationQueue from '../components/drops/ModerationQueue';
import ModerationReviewItem from '../components/drops/ModerationReviewItem';
import ModerationActionLog from '../components/drops/ModerationActionLog';

export const moderationFlow = {
  name: 'moderation',
  title: 'Moderation',
  startAt: 'moderation:queue',

  drops: {
    'moderation:queue': {
      component: ModerationQueue,
      input: {},
      output: {
        action: 'string',
        queueId: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'reviewItem',
          goto: 'moderation:reviewItem'
        },
        {
          when: (output) => output.action === 'viewActionLog',
          goto: 'moderation:actionLog'
        }
      ]
    },

    'moderation:reviewItem': {
      component: ModerationReviewItem,
      title: 'Review Item',
      depth: 1,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'moderation:queue'
        },
        {
          when: (output) => output.action === 'actioned',
          goto: 'moderation:queue'
        }
      ]
    },

    'moderation:actionLog': {
      component: ModerationActionLog,
      title: 'Action Log',
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'moderation:queue'
        }
      ]
    }
  }
};

export default moderationFlow;
