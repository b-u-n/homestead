import { makeAutoObservable, runInAction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../services/websocket';

const FONT_SETTINGS_KEY = '@homestead:fontSettings';

// Placeholder values - to be dialed in later
const ACCESSIBILITY_DEFAULTS = {
  fontSizeMultiplier: 1.25,
  fontColor: '#000000',
};

class FontSettingsStore {
  // Settings
  accessibilityMode = false;
  fontSizeMultiplier = 1.0;  // Range: 0.75 - 2.0
  fontColor = null;          // null = use default colors, or hex string

  isLoading = false;
  isInitialized = false;

  constructor() {
    makeAutoObservable(this);
    this.rehydrate();
  }

  /**
   * Get scaled font size
   * @param {number} baseSize - The base font size
   * @returns {number} Scaled font size
   */
  getScaledFontSize(baseSize) {
    return Math.round(baseSize * this.fontSizeMultiplier);
  }

  /**
   * Get effective font color
   * @param {string} defaultColor - The default color to use if no override
   * @returns {string} The effective font color
   */
  getFontColor(defaultColor) {
    return this.fontColor || defaultColor;
  }

  /**
   * Get scaled padding/margin value
   * @param {number} baseValue - The base padding/margin value
   * @returns {number} Scaled value
   */
  getScaledSpacing(baseValue) {
    return Math.round(baseValue * this.fontSizeMultiplier);
  }

  /**
   * Toggle accessibility mode
   * When enabled, sets font settings to accessibility-optimized values
   * User can still adjust values after toggling
   */
  async setAccessibilityMode(enabled) {
    runInAction(() => {
      this.accessibilityMode = enabled;
      if (enabled) {
        this.fontSizeMultiplier = ACCESSIBILITY_DEFAULTS.fontSizeMultiplier;
        this.fontColor = ACCESSIBILITY_DEFAULTS.fontColor;
      }
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Set font size multiplier
   * @param {number} multiplier - Value between 0.75 and 2.0
   */
  async setFontSizeMultiplier(multiplier) {
    const clamped = Math.max(0.75, Math.min(2.0, multiplier));
    runInAction(() => {
      this.fontSizeMultiplier = clamped;
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Set font color override
   * @param {string|null} color - Hex color string or null to use defaults
   */
  async setFontColor(color) {
    runInAction(() => {
      this.fontColor = color;
    });
    await this.persist();
    await this.syncToServer();
  }

  /**
   * Reset all settings to defaults
   */
  async reset() {
    runInAction(() => {
      this.accessibilityMode = false;
      this.fontSizeMultiplier = 1.0;
      this.fontColor = null;
    });
    await this.persist();

    try {
      if (WebSocketService.socket?.connected) {
        WebSocketService.socket.emit('fontSettings:resetAll', {}, () => {});
      }
    } catch (error) {
      console.error('Failed to reset font settings on server:', error);
    }
  }

  /**
   * Sync settings to server
   * Silently fails if not authenticated - settings will still be saved locally
   */
  async syncToServer() {
    try {
      if (WebSocketService.socket?.connected) {
        WebSocketService.socket.emit('fontSettings:update', {
          accessibilityMode: this.accessibilityMode,
          fontSizeMultiplier: this.fontSizeMultiplier,
          fontColor: this.fontColor,
        }, (response) => {
          if (response && !response.success && response.error !== 'Not authenticated') {
            console.error('Failed to sync font settings:', response.error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync font settings to server:', error);
    }
  }

  /**
   * Load settings from server
   */
  async loadFromServer() {
    if (!WebSocketService.socket?.connected) return;

    return new Promise((resolve, reject) => {
      WebSocketService.socket.emit('fontSettings:get', {}, (response) => {
        if (response.success) {
          runInAction(() => {
            if (response.accessibilityMode !== undefined) {
              this.accessibilityMode = response.accessibilityMode;
            }
            if (response.fontSizeMultiplier !== undefined) {
              this.fontSizeMultiplier = response.fontSizeMultiplier;
            }
            if (response.fontColor !== undefined) {
              this.fontColor = response.fontColor;
            }
          });
          this.persist();
          resolve({
            accessibilityMode: this.accessibilityMode,
            fontSizeMultiplier: this.fontSizeMultiplier,
            fontColor: this.fontColor,
          });
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
        accessibilityMode: this.accessibilityMode,
        fontSizeMultiplier: this.fontSizeMultiplier,
        fontColor: this.fontColor,
      });

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(FONT_SETTINGS_KEY, data);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(FONT_SETTINGS_KEY, data);
      }
    } catch (error) {
      console.error('Error persisting font settings:', error);
    }
  }

  /**
   * Rehydrate settings from local storage
   */
  async rehydrate() {
    try {
      let data;

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(FONT_SETTINGS_KEY);
      } else if (Platform.OS !== 'web') {
        data = await AsyncStorage.getItem(FONT_SETTINGS_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        runInAction(() => {
          if (parsed.accessibilityMode !== undefined) {
            this.accessibilityMode = parsed.accessibilityMode;
          }
          if (parsed.fontSizeMultiplier !== undefined) {
            this.fontSizeMultiplier = parsed.fontSizeMultiplier;
          }
          if (parsed.fontColor !== undefined) {
            this.fontColor = parsed.fontColor;
          }
        });
      }
    } catch (error) {
      console.error('Error rehydrating font settings:', error);
    } finally {
      runInAction(() => {
        this.isInitialized = true;
      });
    }
  }

  /**
   * Get accessibility defaults for reference
   */
  getAccessibilityDefaults() {
    return { ...ACCESSIBILITY_DEFAULTS };
  }
}

export default new FontSettingsStore();
