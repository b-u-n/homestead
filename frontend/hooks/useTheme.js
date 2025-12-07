import { useContext } from 'react';
import { FlowContext } from '../contexts/FlowContext';

// Lazy load ThemeStore to avoid circular dependency
let _themeStore = null;
const getThemeStore = () => {
  if (!_themeStore) {
    _themeStore = require('../stores/ThemeStore').default;
  }
  return _themeStore;
};

/**
 * Hook to get theme colors for MinkyPanel
 * @param {string} variant - Color variant (primary, secondary, purple, etc.)
 * @param {string} explicitColor - Explicit color override (takes precedence)
 * @returns {string} The effective overlay color
 */
export const useMinkyColor = (variant = 'primary', explicitColor = null) => {
  const flowContext = useContext(FlowContext);
  const flowName = flowContext?.flowName || null;

  // If explicit color is provided, use it
  if (explicitColor) {
    return explicitColor;
  }

  // Otherwise get from ThemeStore
  const themeStore = getThemeStore();
  return themeStore.getMinkyColor(flowName, variant);
};

/**
 * Hook to get theme colors for WoolButton
 * @param {string} variant - Button variant
 * @param {string} state - Button state ('default', 'hover', 'focused', 'inactive')
 * @returns {string} The effective overlay color
 */
export const useWoolColor = (variant = 'primary', state = 'default') => {
  const flowContext = useContext(FlowContext);
  const flowName = flowContext?.flowName || null;

  const themeStore = getThemeStore();
  return themeStore.getWoolColor(variant, state, flowName);
};

/**
 * Hook to get all wool button colors for a variant
 * @param {string} variant - Button variant
 * @returns {Object} { default, hover, focused, inactive }
 */
export const useWoolColors = (variant = 'primary') => {
  const flowContext = useContext(FlowContext);
  const flowName = flowContext?.flowName || null;

  const themeStore = getThemeStore();
  return {
    default: themeStore.getWoolColor(variant, 'default', flowName),
    hover: themeStore.getWoolColor(variant, 'hover', flowName),
    focused: themeStore.getWoolColor(variant, 'focused', flowName),
    inactive: themeStore.getWoolColor(variant, 'inactive', flowName),
  };
};

/**
 * Hook to get the current flow name from context
 * @returns {string|null} Flow name or null
 */
export const useFlowName = () => {
  const flowContext = useContext(FlowContext);
  return flowContext?.flowName || null;
};

export default {
  useMinkyColor,
  useWoolColor,
  useWoolColors,
  useFlowName,
};
