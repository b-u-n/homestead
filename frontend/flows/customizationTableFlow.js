import CustomizationAssetPicker from '../components/drops/CustomizationAssetPicker';
import CustomizationItemPicker from '../components/drops/CustomizationItemPicker';
import CustomizationRevisionPicker from '../components/drops/CustomizationRevisionPicker';

export const customizationTableFlow = {
  name: 'customizationTable',
  title: 'Customization Table',
  startAt: 'customizationTable:assetPicker',

  drops: {
    'customizationTable:assetPicker': {
      component: CustomizationAssetPicker,
      input: {},
      output: {
        action: 'string',
        platformAssetId: 'string',
        assetName: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'selectAsset',
          goto: 'customizationTable:itemPicker'
        }
      ]
    },

    'customizationTable:itemPicker': {
      component: CustomizationItemPicker,
      title: (accumulatedData) => accumulatedData?.['customizationTable:assetPicker']?.assetName || 'Select Item',
      depth: 1,
      input: {},
      output: {
        action: 'string',
        shopItemId: 'string',
        itemTitle: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'selectItem',
          goto: 'customizationTable:revisionPicker'
        },
        {
          when: (output) => output.action === 'back',
          goto: 'customizationTable:assetPicker'
        }
      ]
    },

    'customizationTable:revisionPicker': {
      component: CustomizationRevisionPicker,
      title: (accumulatedData) => accumulatedData?.['customizationTable:itemPicker']?.itemTitle || 'Select Version',
      depth: 1,
      input: {},
      output: {
        action: 'string'
      },
      next: [
        {
          when: (output) => output.action === 'applied',
          goto: 'customizationTable:assetPicker'
        },
        {
          when: (output) => output.action === 'back',
          goto: 'customizationTable:itemPicker'
        }
      ]
    }
  }
};

export default customizationTableFlow;
