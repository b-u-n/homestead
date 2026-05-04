import React from 'react';
import FlowEngine from './FlowEngine';
import historyFlow from '../flows/historyFlow';
import SessionStore from '../stores/SessionStore';

/**
 * Diary — wrapper for the history flow engine. Mirrors the Workbook wrapper.
 */
const Diary = ({ visible, onClose }) => (
  <FlowEngine
    flowDefinition={historyFlow}
    visible={visible}
    onClose={onClose}
    initialContext={{ sessionId: SessionStore.sessionId }}
  />
);

export default Diary;
