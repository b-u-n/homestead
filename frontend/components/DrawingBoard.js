import React from 'react';
import FlowEngine from './FlowEngine';
import { drawingBoardFlow } from '../flows/drawingBoardFlow';
import SessionStore from '../stores/SessionStore';

const DrawingBoard = ({ visible, onClose, startAt, initialParams }) => {
  return (
    <FlowEngine
      flowDefinition={drawingBoardFlow}
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

export default DrawingBoard;
