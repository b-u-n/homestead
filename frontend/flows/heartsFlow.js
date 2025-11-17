import BankDrop from '../components/drops/BankDrop';

/**
 * Hearts Flow Definition
 *
 * Simple single-drop flow for the bank
 */
export const heartsFlow = {
  name: 'hearts',
  title: 'HEART BANK',
  startAt: 'hearts:bank',

  drops: {
    'hearts:bank': {
      component: BankDrop,
      input: {},
      output: {
        action: 'close'
      },
      next: [
        // No next drops - this is a terminal drop
      ]
    }
  }
};

export default heartsFlow;
