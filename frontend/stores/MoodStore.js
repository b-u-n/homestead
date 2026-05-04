import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class MoodStore {
  entries = [];
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromServer() {
    if (!SessionStore.sessionId) return;
    try {
      const data = await WebSocketService.emit('mood:list', {
        sessionId: SessionStore.sessionId,
        limit: 100
      });
      this.entries = data || [];
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load mood entries:', err);
    }
  }

  async write({ moodValue, sourceActivityId, sourceSaveEvent }) {
    if (!SessionStore.sessionId) {
      throw new Error('No session');
    }
    const entry = await WebSocketService.emit('mood:write', {
      sessionId: SessionStore.sessionId,
      moodValue,
      sourceActivityId: sourceActivityId || null,
      sourceSaveEvent: sourceSaveEvent || null
    });
    this.entries.unshift(entry);
    return entry;
  }

  get latestValue() {
    return this.entries[0]?.moodValue ?? null;
  }
}

const moodStore = new MoodStore();
export default moodStore;
