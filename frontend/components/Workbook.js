import React, { useMemo } from 'react';
import FlowEngine from './FlowEngine';
import workbookFlow from '../flows/workbookFlow';
import SessionStore from '../stores/SessionStore';

/**
 * Workbook Component
 * Wrapper for the workbook flow engine with dynamic title
 */
const Workbook = ({ visible, onClose, bookshelfId, title = 'Workbook' }) => {
  // Create a modified flow definition with the dynamic title
  const flowWithTitle = useMemo(() => ({
    ...workbookFlow,
    title: title
  }), [title]);

  return (
    <FlowEngine
      flowDefinition={flowWithTitle}
      visible={visible}
      onClose={onClose}
      initialContext={{
        sessionId: SessionStore.sessionId,
        flowParams: {
          bookshelfId,
          title
        }
      }}
    />
  );
};

export default Workbook;
