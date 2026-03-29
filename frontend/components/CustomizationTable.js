import React from 'react';
import FlowEngine from './FlowEngine';
import { customizationTableFlow } from '../flows/customizationTableFlow';
import SessionStore from '../stores/SessionStore';

const CustomizationTable = ({ visible, onClose }) => {
  return (
    <FlowEngine
      flowDefinition={customizationTableFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
    />
  );
};

export default CustomizationTable;
