import { makeAutoObservable, runInAction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../services/websocket';

const SOUND_SETTINGS_KEY = '@homestead:soundSettings';

class SoundSettingsStore {
  // User overrides: { soundKey: { volume?: number, enabled?: boolean } }
  settings = {};
  isLoading = false;
  isInitialized = false;

  constructor() {
    makeAutoObservable(this);
    this.rehydrate();
  }

  /**
   * Get effective volume for a sound (user override or default)
   * @param {string} soundKey - Sound key
   * @param {number} defaultVolume - Default volume from config
   * @returns {number} Effective volume
   */
  getVolume(soundKey, defaultVolume) {
    const override = this.settings[soundKey];
    if (override?.volume !== undefined) {
      return override.volume;
    }
    return defaultVolume;
  }

  /**
   * Check if a sound is enabled
   * @param {string} soundKey - Sound key
   * @returns {boolean} Whether sound is enabled (defaults to true)
   */
  isEnabled(soundKey) {
    const override = this.settings[soundKey];
    if (override?.enabled !== undefined) {
      return override.enabled;
    }
    return true;
  }

  /**
   * Get all settings for a sound
   * @param {string} soundKey - Sound key
   * @returns {Object|null} Settings override or null
   */
  getSettings(soundKey) {
    return this.settings[soundKey] || null;
  }

  /**
   * Update settings for a sound
   * @param {string} soundKey - Sound key
   * @param {Object} newSettings - { volume?: number, enabled?: boolean }
   */
  async updateSound(soundKey, newSettings) {
    // Update local state immediately
    runInAction(() => {
      if (!this.settings[soundKey]) {
        this.settings[soundKey] = {};
      }
      if (newSettings.volume !== undefined) {
        this.settings[soundKey].volume = newSettings.volume;
      }
      if (newSettings.enabled !== undefined) {
        this.settings[soundKey].enabled = newSettings.enabled;
      }
    });

    // Persist locally
    await this.persist();

    // Sync to server if connected
    try {
      if (WebSocketService.socket?.connected) {
        await this.syncSoundToServer(soundKey, this.settings[soundKey]);
      }
    } catch (error) {
      console.error('Failed to sync sound setting to server:', error);
    }
  }

  /**
   * Reset a sound to default settings
   * @param {string} soundKey - Sound key
   */
  async resetSound(soundKey) {
    runInAction(() => {
      delete this.settings[soundKey];
    });

    await this.persist();

    try {
      if (WebSocketService.socket?.connected) {
        WebSocketService.socket.emit('soundSettings:reset', { soundKey }, () => {});
      }
    } catch (error) {
      console.error('Failed to reset sound on server:', error);
    }
  }

  /**
   * Reset all sounds to defaults
   */
  async resetAll() {
    runInAction(() => {
      this.settings = {};
    });

    await this.persist();

    try {
      if (WebSocketService.socket?.connected) {
        WebSocketService.socket.emit('soundSettings:resetAll', {}, () => {});
      }
    } catch (error) {
      console.error('Failed to reset all sounds on server:', error);
    }
  }

  /**
   * Sync a single sound setting to server
   */
  async syncSoundToServer(soundKey, settings) {
    return new Promise((resolve, reject) => {
      WebSocketService.socket.emit('soundSettings:update', { soundKey, settings }, (response) => {
        if (response.success) {
          resolve(response.settings);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Load settings from server
   */
  async loadFromServer() {
    if (!WebSocketService.socket?.connected) return;

    return new Promise((resolve, reject) => {
      WebSocketService.socket.emit('soundSettings:get', {}, (response) => {
        if (response.success) {
          runInAction(() => {
            // Merge server settings with local (server takes precedence)
            this.settings = { ...this.settings, ...response.settings };
          });
          this.persist();
          resolve(response.settings);
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
      const jsonData = JSON.stringify(this.settings);

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(SOUND_SETTINGS_KEY, jsonData);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(SOUND_SETTINGS_KEY, jsonData);
      }
    } catch (error) {
      console.error('Error persisting sound settings:', error);
    }
  }

  /**
   * Rehydrate settings from local storage
   */
  async rehydrate() {
    try {
      let data;

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(SOUND_SETTINGS_KEY);
      } else if (Platform.OS !== 'web') {
        data = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        runInAction(() => {
          this.settings = parsed;
        });
      }
    } catch (error) {
      console.error('Error rehydrating sound settings:', error);
    } finally {
      runInAction(() => {
        this.isInitialized = true;
      });
    }
  }
}

export default new SoundSettingsStore();
