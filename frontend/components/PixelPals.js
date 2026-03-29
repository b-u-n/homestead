import React from 'react';
import FlowEngine from './FlowEngine';
import { pixelPalsFlow } from '../flows/pixelPalsFlow';
import SessionStore from '../stores/SessionStore';

const PixelPals = ({ visible, onClose, startAt, initialParams, onBoardChange }) => {
  return (
    <FlowEngine
      flowDefinition={pixelPalsFlow}
      visible={visible}
      onClose={onClose}
      startAt={startAt}
      initialParams={initialParams}
      initialContext={{
        sessionId: SessionStore.sessionId,
        onBoardChange
      }}
    />
  );
};

export default PixelPals;
