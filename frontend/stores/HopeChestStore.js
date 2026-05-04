import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class HopeChestStore {
  entries = [];
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromServer() {
    if (!SessionStore.sessionId) return;
    try {
      const data = await WebSocketService.emit('hopeChest:list', {
        sessionId: SessionStore.sessionId,
        limit: 100
      });
      this.entries = data || [];
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load hope chest entries:', err);
    }
  }

  async write({ content, sourcePrototypeId, sourceFieldRef }) {
    if (!SessionStore.sessionId) {
      throw new Error('No session');
    }
    const entry = await WebSocketService.emit('hopeChest:write', {
      sessionId: SessionStore.sessionId,
      content,
      sourcePrototypeId: sourcePrototypeId || null,
      sourceFieldRef: sourceFieldRef || null
    });
    this.entries.unshift(entry);
    return entry;
  }
}

const hopeChestStore = new HopeChestStore();
export default hopeChestStore;
