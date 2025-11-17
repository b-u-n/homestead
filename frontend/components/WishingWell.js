import React from 'react';
import FlowEngine from './FlowEngine';
import { wishingWellFlow } from '../flows/wishingWellFlow';
import SessionStore from '../stores/SessionStore';

/**
 * WishingWell Component
 * Now uses FlowEngine for multi-step workflow
 */
const WishingWell = ({ visible, onClose }) => {
  return (
    <FlowEngine
      flowDefinition={wishingWellFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
    />
  );
};

export default WishingWell;
