import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Modal from './Modal';
import { FlowContext } from '../contexts/FlowContext';
import SoundManager from '../services/SoundManager';

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

  // Per-depth header content a drop can inject into the modal chrome — it
  // renders between the back and close buttons and replaces the title.
  // Mirrors the registerBackHandler pattern, but this is STATE (not a ref)
  // because it drives what the Modal renders. WorkbookActivity uses this to
  // hoist its step progress bar up into the navbar.
  const [headerContentByDepth, setHeaderContentByDepth] = useState({});

  // Per-depth drop-registered back handlers. When a drop registers one, the
  // modal-chrome back button delegates to it instead of popping flow history.
  // This lets drops with their own internal multi-step navigation (e.g.
  // WorkbookActivity) make the chrome Back behave like in-flow "Previous".
  // The drop is responsible for calling `onBack`/`onComplete` itself when its
  // internal state reaches a point where the flow should pop.
  const dropBackHandlersRef = useRef({});

  // Use refs for initialContext and initialParams so the reset effect
  // doesn't re-fire when parent re-renders with new object references
  const initialContextRef = useRef(initialContext);
  initialContextRef.current = initialContext;
  const initialParamsRef = useRef(initialParams);
  initialParamsRef.current = initialParams;

  // Reset flow state when visibility changes or startAt changes
  useEffect(() => {
    if (visible) {
      const dropToStart = startAt || flowDefinition.startAt;
      setDropsByDepth({ 0: dropToStart });
      setHistoryByDepth({ 0: [dropToStart] });
      setAccumulatedData(initialParamsRef.current || {});
      setContext({
        ...initialContextRef.current,
        flowName: flowDefinition.name,
        ...initialParamsRef.current
      });
      // Clear any drop-registered back handlers from a prior session.
      dropBackHandlersRef.current = {};
      // Clear any drop-injected header content from a prior session.
      setHeaderContentByDepth({});
    }
  }, [visible, flowDefinition.startAt, startAt, flowDefinition.name]);

  /**
   * Drops can register a node to render in the modal chrome's center slot
   * (between back and close), taking precedence over the title. Pass `null`
   * to clear. Keyed by depth so stacked modals don't clobber each other.
   */
  const registerHeaderContent = (depth, node) => {
    const nextNode = node ?? null;
    setHeaderContentByDepth(prev => {
      if (prev[depth] === nextNode) return prev;
      return { ...prev, [depth]: nextNode };
    });
  };

  /**
   * Drops can register a back handler that takes precedence over the default
   * flow-history pop. Pass `null` (or omit a handler) to unregister.
   * The drop must itself call the provided `onBack` callback (which pops flow
   * history) when its own back-state is exhausted (e.g. on first step).
   */
  const registerBackHandler = (depth, handler) => {
    if (handler) {
      dropBackHandlersRef.current[depth] = handler;
    } else {
      delete dropBackHandlersRef.current[depth];
    }
  };

  /**
   * Modal-chrome back: delegate to the drop's registered handler if any,
   * otherwise pop flow history at this depth.
   *
   * A registered handler may return `false` (or any falsy non-undefined value)
   * to signal "I can't handle this back press — fall back to popping the
   * flow's history at my depth". This lets a drop like WorkbookActivity
   * absorb back presses while it has internal steps to walk through, and
   * still hand the chrome back press off to the flow once its internal
   * back-state is exhausted (e.g. at step 0).
   */
  const handleModalBack = (depth) => {
    const dropHandler = dropBackHandlersRef.current[depth];
    if (typeof dropHandler === 'function') {
      const handled = dropHandler();
      if (handled !== false) return;
    }
    goBackAtDepth(depth);
  };

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

    // Play navigation sound
    SoundManager.play('nextPage');

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
      // SAME DEPTH: Navigate within same modal. If the FROM drop is marked
      // `passthrough: true` (e.g. a brief router/picker), REPLACE it in history
      // so back-navigation skips over it.
      const passthrough = currentDrop.passthrough === true;
      setDropsByDepth(prev => ({ ...prev, [fromDepth]: nextDropId }));
      setHistoryByDepth(prev => {
        const hist = prev[fromDepth] || [];
        const newHist = passthrough && hist.length > 0
          ? [...hist.slice(0, -1), nextDropId]
          : [...hist, nextDropId];
        return { ...prev, [fromDepth]: newHist };
      });
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
        // Play navigation sound
        SoundManager.play('nextPage');
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

  /**
   * Update accumulated data from within a drop (e.g. clearing a selected asset)
   */
  const updateAccumulatedData = (updates) => {
    setAccumulatedData(prev => ({ ...prev, ...updates }));
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

        // Custom back handler for drops with backLabel
        const customBackHandler = drop.backLabel ? () => {
          // Navigate to the list drop
          const listDropId = `${flowDefinition.name}:list`;
          setDropsByDepth(prev => ({ ...prev, [depth]: listDropId }));
          setHistoryByDepth(prev => ({
            ...prev,
            [depth]: [...prev[depth], listDropId]
          }));
          // Play navigation sound
          SoundManager.play('nextPage');
        } : undefined;

        return (
          <Modal
            key={depth}
            visible={true}
            zIndex={2000 + (depth * 100)}
            onClose={() => depth === 0 ? onClose() : closeDepth(depth)}
            onBack={() => handleModalBack(depth)}
            canGoBack={drop.showBack !== false && (history.length > 1 || depth > 0)}
            showClose={drop.showClose !== false}
            title={typeof drop.title === 'function' ? drop.title(accumulatedData) : (drop.title || flowDefinition.title)}
            headerContent={headerContentByDepth[depth]}
            size={drop.size || flowDefinition.size}
            additionalOpenSound={depth === 0 ? flowDefinition.additionalOpenSound : undefined}
            backLabel={drop.backLabel}
            onCustomBack={customBackHandler}
            scrollResetKey={dropId}
            scrollContent={drop.scrollContent !== false}
          >
            <FlowContext.Provider value={{ flowName: flowDefinition.name, dropId }}>
              <View style={styles.container}>
                <DropComponent
                  input={dropInput}
                  context={context}
                  updateContext={updateContext}
                  accumulatedData={accumulatedData}
                  updateAccumulatedData={updateAccumulatedData}
                  onComplete={(output) => handleDropComplete(output, depth)}
                  onBack={() => goBackAtDepth(depth)}
                  canGoBack={drop.showBack !== false && (history.length > 1 || depth > 0)}
                  registerBackHandler={(handler) => registerBackHandler(depth, handler)}
                  registerHeaderContent={(node) => registerHeaderContent(depth, node)}
                  flowName={flowDefinition.name}
                  dropId={dropId}
                />
              </View>
            </FlowContext.Provider>
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

// Re-export FlowContext for backwards compatibility
export { FlowContext } from '../contexts/FlowContext';
