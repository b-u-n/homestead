import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class CustomizationStore {
  customizations = new Map();
  version = 0;

  constructor() {
    makeAutoObservable(this);
  }

  getOverrideUrl(platformAssetId) {
    const entry = this.customizations.get(platformAssetId);
    return entry?.contentUrl || null;
  }

  hasCustomization(platformAssetId) {
    return this.customizations.has(platformAssetId);
  }

  getCustomization(platformAssetId) {
    return this.customizations.get(platformAssetId) || null;
  }

  updateFromServer(array) {
    this.customizations.clear();
    for (const item of (array || [])) {
      this.customizations.set(item.platformAssetId, {
        shopItemId: item.shopItemId,
        revisionIndex: item.revisionIndex,
        contentUrl: item.contentUrl,
        itemTitle: item.itemTitle
      });
    }
    this.version++;
  }

  async loadFromServer() {
    try {
      const data = await WebSocketService.emit('bazaar:customization:list', {
        sessionId: SessionStore.sessionId
      });
      this.updateFromServer(data);
    } catch (error) {
      console.error('Failed to load customizations:', error);
    }
  }
}

export default new CustomizationStore();
