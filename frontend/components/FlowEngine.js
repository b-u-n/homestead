import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Modal from './Modal';

/**
 * FlowEngine - A declarative workflow/navigation system
 *
 * Manages navigation between "drops" (screens/steps) within a flow
 * Each drop produces output that determines the next drop
 *
 * @param {Object} flowDefinition - The flow configuration
 * @param {string} flowDefinition.name - Flow namespace (e.g., 'wishingWell')
 * @param {string} flowDefinition.title - Display title for the modal
 * @param {string} flowDefinition.startAt - Initial drop ID (namespaced, e.g., 'wishingWell:landing')
 * @param {Object} flowDefinition.drops - Map of drop IDs to drop definitions
 * @param {Object} props
 * @param {boolean} props.visible - Whether the flow modal is visible
 * @param {Function} props.onClose - Called when flow is closed
 * @param {Object} props.initialContext - Initial context data passed to all drops
 */
const FlowEngine = ({ flowDefinition, visible, onClose, initialContext = {} }) => {
  const [currentDropId, setCurrentDropId] = useState(flowDefinition.startAt);
  const [flowHistory, setFlowHistory] = useState([flowDefinition.startAt]);
  const [accumulatedData, setAccumulatedData] = useState({});
  const [context, setContext] = useState(initialContext);

  // Reset flow state when visibility changes
  useEffect(() => {
    if (visible) {
      setCurrentDropId(flowDefinition.startAt);
      setFlowHistory([flowDefinition.startAt]);
      setAccumulatedData({});
      setContext({
        ...initialContext,
        flowName: flowDefinition.name
      });
    }
  }, [visible, flowDefinition.startAt, initialContext, flowDefinition.name]);

  const getCurrentDrop = () => {
    return flowDefinition.drops[currentDropId];
  };

  const handleDropComplete = (outputData) => {
    const currentDrop = getCurrentDrop();

    if (!currentDrop) {
      console.error(`Drop not found: ${currentDropId}`);
      return;
    }

    // Accumulate data from this drop
    const newAccumulatedData = {
      ...accumulatedData,
      [currentDropId]: outputData
    };
    setAccumulatedData(newAccumulatedData);

    // Find next drop based on output and next conditions
    let nextDropId = null;

    if (currentDrop.next) {
      for (const route of currentDrop.next) {
        // Evaluate condition
        const shouldNavigate = typeof route.when === 'function'
          ? route.when(outputData, newAccumulatedData, context)
          : route.when === true;

        if (shouldNavigate) {
          nextDropId = route.goto;
          break;
        }
      }
    }

    if (nextDropId) {
      navigateTo(nextDropId);
    } else {
      // No next drop found, complete the flow
      handleFlowComplete(newAccumulatedData);
    }
  };

  const navigateTo = (dropId) => {
    setCurrentDropId(dropId);
    setFlowHistory([...flowHistory, dropId]);
  };

  const goBack = () => {
    if (flowHistory.length > 1) {
      const newHistory = [...flowHistory];
      newHistory.pop(); // Remove current
      const previousDropId = newHistory[newHistory.length - 1];

      setFlowHistory(newHistory);
      setCurrentDropId(previousDropId);
    } else {
      // At the start, close the flow
      onClose();
    }
  };

  const handleFlowComplete = (finalData) => {
    // Flow is complete, close modal
    onClose(finalData);
  };

  const updateContext = (updates) => {
    setContext({ ...context, ...updates });
  };

  if (!visible) {
    return null;
  }

  const currentDrop = getCurrentDrop();

  if (!currentDrop) {
    console.error(`Drop not found: ${currentDropId}`);
    return null;
  }

  const DropComponent = currentDrop.component;

  // Prepare input for the drop
  const dropInput = {
    ...(currentDrop.input || {}),
    ...accumulatedData
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      onBack={goBack}
      canGoBack={flowHistory.length > 1}
      title={flowDefinition.title}
      additionalOpenSound={flowDefinition.additionalOpenSound}
    >
      <View style={styles.container}>
        <DropComponent
          input={dropInput}
          context={context}
          updateContext={updateContext}
          accumulatedData={accumulatedData}
          onComplete={handleDropComplete}
          onBack={goBack}
          canGoBack={flowHistory.length > 1}
          flowName={flowDefinition.name}
          dropId={currentDropId}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FlowEngine;
