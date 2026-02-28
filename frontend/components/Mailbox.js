import React from 'react';
import FlowEngine from './FlowEngine';
import { mailboxFlow } from '../flows/mailboxFlow';
import SessionStore from '../stores/SessionStore';

const Mailbox = ({ visible, onClose, startAt, initialParams }) => {
  return (
    <FlowEngine
      flowDefinition={mailboxFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
      startAt={startAt}
      initialParams={initialParams}
    />
  );
};

export default Mailbox;
