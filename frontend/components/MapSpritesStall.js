import React from 'react';
import FlowEngine from './FlowEngine';
import { mapSpritesStallFlow } from '../flows/mapSpritesStallFlow';
import SessionStore from '../stores/SessionStore';

const MapSpritesStall = ({ visible, onClose }) => {
  return (
    <FlowEngine
      flowDefinition={mapSpritesStallFlow}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId
      }}
    />
  );
};

export default MapSpritesStall;
