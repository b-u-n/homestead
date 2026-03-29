import PixelSketchEditor from '../components/drops/PixelSketchEditor';

export const pixelSketchFlow = {
  name: 'pixelSketch',
  title: 'Pixel Sketch',
  startAt: 'pixelSketch:editor',

  drops: {
    'pixelSketch:editor': {
      component: PixelSketchEditor,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'done',
          goto: null // close flow
        }
      ]
    }
  }
};
