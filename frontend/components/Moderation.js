import React from 'react';
import FlowEngine from './FlowEngine';
import { moderationFlow } from '../flows/moderationFlow';
import SessionStore from '../stores/SessionStore';

const Moderation = ({ visible, onClose }) => {
  return (
    <FlowEngine
      flowDefinition={moderationFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
    />
  );
};

export default Moderation;
