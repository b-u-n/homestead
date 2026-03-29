import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class FeatureStore {
  featureLevel = 0;
  features = [];
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Load accessible features from server
   */
  async loadFromServer() {
    if (!SessionStore.sessionId) return;
    try {
      const data = await WebSocketService.emit('features:mine', {
        sessionId: SessionStore.sessionId
      });
      this.featureLevel = data.featureLevel || 0;
      this.features = data.features || [];
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load features:', err);
    }
  }

  /**
   * Check if the current user has access to a feature.
   * If features haven't loaded yet, returns false.
   */
  has(featureId) {
    return this.features.includes(featureId);
  }

  /**
   * Filter a list of feature IDs to only those the user has access to.
   */
  filter(featureIds) {
    return featureIds.filter(id => this.features.includes(id));
  }

  reset() {
    this.featureLevel = 0;
    this.features = [];
    this.loaded = false;
  }
}

export default new FeatureStore();
