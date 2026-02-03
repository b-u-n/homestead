import PositivityBoard from '../components/drops/PositivityBoard';
import ViewPost from '../components/drops/ViewPost';

/**
 * Wishing Well Flow Definition
 *
 * Simplified single-screen positivity board.
 * Two drops:
 *   board - Main single-screen board (start)
 *   viewPost - Notification deep link entry, navigates back to board
 */
export const wishingWellFlow = {
  name: 'wishingWell',
  title: 'Wishing Well',
  startAt: 'wishingWell:board',
  additionalOpenSound: 'wishingWell',

  drops: {
    'wishingWell:board': {
      component: PositivityBoard,
      depth: 0,
      next: []
    },

    'wishingWell:viewPost': {
      component: ViewPost,
      depth: 0,
      next: [
        { when: (o) => o.action === 'list', goto: 'wishingWell:board' },
        { when: (o) => o.action === 'respond', goto: 'wishingWell:board' },
        { when: true, goto: 'wishingWell:board' }
      ]
    }
  }
};

export default wishingWellFlow;
