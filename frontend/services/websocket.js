import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import AuthStore from '../stores/AuthStore';
import RoomStore from '../stores/RoomStore';
import domain from '../utils/domain';

class WebSocketService {
  socket = null;
  
  connect() {
    this.socket = io(domain(), {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // Auth methods
  async authenticateWithGoogle(googleToken) {
    try {
      const result = await this.emit('auth:google', { googleToken });
      AuthStore.setUser(result.user, result.token);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await this.emit('auth:logout', {});
      AuthStore.logout();
    } catch (error) {
      throw error;
    }
  }

  // Room methods
  async createRoom(roomData) {
    try {
      const room = await this.emit('room:create', roomData);
      RoomStore.addRoom(room);
      return room;
    } catch (error) {
      throw error;
    }
  }

  async getRooms() {
    try {
      const rooms = await this.emit('room:list', {});
      RoomStore.setRooms(rooms);
      return rooms;
    } catch (error) {
      throw error;
    }
  }

  async joinRoom(roomId) {
    try {
      await this.emit('room:join', { roomId });
      const room = await this.emit('room:get', { id: roomId });
      RoomStore.setCurrentRoom(room);
      return room;
    } catch (error) {
      throw error;
    }
  }

  async leaveRoom(roomId) {
    try {
      await this.emit('room:leave', { roomId });
      RoomStore.setCurrentRoom(null);
    } catch (error) {
      throw error;
    }
  }
}

export default new WebSocketService();