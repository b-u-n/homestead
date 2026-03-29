import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

// Portable types that show in the knapsack (must match backend itemHelpers.js)
const PORTABLE_TYPES = ['sketch', 'toy', 'emoji', 'spell'];

function isPortable(storeType) {
  return PORTABLE_TYPES.includes(storeType);
}

class InventoryStore {
  items = [];
  maxSlots = 20;
  isOpen = false;
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Load portable items from server
   */
  async loadFromServer() {
    if (!SessionStore.sessionId) return;
    try {
      const data = await WebSocketService.emit('knapsack:items:list', {
        sessionId: SessionStore.sessionId
      });
      this.items = data || [];
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }

  /**
   * Create a blank pixel sketch and add to inventory
   */
  async createPixelSketch(title = 'New Sketch') {
    try {
      const data = await WebSocketService.emit('knapsack:items:create', {
        sessionId: SessionStore.sessionId,
        storeType: 'sketch',
        title,
        itemData: {
          width: 32,
          height: 32,
          pixels: new Array(32 * 32).fill(null)
        }
      });
      this.items.push(data);
      return data;
    } catch (err) {
      console.error('Failed to create pixel sketch:', err);
      throw err;
    }
  }

  /**
   * Save/update item data on server
   */
  async saveItem(itemId, updates = {}) {
    try {
      const data = await WebSocketService.emit('knapsack:items:update', {
        sessionId: SessionStore.sessionId,
        itemId,
        ...updates,
      });
      // Update local item
      const index = this.items.findIndex(i => (i._id || i.id) === itemId);
      if (index !== -1) {
        this.items[index] = data;
      }
      return data;
    } catch (err) {
      console.error('Failed to save item:', err);
      throw err;
    }
  }

  /**
   * Delete an item from server and local list
   */
  async deleteItem(itemId) {
    try {
      await WebSocketService.emit('knapsack:items:remove', {
        sessionId: SessionStore.sessionId,
        itemId,
      });
      this.items = this.items.filter(i => (i._id || i.id) !== itemId);
    } catch (err) {
      console.error('Failed to delete item:', err);
      throw err;
    }
  }

  toggleInventory() {
    this.isOpen = !this.isOpen;
  }

  openInventory() {
    this.isOpen = true;
  }

  closeInventory() {
    this.isOpen = false;
  }

  get itemCount() {
    return this.items.length;
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  get isFull() {
    return this.items.length >= this.maxSlots;
  }

  getByType(storeType) {
    return this.items.filter(item => item.storeType === storeType);
  }

  get sketches() {
    return this.getByType('sketch');
  }

  reset() {
    this.items = [];
    this.loaded = false;
    this.isOpen = false;
  }
}

export default new InventoryStore();
