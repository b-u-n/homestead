import React from 'react';
import FlowEngine from './FlowEngine';
import { weepingWillowFlow } from '../flows/weepingWillowFlow';
import SessionStore from '../stores/SessionStore';

/**
 * WeepingWillow "Help Wanted" Component
 * Uses FlowEngine for multi-step workflow
 */
const WeepingWillow = ({ visible, onClose }) => {
  return (
    <FlowEngine
      flowDefinition={weepingWillowFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
    />
  );
};

export default WeepingWillow;
