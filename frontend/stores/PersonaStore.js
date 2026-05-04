import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class PersonaStore {
  currentPersonaId = 'neutral';
  availablePersonaIds = ['warm', 'neutral', 'brisk', 'playful', 'clinical'];
  available = [];
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromServer() {
    if (!SessionStore.sessionId) {
      try {
        this.available = await WebSocketService.emit('persona:list', {});
      } catch {}
      return;
    }
    try {
      const [user, list] = await Promise.all([
        WebSocketService.emit('persona:get', { sessionId: SessionStore.sessionId }),
        WebSocketService.emit('persona:list', { sessionId: SessionStore.sessionId })
      ]);
      if (user) {
        this.currentPersonaId = user.currentPersonaId;
        this.availablePersonaIds = user.availablePersonaIds || this.availablePersonaIds;
      }
      this.available = list || [];
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load personas:', err);
    }
  }

  async set(personaId) {
    if (!SessionStore.sessionId) {
      this.currentPersonaId = personaId;
      return;
    }
    const result = await WebSocketService.emit('persona:set', {
      sessionId: SessionStore.sessionId,
      personaId
    });
    if (result) {
      this.currentPersonaId = result.currentPersonaId;
      this.availablePersonaIds = result.availablePersonaIds || this.availablePersonaIds;
    }
  }

  get currentPersona() {
    return this.available.find(p => p.id === this.currentPersonaId) || { id: this.currentPersonaId, label: this.currentPersonaId };
  }
}

const personaStore = new PersonaStore();
export default personaStore;
