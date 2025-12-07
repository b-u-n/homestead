import WeepingWillowLanding from '../components/drops/WeepingWillowLanding';
import PostsList from '../components/drops/PostsList';
import CreateWeepingWillowPost from '../components/drops/CreateWeepingWillowPost';
import PostConfirmation from '../components/drops/PostConfirmation';
import RespondToPost from '../components/drops/RespondToPost';
import ViewPost from '../components/drops/ViewPost';

/**
 * Weeping Willow "Help Wanted" Flow Definition
 *
 * Navigation flow:
 * landing -> list -> respond -> list
 * landing -> create -> confirmation -> list
 *
 * Depth 0: Main modal (landing, list, create, confirmation, respond)
 */
export const weepingWillowFlow = {
  name: 'weepingWillow',
  title: 'Help Wanted',
  startAt: 'weepingWillow:landing',

  drops: {
    'weepingWillow:landing': {
      component: WeepingWillowLanding,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'view',
          goto: 'weepingWillow:list'
        },
        {
          when: (output) => output.action === 'create',
          goto: 'weepingWillow:create'
        }
      ]
    },

    'weepingWillow:list': {
      component: PostsList,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'weepingWillow:landing'
        },
        {
          when: (output) => output.action === 'create',
          goto: 'weepingWillow:create'
        },
        {
          when: (output) => output.action === 'respond',
          goto: 'weepingWillow:respond'
        }
      ]
    },

    'weepingWillow:create': {
      component: CreateWeepingWillowPost,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'weepingWillow:landing'
        },
        {
          when: (output) => output.action === 'submitted',
          goto: 'weepingWillow:confirmation'
        }
      ]
    },

    'weepingWillow:confirmation': {
      component: PostConfirmation,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'list',
          goto: 'weepingWillow:list'
        },
        {
          when: (output) => output.action === 'done',
          goto: null // Close the flow
        }
      ]
    },

    'weepingWillow:respond': {
      component: RespondToPost,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'weepingWillow:list'
        }
      ]
    },

    // ViewPost - for deep linking from notifications
    'weepingWillow:viewPost': {
      component: ViewPost,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'respond',
          goto: 'weepingWillow:respond'
        },
        {
          when: (output) => output.action === 'list',
          goto: 'weepingWillow:list'
        }
      ]
    }
  }
};

export default weepingWillowFlow;
