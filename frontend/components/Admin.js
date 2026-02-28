import React from 'react';
import FlowEngine from './FlowEngine';
import { adminFlow } from '../flows/adminFlow';
import SessionStore from '../stores/SessionStore';

const Admin = ({ visible, onClose }) => {
  return (
    <FlowEngine
      flowDefinition={adminFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
    />
  );
};

export default Admin;
