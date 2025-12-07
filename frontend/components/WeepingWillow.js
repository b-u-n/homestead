import React from 'react';
import FlowEngine from './FlowEngine';
import { weepingWillowFlow } from '../flows/weepingWillowFlow';
import SessionStore from '../stores/SessionStore';

/**
 * WeepingWillow "Help Wanted" Component
 * Uses FlowEngine for multi-step workflow
 *
 * @param {boolean} visible - Whether the flow is visible
 * @param {Function} onClose - Called when flow is closed
 * @param {string} startAt - Optional drop ID to start at (for deep linking)
 * @param {Object} initialParams - Optional params to pass to starting drop
 */
const WeepingWillow = ({ visible, onClose, startAt, initialParams }) => {
  return (
    <FlowEngine
      flowDefinition={weepingWillowFlow}
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

export default WeepingWillow;
