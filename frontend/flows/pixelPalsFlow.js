import PixelPalsLanding from '../components/drops/PixelPalsLanding';
import PixelPalsCreate from '../components/drops/PixelPalsCreate';
import PixelPalsCanvas from '../components/drops/PixelPalsCanvas';

export const pixelPalsFlow = {
  name: 'pixelPals',
  size: 'fullscreen',
  startAt: 'pixelPals:landing',

  drops: {
    'pixelPals:landing': {
      component: PixelPalsLanding,
      input: {},
      output: {
        action: 'string',
        boardId: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'viewBoard',
          goto: 'pixelPals:canvas'
        },
        {
          when: (output) => output.action === 'createBoard',
          goto: 'pixelPals:create'
        }
      ]
    },

    'pixelPals:create': {
      component: PixelPalsCreate,
      depth: 1,
      size: 'medium',
      title: 'New Board',
      input: {},
      output: {
        action: 'string',
        boardId: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'created',
          goto: 'pixelPals:canvas'
        },
        {
          when: (output) => output.action === 'back',
          goto: 'pixelPals:landing'
        }
      ]
    },

    'pixelPals:canvas': {
      component: PixelPalsCanvas,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'pixelPals:landing'
        }
      ]
    }
  }
};
