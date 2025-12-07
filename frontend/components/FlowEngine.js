import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Modal from './Modal';

/**
 * FlowEngine - A declarative workflow/navigation system
 *
 * Manages navigation between "drops" (screens/steps) within a flow.
 * Each drop produces output that determines the next drop.
 * Drops can have different depths - drops at the same depth share a modal,
 * while drops at higher depths render in stacked overlay modals.
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
 * @param {string} props.startAt - Override starting drop ID (for deep linking)
 * @param {Object} props.initialParams - Initial params to pass to the starting drop (for deep linking)
 */
const FlowEngine = ({ flowDefinition, visible, onClose, initialContext = {}, startAt, initialParams = {} }) => {
  // Determine the actual starting drop (override or default)
  const effectiveStartAt = startAt || flowDefinition.startAt;

  // Current drop ID at each depth: { 0: 'flow:landing', 1: 'flow:overlay' }
  const [dropsByDepth, setDropsByDepth] = useState({ 0: effectiveStartAt });

  // Navigation history per depth: { 0: ['landing', 'list'], 1: ['overlay'] }
  const [historyByDepth, setHistoryByDepth] = useState({ 0: [effectiveStartAt] });

  // Accumulated data from all drops
  const [accumulatedData, setAccumulatedData] = useState(initialParams);

  // Shared context
  const [context, setContext] = useState(initialContext);

  // Reset flow state when visibility changes
  useEffect(() => {
    if (visible) {
      const dropToStart = startAt || flowDefinition.startAt;
      setDropsByDepth({ 0: dropToStart });
      setHistoryByDepth({ 0: [dropToStart] });
      setAccumulatedData(initialParams || {});
      setContext({
        ...initialContext,
        flowName: flowDefinition.name,
        ...initialParams
      });
    }
  }, [visible, flowDefinition.startAt, startAt, initialContext, initialParams, flowDefinition.name]);

  /**
   * Find the next drop ID based on routing conditions
   */
  const findNextDrop = (routes, outputData, newAccumulatedData) => {
    if (!routes) return null;

    for (const route of routes) {
      const shouldNavigate = typeof route.when === 'function'
        ? route.when(outputData, newAccumulatedData, context)
        : route.when === true;

      if (shouldNavigate) {
        return route.goto;
      }
    }
    return null;
  };

  /**
   * Handle drop completion - navigate to next drop based on output
   */
  const handleDropComplete = (outputData, fromDepth) => {
    const currentDropId = dropsByDepth[fromDepth];
    const currentDrop = flowDefinition.drops[currentDropId];

    if (!currentDrop) {
      console.error(`Drop not found: ${currentDropId}`);
      return;
    }

    // Accumulate data
    const newAccumulatedData = {
      ...accumulatedData,
      [currentDropId]: outputData
    };
    setAccumulatedData(newAccumulatedData);

    // Find next drop
    const nextDropId = findNextDrop(currentDrop.next, outputData, newAccumulatedData);

    if (!nextDropId) {
      // No next drop - close the flow
      onClose(newAccumulatedData);
      return;
    }

    const nextDrop = flowDefinition.drops[nextDropId];
    if (!nextDrop) {
      console.error(`Next drop not found: ${nextDropId}`);
      return;
    }

    const nextDepth = nextDrop.depth ?? 0;

    if (nextDepth > fromDepth) {
      // DEEPER: Open new modal on top
      setDropsByDepth(prev => ({ ...prev, [nextDepth]: nextDropId }));
      setHistoryByDepth(prev => ({ ...prev, [nextDepth]: [nextDropId] }));

    } else if (nextDepth < fromDepth) {
      // SHALLOWER: Close current + higher modals, navigate at target depth
      setDropsByDepth(prev => {
        const filtered = {};
        for (const [d, id] of Object.entries(prev)) {
          if (Number(d) < fromDepth) filtered[d] = id;
        }
        filtered[nextDepth] = nextDropId;
        return filtered;
      });
      setHistoryByDepth(prev => {
        const filtered = {};
        for (const [d, hist] of Object.entries(prev)) {
          if (Number(d) < fromDepth) filtered[d] = hist;
        }
        filtered[nextDepth] = [...(filtered[nextDepth] || []), nextDropId];
        return filtered;
      });

    } else {
      // SAME DEPTH: Navigate within same modal
      setDropsByDepth(prev => ({ ...prev, [fromDepth]: nextDropId }));
      setHistoryByDepth(prev => ({
        ...prev,
        [fromDepth]: [...prev[fromDepth], nextDropId]
      }));
    }
  };

  /**
   * Go back at a specific depth
   */
  const goBackAtDepth = (depth) => {
    setHistoryByDepth(prev => {
      const history = prev[depth] || [];

      if (history.length > 1) {
        // Pop within this depth's history
        const newHistory = history.slice(0, -1);
        const previousDropId = newHistory[newHistory.length - 1];
        setDropsByDepth(prevDrops => ({ ...prevDrops, [depth]: previousDropId }));
        return { ...prev, [depth]: newHistory };

      } else if (depth > 0) {
        // No history at this depth - close this modal entirely
        closeDepth(depth);
        return prev;

      } else {
        // Depth 0 with no history - close the entire flow
        onClose();
        return prev;
      }
    });
  };

  /**
   * Close a modal at a specific depth (and all modals above it)
   */
  const closeDepth = (depth) => {
    setDropsByDepth(prev => {
      const filtered = {};
      for (const [d, id] of Object.entries(prev)) {
        if (Number(d) < depth) filtered[d] = id;
      }
      return filtered;
    });
    setHistoryByDepth(prev => {
      const filtered = {};
      for (const [d, hist] of Object.entries(prev)) {
        if (Number(d) < depth) filtered[d] = hist;
      }
      return filtered;
    });
  };

  /**
   * Update shared context
   */
  const updateContext = (updates) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  if (!visible) {
    return null;
  }

  // Sort depths and render a modal for each
  const sortedDepths = Object.keys(dropsByDepth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      {sortedDepths.map((depth) => {
        const dropId = dropsByDepth[depth];
        const drop = flowDefinition.drops[dropId];

        if (!drop) {
          console.error(`Drop not found: ${dropId}`);
          return null;
        }

        const DropComponent = drop.component;
        const history = historyByDepth[depth] || [];

        // Prepare input for the drop
        const dropInput = {
          ...(drop.input || {}),
          ...accumulatedData
        };

        return (
          <Modal
            key={depth}
            visible={true}
            zIndex={2000 + (depth * 100)}
            onClose={() => depth === 0 ? onClose() : closeDepth(depth)}
            onBack={() => goBackAtDepth(depth)}
            canGoBack={history.length > 1}
            showClose={drop.showClose !== false}
            title={drop.title || flowDefinition.title}
            size={drop.size}
            additionalOpenSound={depth === 0 ? flowDefinition.additionalOpenSound : undefined}
          >
            <View style={styles.container}>
              <DropComponent
                input={dropInput}
                context={context}
                updateContext={updateContext}
                accumulatedData={accumulatedData}
                onComplete={(output) => handleDropComplete(output, depth)}
                onBack={() => goBackAtDepth(depth)}
                canGoBack={history.length > 1}
                flowName={flowDefinition.name}
                dropId={dropId}
              />
            </View>
          </Modal>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FlowEngine;
