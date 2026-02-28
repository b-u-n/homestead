import BazaarDrawingBoard from '../components/drops/BazaarDrawingBoard';
import BazaarAssetCatalog from '../components/drops/BazaarAssetCatalog';
import BazaarSubmit from '../components/drops/BazaarSubmit';
import BazaarMySubmissions from '../components/drops/BazaarMySubmissions';
import BazaarSubmissionDetail from '../components/drops/BazaarSubmissionDetail';
import BazaarStyleGuide from '../components/drops/BazaarStyleGuide';
import CopyrightConfirm from '../components/drops/CopyrightConfirm';

export const drawingBoardFlow = {
  name: 'drawingBoard',
  title: 'Drawing Board',
  startAt: 'drawingBoard:intro',

  drops: {
    'drawingBoard:intro': {
      component: BazaarDrawingBoard,
      input: {},
      output: {
        action: 'string',
        platformAssetId: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'browseAssets',
          goto: 'drawingBoard:assetCatalog'
        },
        {
          when: (output) => output.action === 'submitNew',
          goto: 'drawingBoard:submit'
        },
        {
          when: (output) => output.action === 'openMySubmissions',
          goto: 'drawingBoard:mySubmissions'
        },
        {
          when: (output) => output.action === 'openStyleGuide',
          goto: 'drawingBoard:styleGuide'
        }
      ]
    },

    'drawingBoard:assetCatalog': {
      component: BazaarAssetCatalog,
      title: 'Platform Assets',
      input: {},
      output: {
        action: 'string',
        platformAssetId: 'string',
        assetName: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'selectAsset',
          goto: 'drawingBoard:submit'
        },
        {
          when: (output) => output.action === 'back',
          goto: 'drawingBoard:intro'
        }
      ]
    },

    'drawingBoard:submit': {
      component: BazaarSubmit,
      title: (accumulatedData) => {
        const assetName = accumulatedData?.['drawingBoard:assetCatalog']?.assetName ||
                           accumulatedData?.['drawingBoard:assetPicker']?.assetName;
        return assetName ? 'Propose Update' : 'Submit New Art';
      },
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'submitted',
          goto: 'drawingBoard:mySubmissions'
        },
        {
          when: (output) => output.action === 'confirmCopyright',
          goto: 'drawingBoard:copyrightConfirm'
        },
        {
          when: (output) => output.action === 'replaceAsset',
          goto: 'drawingBoard:assetPicker'
        },
        {
          when: (output) => output.action === 'back',
          goto: 'drawingBoard:intro'
        }
      ]
    },

    'drawingBoard:copyrightConfirm': {
      component: CopyrightConfirm,
      title: 'Confirm Submission',
      depth: 1,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'submitted',
          goto: 'drawingBoard:mySubmissions'
        }
      ]
    },

    'drawingBoard:assetPicker': {
      component: BazaarAssetCatalog,
      title: 'Select Platform Asset',
      depth: 1,
      input: {},
      output: {
        action: 'string',
        platformAssetId: 'string',
        assetName: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'selectAsset',
          goto: 'drawingBoard:submit'
        }
      ]
    },

    'drawingBoard:mySubmissions': {
      component: BazaarMySubmissions,
      title: 'My Submissions',
      input: {},
      output: {
        action: 'string',
        itemId: 'string',
        itemTitle: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'viewSubmission',
          goto: 'drawingBoard:submissionDetail'
        },
        {
          when: (output) => output.action === 'back',
          goto: 'drawingBoard:intro'
        }
      ]
    },

    'drawingBoard:submissionDetail': {
      component: BazaarSubmissionDetail,
      title: (accumulatedData) => accumulatedData?.['drawingBoard:mySubmissions']?.itemTitle || 'Submission',
      depth: 1,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'drawingBoard:mySubmissions'
        }
      ]
    },

    'drawingBoard:styleGuide': {
      component: BazaarStyleGuide,
      title: 'Art Style Guide',
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'back',
          goto: 'drawingBoard:intro'
        }
      ]
    }
  }
};

export default drawingBoardFlow;
