import PostsList from '../components/drops/PostsList';
import CreateWeepingWillowPost from '../components/drops/CreateWeepingWillowPost';
import RespondToPost from '../components/drops/RespondToPost';

/**
 * Weeping Willow "Help Wanted" Flow Definition
 *
 * Navigation flow:
 * list (landing) -> respond (view/reply to post)
 * list -> create -> list
 *
 * Only 3 drops:
 * 1. list - Landing page with posts, defaults to unresponded/oldest
 * 2. create - Form to create a new help request
 * 3. respond - View post and reply form
 */
export const weepingWillowFlow = {
  name: 'weepingWillow',
  title: 'Help Wanted',
  startAt: 'weepingWillow:list',

  drops: {
    'weepingWillow:list': {
      component: PostsList,
      depth: 0,
      next: [
        {
          when: (output) => output.action === 'create',
          goto: 'weepingWillow:create'
        },
        {
          when: (output) => output.action === 'viewPost',
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
          goto: 'weepingWillow:list'
        },
        {
          when: (output) => output.action === 'submitted',
          goto: 'weepingWillow:list'
        }
      ]
    },

    'weepingWillow:respond': {
      component: RespondToPost,
      depth: 0,
      backLabel: 'Help Board',
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'weepingWillow:list'
        }
      ]
    },

    // Alias for deep linking from notifications
    'weepingWillow:viewPost': {
      component: RespondToPost,
      depth: 0,
      backLabel: 'Help Board',
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'weepingWillow:list'
        }
      ]
    }
  }
};

export default weepingWillowFlow;
