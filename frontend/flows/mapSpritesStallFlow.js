import BazaarShop from '../components/drops/BazaarShop';
import BazaarItemDetail from '../components/drops/BazaarItemDetail';

export const mapSpritesStallFlow = {
  name: 'mapSpritesStall',
  title: 'Map Sprites',
  startAt: 'mapSpritesStall:shop',

  drops: {
    'mapSpritesStall:shop': {
      component: BazaarShop,
      input: {},
      output: {
        action: 'string',
        itemId: 'string',
        itemTitle: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'viewItem',
          goto: 'mapSpritesStall:itemDetail'
        }
      ]
    },

    'mapSpritesStall:itemDetail': {
      component: BazaarItemDetail,
      title: (accumulatedData) => accumulatedData?.['mapSpritesStall:shop']?.itemTitle || 'Item',
      depth: 1,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'mapSpritesStall:shop'
        }
      ]
    }
  }
};

export default mapSpritesStallFlow;
