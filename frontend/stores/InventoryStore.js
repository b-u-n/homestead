import { makeAutoObservable } from 'mobx';

class InventoryStore {
  items = [];
  maxSlots = 20;
  isOpen = false;

  constructor() {
    makeAutoObservable(this);

    // Initialize with some sample items
    this.items = [
      { itemId: 'magic-wand', uniqueId: 'wand-001', name: 'Magic Wand', type: 'tool', icon: '🪄', quantity: 1, rarity: 'rare', stackable: false },
      { itemId: 'health-potion', name: 'Health Potion', type: 'consumable', icon: '🧪', quantity: 3, rarity: 'common', stackable: true },
      { itemId: 'golden-key', uniqueId: 'key-123', name: 'Golden Key', type: 'key', icon: '🗝️', quantity: 1, rarity: 'legendary', stackable: false },
      { itemId: 'apple', name: 'Apple', type: 'food', icon: '🍎', quantity: 5, rarity: 'common', stackable: true },
    ];
  }

  addItem(item) {
    // Stackable items can be combined
    if (item.stackable) {
      const existingItem = this.items.find(i => i.itemId === item.itemId);

      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
        return;
      }
    }

    // Non-stackable or new stackable items get their own slot
    if (this.items.length < this.maxSlots) {
      this.items.push({
        ...item,
        quantity: item.quantity || 1,
        // Generate unique ID if not provided and item is not stackable
        uniqueId: item.uniqueId || (!item.stackable ? `${item.itemId}-${Date.now()}` : undefined)
      });
    } else {
      throw new Error('Inventory is full!');
    }
  }

  removeItem(itemId, quantity = 1, uniqueId = null) {
    let itemIndex;

    // If uniqueId provided, find that specific item
    if (uniqueId) {
      itemIndex = this.items.findIndex(item => item.uniqueId === uniqueId);
    } else {
      // Otherwise find by itemId
      itemIndex = this.items.findIndex(item => item.itemId === itemId);
    }

    if (itemIndex === -1) return false;

    const item = this.items[itemIndex];

    if (item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      this.items.splice(itemIndex, 1);
    }

    return true;
  }

  useItem(itemId, uniqueId = null) {
    const item = uniqueId
      ? this.items.find(item => item.uniqueId === uniqueId)
      : this.items.find(item => item.itemId === itemId);

    if (!item) return false;

    if (item.type === 'consumable') {
      this.removeItem(item.itemId, 1, item.uniqueId);
      return true;
    }

    return false;
  }

  moveItem(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.items.length) return;
    if (toIndex < 0 || toIndex >= this.maxSlots) return;
    
    const [movedItem] = this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, movedItem);
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

  get totalQuantity() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  get isFull() {
    return this.items.length >= this.maxSlots;
  }

  getItemsByType(type) {
    return this.items.filter(item => item.type === type);
  }
}

export default new InventoryStore();