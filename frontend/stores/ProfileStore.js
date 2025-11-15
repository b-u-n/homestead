import { makeAutoObservable } from 'mobx';
import domain from '../utils/domain';

class ProfileStore {
  // User profile data
  avatarUrl = null;
  username = null;
  energy = 100;
  maxEnergy = 100;
  hearts = 9;
  maxHearts = 9;
  currentStatus = '';

  constructor() {
    makeAutoObservable(this);
  }

  setProfile(profile) {
    if (profile.avatarUrl) this.avatarUrl = profile.avatarUrl;
    if (profile.username) this.username = profile.username;
    if (profile.energy !== undefined) this.energy = profile.energy;
    if (profile.maxEnergy !== undefined) this.maxEnergy = profile.maxEnergy;
    if (profile.hearts !== undefined) this.hearts = profile.hearts;
    if (profile.maxHearts !== undefined) this.maxHearts = profile.maxHearts;
    if (profile.currentStatus !== undefined) this.currentStatus = profile.currentStatus;
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
}

export default new ProfileStore();
