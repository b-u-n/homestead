// Lazy load FontSettingsStore to avoid circular dependency
let _fontSettingsStore = null;
const getFontSettingsStore = () => {
  if (!_fontSettingsStore) {
    _fontSettingsStore = require('../stores/FontSettingsStore').default;
  }
  return _fontSettingsStore;
};

/**
 * Hook to get scaled font size based on user settings
 * @param {number} baseSize - The base font size in pixels
 * @returns {number} Scaled font size
 */
export const useFontSize = (baseSize) => {
  const fontSettingsStore = getFontSettingsStore();
  return fontSettingsStore.getScaledFontSize(baseSize);
};

/**
 * Hook to get effective font color
 * @param {string} defaultColor - The default color to use if no override
 * @returns {string} The effective font color
 */
export const useFontColor = (defaultColor) => {
  const fontSettingsStore = getFontSettingsStore();
  return fontSettingsStore.getFontColor(defaultColor);
};

/**
 * Hook to get scaled spacing (padding/margin)
 * @param {number} baseValue - The base spacing value
 * @returns {number} Scaled spacing value
 */
export const useScaledSpacing = (baseValue) => {
  const fontSettingsStore = getFontSettingsStore();
  return fontSettingsStore.getScaledSpacing(baseValue);
};

/**
 * Hook to get all font settings
 * @returns {Object} { fontSizeMultiplier, fontColor, accessibilityMode }
 */
export const useFontSettings = () => {
  const fontSettingsStore = getFontSettingsStore();
  return {
    fontSizeMultiplier: fontSettingsStore.fontSizeMultiplier,
    fontColor: fontSettingsStore.fontColor,
    accessibilityMode: fontSettingsStore.accessibilityMode,
    getScaledFontSize: (baseSize) => fontSettingsStore.getScaledFontSize(baseSize),
    getFontColor: (defaultColor) => fontSettingsStore.getFontColor(defaultColor),
    getScaledSpacing: (baseValue) => fontSettingsStore.getScaledSpacing(baseValue),
  };
};

export default {
  useFontSize,
  useFontColor,
  useScaledSpacing,
  useFontSettings,
};
