import { makeAutoObservable } from 'mobx';

class InventoryStore {
  items = [];
  maxSlots = 20;
  isOpen = false;

  constructor() {
    makeAutoObservable(this);
    
    // Initialize with some sample items
    this.items = [
      { id: '1', name: 'Magic Wand', type: 'tool', icon: '🪄', quantity: 1, rarity: 'rare' },
      { id: '2', name: 'Health Potion', type: 'consumable', icon: '🧪', quantity: 3, rarity: 'common' },
      { id: '3', name: 'Golden Key', type: 'key', icon: '🗝️', quantity: 1, rarity: 'legendary' },
      { id: '4', name: 'Apple', type: 'food', icon: '🍎', quantity: 5, rarity: 'common' },
    ];
  }

  addItem(item) {
    const existingItem = this.items.find(i => i.id === item.id);
    
    if (existingItem && item.type === 'consumable') {
      existingItem.quantity += item.quantity || 1;
    } else if (this.items.length < this.maxSlots) {
      this.items.push({
        ...item,
        quantity: item.quantity || 1
      });
    } else {
      throw new Error('Inventory is full!');
    }
  }

  removeItem(itemId, quantity = 1) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return false;
    
    const item = this.items[itemIndex];
    
    if (item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      this.items.splice(itemIndex, 1);
    }
    
    return true;
  }

  useItem(itemId) {
    const item = this.items.find(item => item.id === itemId);
    
    if (!item) return false;
    
    if (item.type === 'consumable') {
      this.removeItem(itemId, 1);
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