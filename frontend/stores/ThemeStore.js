import { makeAutoObservable, runInAction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../services/websocket';

const THEME_SETTINGS_KEY = '@homestead:themeSettings';

/**
 * Default colors for MinkyPanel overlays
 */
const defaultMinkyColors = {
  primary: 'rgba(222, 134, 223, 0.25)',    // Pink (default)
  secondary: 'rgba(179, 230, 255, 0.25)',   // Blue
  purple: 'rgba(112, 68, 199, 0.2)',        // Purple
  green: 'rgba(110, 200, 130, 0.25)',       // Green
  coral: 'rgba(255, 160, 130, 0.25)',       // Coral
};

/**
 * Default colors for WoolButton variants
 * States: default, hover, focused (selected), inactive (disabled)
 */
const defaultWoolColors = {
  primary: {
    default: 'rgba(222, 134, 223, 0.25)',
    hover: 'rgba(222, 134, 223, 0.35)',
    focused: 'rgba(222, 134, 223, 0.4)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  secondary: {
    default: 'rgba(179, 230, 255, 0.25)',
    hover: 'rgba(179, 230, 255, 0.35)',
    focused: 'rgba(179, 230, 255, 0.4)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  purple: {
    default: 'rgba(78, 78, 188, 0.27)',
    hover: 'rgba(78, 78, 188, 0.38)',
    focused: 'rgba(78, 78, 188, 0.45)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  blue: {
    default: 'rgba(179, 230, 255, 0.25)',
    hover: 'rgba(179, 230, 255, 0.35)',
    focused: 'rgba(179, 230, 255, 0.4)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  green: {
    default: 'rgba(110, 200, 130, 0.32)',
    hover: 'rgba(110, 200, 130, 0.42)',
    focused: 'rgba(110, 200, 130, 0.5)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  coral: {
    default: 'rgba(255, 160, 130, 0.35)',
    hover: 'rgba(255, 160, 130, 0.45)',
    focused: 'rgba(255, 160, 130, 0.5)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  discord: {
    default: 'rgba(130, 140, 255, 0.35)',
    hover: 'rgba(130, 140, 255, 0.45)',
    focused: 'rgba(130, 140, 255, 0.5)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  blurple: {
    default: 'rgba(130, 140, 255, 0.35)',
    hover: 'rgba(130, 140, 255, 0.45)',
    focused: 'rgba(130, 140, 255, 0.5)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
};

/**
 * Flow-specific default themes
 */
const flowDefaults = {
  weepingWillow: {
    minkyColor: 'rgba(179, 230, 255, 0.25)',  // Blue
    woolVariant: 'blue',
  },
  wishingWell: {
    minkyColor: 'rgba(222, 134, 223, 0.25)',  // Pink
    woolVariant: 'primary',
  },
};

class ThemeStore {
  // Global settings
  globalSettings = {
    minkyColor: null,  // null = use default per context
    woolColors: {},    // variant -> { default?, selected?, hover? }
  };

  // Per-flow settings: { flowName: { enabled: boolean, minkyColor?: string, woolColors?: {} } }
  flowSettings = {};

  isLoading = false;
  isInitialized = false;

  constructor() {
    makeAutoObservable(this);
    this.rehydrate();
  }

  /**
   * Get effective minky panel color for a given context
   * @param {string} flowName - Flow name (optional)
   * @param {string} variant - Variant like 'primary', 'secondary', etc. (optional)
   * @returns {string} Effective overlay color
   */
  getMinkyColor(flowName = null, variant = 'primary') {
    // 1. Check flow-specific override if enabled
    if (flowName && this.flowSettings[flowName]?.enabled && this.flowSettings[flowName]?.minkyColor) {
      return this.flowSettings[flowName].minkyColor;
    }

    // 2. Check global override
    if (this.globalSettings.minkyColor) {
      return this.globalSettings.minkyColor;
    }

    // 3. Use flow default if exists
    if (flowName && flowDefaults[flowName]?.minkyColor) {
      return flowDefaults[flowName].minkyColor;
    }

    // 4. Fall back to variant default
    return defaultMinkyColors[variant] || defaultMinkyColors.primary;
  }

  /**
   * Get effective wool button color for a given state
   * @param {string} variant - Button variant
   * @param {string} state - 'default', 'hover', 'focused', or 'inactive'
   * @param {string} flowName - Flow name (optional)
   * @returns {string} Effective overlay color
   */
  getWoolColor(variant = 'primary', state = 'default', flowName = null) {
    // 1. Check flow-specific override if enabled
    if (flowName && this.flowSettings[flowName]?.enabled) {
      const flowWoolColors = this.flowSettings[flowName]?.woolColors?.[variant];
      if (flowWoolColors?.[state]) {
        return flowWoolColors[state];
      }
    }

    // 2. Check global override
    const globalWoolColors = this.globalSettings.woolColors?.[variant];
    if (globalWoolColors?.[state]) {
      return globalWoolColors[state];
    }

    // 3. Fall back to defaults
    const variantColors = defaultWoolColors[variant] || defaultWoolColors.primary;
    return variantColors[state] || variantColors.default;
  }

  /**
   * Get the default wool variant for a flow
   * @param {string} flowName - Flow name
   * @returns {string} Variant name
   */
  getFlowWoolVariant(flowName) {
    return flowDefaults[flowName]?.woolVariant || 'primary';
  }

  /**
   * Update global minky color
   * @param {string|null} color - Color string or null to reset
   */
  async setGlobalMinkyColor(color) {
    runInAction(() => {
      this.globalSettings.minkyColor = color;
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Update global wool button colors for a variant
   * @param {string} variant - Variant name
   * @param {Object} colors - { default?, selected?, hover? }
   */
  async setGlobalWoolColors(variant, colors) {
    runInAction(() => {
      if (!this.globalSettings.woolColors) {
        this.globalSettings.woolColors = {};
      }
      this.globalSettings.woolColors[variant] = {
        ...this.globalSettings.woolColors[variant],
        ...colors,
      };
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Enable/disable flow-specific theming
   * @param {string} flowName - Flow name
   * @param {boolean} enabled - Whether to enable
   */
  async setFlowEnabled(flowName, enabled) {
    runInAction(() => {
      if (!this.flowSettings[flowName]) {
        this.flowSettings[flowName] = { enabled: false };
      }
      this.flowSettings[flowName].enabled = enabled;
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Update flow-specific minky color
   * @param {string} flowName - Flow name
   * @param {string|null} color - Color string or null to reset
   */
  async setFlowMinkyColor(flowName, color) {
    runInAction(() => {
      if (!this.flowSettings[flowName]) {
        this.flowSettings[flowName] = { enabled: true };
      }
      this.flowSettings[flowName].minkyColor = color;
      this.flowSettings[flowName].enabled = true;
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Update flow-specific wool button colors
   * @param {string} flowName - Flow name
   * @param {string} variant - Variant name
   * @param {Object} colors - { default?, selected?, hover? }
   */
  async setFlowWoolColors(flowName, variant, colors) {
    runInAction(() => {
      if (!this.flowSettings[flowName]) {
        this.flowSettings[flowName] = { enabled: true, woolColors: {} };
      }
      if (!this.flowSettings[flowName].woolColors) {
        this.flowSettings[flowName].woolColors = {};
      }
      this.flowSettings[flowName].woolColors[variant] = {
        ...this.flowSettings[flowName].woolColors[variant],
        ...colors,
      };
      this.flowSettings[flowName].enabled = true;
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Reset flow settings
   * @param {string} flowName - Flow name
   */
  async resetFlow(flowName) {
    runInAction(() => {
      delete this.flowSettings[flowName];
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Reset all settings to defaults
   */
  async resetAll() {
    runInAction(() => {
      this.globalSettings = { minkyColor: null, woolColors: {} };
      this.flowSettings = {};
    });
    await this.persist();

    try {
      if (WebSocketService.socket?.connected) {
        WebSocketService.socket.emit('themeSettings:resetAll', {}, () => {});
      }
    } catch (error) {
      console.error('Failed to reset theme settings on server:', error);
    }
  }

  /**
   * Sync settings to server
   * Silently fails if not authenticated - settings will still be saved locally
   */
  async syncToServer() {
    try {
      if (WebSocketService.socket?.connected) {
        WebSocketService.socket.emit('themeSettings:update', {
          globalSettings: this.globalSettings,
          flowSettings: this.flowSettings,
        }, (response) => {
          // Silently ignore "Not authenticated" errors - local storage still works
          if (response && !response.success && response.error !== 'Not authenticated') {
            console.error('Failed to sync theme settings:', response.error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync theme settings to server:', error);
    }
  }

  /**
   * Load settings from server
   */
  async loadFromServer() {
    if (!WebSocketService.socket?.connected) return;

    return new Promise((resolve, reject) => {
      WebSocketService.socket.emit('themeSettings:get', {}, (response) => {
        if (response.success) {
          runInAction(() => {
            if (response.globalSettings) {
              this.globalSettings = { ...this.globalSettings, ...response.globalSettings };
            }
            if (response.flowSettings) {
              this.flowSettings = { ...this.flowSettings, ...response.flowSettings };
            }
          });
          this.persist();
          resolve({ globalSettings: this.globalSettings, flowSettings: this.flowSettings });
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Persist settings to local storage
   */
  async persist() {
    try {
      const data = JSON.stringify({
        globalSettings: this.globalSettings,
        flowSettings: this.flowSettings,
      });

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_SETTINGS_KEY, data);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(THEME_SETTINGS_KEY, data);
      }
    } catch (error) {
      console.error('Error persisting theme settings:', error);
    }
  }

  /**
   * Rehydrate settings from local storage
   */
  async rehydrate() {
    try {
      let data;

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(THEME_SETTINGS_KEY);
      } else if (Platform.OS !== 'web') {
        data = await AsyncStorage.getItem(THEME_SETTINGS_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        runInAction(() => {
          if (parsed.globalSettings) {
            this.globalSettings = parsed.globalSettings;
          }
          if (parsed.flowSettings) {
            this.flowSettings = parsed.flowSettings;
          }
        });
      }
    } catch (error) {
      console.error('Error rehydrating theme settings:', error);
    } finally {
      runInAction(() => {
        this.isInitialized = true;
      });
    }
  }

  /**
   * Get all default colors for reference
   */
  getDefaults() {
    return {
      minkyColors: defaultMinkyColors,
      woolColors: defaultWoolColors,
      flowDefaults,
    };
  }
}

export default new ThemeStore();
