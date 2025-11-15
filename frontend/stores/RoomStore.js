import { makeAutoObservable } from 'mobx';

class RoomStore {
  rooms = [];
  currentRoom = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setRooms(rooms) {
    this.rooms = rooms;
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  updateRoom(roomId, updates) {
    const index = this.rooms.findIndex(room => room.id === roomId);
    if (index !== -1) {
      this.rooms[index] = { ...this.rooms[index], ...updates };
    }
  }

  removeRoom(roomId) {
    this.rooms = this.rooms.filter(room => room.id !== roomId);
  }

  setCurrentRoom(room) {
    this.currentRoom = room;
  }

  setLoading(loading) {
    this.isLoading = loading;
  }
}

export default new RoomStore();