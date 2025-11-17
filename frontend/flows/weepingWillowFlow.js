import WeepingWillowLanding from '../components/drops/WeepingWillowLanding';
import PostsList from '../components/drops/PostsList';
import CreateWeepingWillowPost from '../components/drops/CreateWeepingWillowPost';
import RespondToPost from '../components/drops/RespondToPost';

/**
 * Weeping Willow "Help Wanted" Flow Definition
 *
 * Navigation flow:
 * landing -> view -> list -> respond
 * landing -> create -> list
 */
export const weepingWillowFlow = {
  name: 'weepingWillow',
  title: 'Help Wanted',
  startAt: 'weepingWillow:landing',

  drops: {
    'weepingWillow:landing': {
      component: WeepingWillowLanding,
      input: {},
      output: {
        action: 'view' | 'create'
      },
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
      input: {},
      output: {
        action: 'back' | 'respond' | 'create',
        postId: 'string?'
      },
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
      input: {},
      output: {
        action: 'back' | 'submitted'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'weepingWillow:landing'
        },
        {
          when: (output) => output.action === 'submitted',
          goto: 'weepingWillow:list'
        }
      ]
    },

    'weepingWillow:respond': {
      component: RespondToPost,
      input: {
        postId: 'string' // From previous drop
      },
      output: {
        action: 'back' | 'submitted'
      },
      next: [
        {
          when: true, // Always go back to list
          goto: 'weepingWillow:list'
        }
      ]
    }
  }
};

export default weepingWillowFlow;
