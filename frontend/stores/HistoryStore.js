import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class HistoryStore {
  entries = [];
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromServer() {
    if (!SessionStore.sessionId) return;
    try {
      const data = await WebSocketService.emit('history:list', {
        sessionId: SessionStore.sessionId,
        limit: 50
      });
      this.entries = data || [];
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load history entries:', err);
    }
  }

  async write({ artifactDomain, artifactSnapshot, sourceActivityId, moodRating, titleOrTheme, summaryFields, referentDate }) {
    if (!SessionStore.sessionId) {
      throw new Error('No session');
    }
    const entry = await WebSocketService.emit('history:write', {
      sessionId: SessionStore.sessionId,
      artifactDomain,
      artifactSnapshot,
      sourceActivityId: sourceActivityId || null,
      moodRating: moodRating ?? null,
      titleOrTheme: titleOrTheme || null,
      summaryFields: summaryFields ?? null,
      referentDate: referentDate || null
    });
    this.entries.unshift(entry);
    return entry;
  }

  async byActivity(sourceActivityId, limit = 50) {
    if (!SessionStore.sessionId) return [];
    return WebSocketService.emit('history:byActivity', {
      sessionId: SessionStore.sessionId,
      sourceActivityId,
      limit
    });
  }

  forDomain(artifactDomain) {
    return this.entries.filter(e => e.artifactDomain === artifactDomain);
  }
}

const historyStore = new HistoryStore();
export default historyStore;
