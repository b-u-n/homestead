import MailboxList from '../components/drops/MailboxList';
import BazaarItemDetail from '../components/drops/BazaarItemDetail';

export const mailboxFlow = {
  name: 'mailbox',
  title: 'Mailbox',
  startAt: 'mailbox:list',

  drops: {
    'mailbox:list': {
      component: MailboxList,
      title: 'My Comments',
      input: {},
      next: [
        { when: (output) => output.action === 'viewItem', goto: 'mailbox:itemDetail' }
      ]
    },

    'mailbox:itemDetail': {
      component: BazaarItemDetail,
      title: (accumulatedData) => accumulatedData?.['mailbox:list']?.itemTitle || 'Item',
      depth: 1,
      input: {},
      next: [
        { when: (output) => output.action === 'back', goto: 'mailbox:list' }
      ]
    }
  }
};

export default mailboxFlow;
