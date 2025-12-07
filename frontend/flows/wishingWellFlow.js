import WishingWellLanding from '../components/drops/WishingWellLanding';
import TippablePostsList from '../components/drops/TippablePostsList';
import CreateWishingWellPost from '../components/drops/CreateWishingWellPost';
import RespondToPost from '../components/drops/RespondToPost';

/**
 * Wishing Well Flow Definition
 *
 * Navigation flow:
 * landing -> view -> list -> respond
 * landing -> create -> list
 */
export const wishingWellFlow = {
  name: 'wishingWell',
  title: 'Wishing Well',
  startAt: 'wishingWell:landing',
  additionalOpenSound: 'wishingWell',

  drops: {
    'wishingWell:landing': {
      component: WishingWellLanding,
      input: {},
      output: {
        action: 'view' | 'create'
      },
      next: [
        {
          when: (output) => output.action === 'view',
          goto: 'wishingWell:list'
        },
        {
          when: (output) => output.action === 'create',
          goto: 'wishingWell:create'
        }
      ]
    },

    'wishingWell:list': {
      component: TippablePostsList,
      input: {},
      output: {
        action: 'back' | 'respond' | 'create',
        postId: 'string?'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'wishingWell:landing'
        },
        {
          when: (output) => output.action === 'create',
          goto: 'wishingWell:create'
        },
        {
          when: (output) => output.action === 'respond',
          goto: 'wishingWell:respond'
        }
      ]
    },

    'wishingWell:create': {
      component: CreateWishingWellPost,
      input: {},
      output: {
        action: 'back' | 'submitted'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'wishingWell:landing'
        },
        {
          when: (output) => output.action === 'submitted',
          goto: 'wishingWell:list'
        }
      ]
    },

    'wishingWell:respond': {
      component: RespondToPost,
      input: {
        postId: 'string' // From previous drop
      },
      output: {
        action: 'back'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'wishingWell:list'
        }
      ]
    }
  }
};

export default wishingWellFlow;
