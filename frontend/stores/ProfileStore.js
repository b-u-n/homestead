import { makeAutoObservable, reaction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import domain, { resolveAvatarUrl } from '../utils/domain';

class ProfileStore {
  // User profile data
  avatarUrl = null;
  avatarColor = null;
  username = null;
  energy = 100;
  maxEnergy = 100;
  hearts = 9;
  maxHearts = 9;
  heartBank = 0;
  currentStatus = '';

  constructor() {
    makeAutoObservable(this);

    // Rehydrate from storage on init
    this.rehydrate();

    // Setup auto-save reaction
    this.setupAutoSave();
  }

  setProfile(profile) {
    if (profile.avatarUrl) this.avatarUrl = resolveAvatarUrl(profile.avatarUrl);
    if (profile.avatarColor) this.avatarColor = profile.avatarColor;
    if (profile.username) this.username = profile.username;
    if (profile.energy !== undefined) this.energy = profile.energy;
    if (profile.maxEnergy !== undefined) this.maxEnergy = profile.maxEnergy;
    if (profile.hearts !== undefined) this.hearts = profile.hearts;
    if (profile.maxHearts !== undefined) this.maxHearts = profile.maxHearts;
    if (profile.heartBank !== undefined) this.heartBank = profile.heartBank;
    if (profile.currentStatus !== undefined) this.currentStatus = profile.currentStatus;
  }

  setHearts(hearts) {
    this.hearts = Math.max(0, Math.min(this.maxHearts, hearts));
  }

  setHeartBank(heartBank) {
    this.heartBank = Math.max(0, heartBank);
  }

  async updateCurrentStatus(status, sessionId) {
    this.currentStatus = status;

    if (!sessionId) return;

    try {
      await fetch(`${domain()}/api/accounts/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          currentStatus: status
        })
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  updateEnergy(amount) {
    this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy + amount));
  }

  updateHearts(amount) {
    this.hearts = Math.max(0, Math.min(this.maxHearts, this.hearts + amount));
  }

  get energyPercentage() {
    return (this.energy / this.maxEnergy) * 100;
  }

  get heartsArray() {
    return Array.from({ length: this.maxHearts }, (_, i) => i < this.hearts);
  }

  /**
   * Persist profile data to storage
   */
  async persist() {
    try {
      const data = {
        avatarUrl: this.avatarUrl,
        avatarColor: this.avatarColor,
        username: this.username,
        energy: this.energy,
        maxEnergy: this.maxEnergy,
        hearts: this.hearts,
        maxHearts: this.maxHearts,
        heartBank: this.heartBank,
        currentStatus: this.currentStatus,
      };

      const jsonData = JSON.stringify(data);
      const key = '@homestead:profile';

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, jsonData);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(key, jsonData);
      }
    } catch (error) {
      console.error('Error persisting profile:', error);
    }
  }

  /**
   * Rehydrate profile data from storage
   */
  async rehydrate() {
    try {
      const key = '@homestead:profile';
      let data;

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(key);
      } else if (Platform.OS !== 'web') {
        data = await AsyncStorage.getItem(key);
      }

      if (data) {
        const parsed = JSON.parse(data);
        this.setProfile(parsed);
      }
    } catch (error) {
      console.error('Error rehydrating profile:', error);
    }
  }

  /**
   * Setup auto-save reaction
   * Automatically persists when profile data changes
   */
  setupAutoSave() {
    reaction(
      () => ({
        avatarUrl: this.avatarUrl,
        avatarColor: this.avatarColor,
        username: this.username,
        energy: this.energy,
        maxEnergy: this.maxEnergy,
        hearts: this.hearts,
        maxHearts: this.maxHearts,
        heartBank: this.heartBank,
        currentStatus: this.currentStatus,
      }),
      () => {
        this.persist();
      },
      { delay: 500 } // Debounce by 500ms
    );
  }
}

export default new ProfileStore();
