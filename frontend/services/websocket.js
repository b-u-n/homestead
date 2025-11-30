import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import AuthStore from '../stores/AuthStore';
import ProfileStore from '../stores/ProfileStore';
import RoomStore from '../stores/RoomStore';
import SessionStore from '../stores/SessionStore';
import SoundSettingsStore from '../stores/SoundSettingsStore';
import domain from '../utils/domain';

class WebSocketService {
  socket = null;

  connect() {
    this.socket = io(domain(), {
      transports: ['websocket']
    });

    this.socket.on('connect', async () => {
      console.log('Connected to server');

      // Load user profile if we have a session ID
      if (SessionStore.sessionId) {
        try {
          await this.loadUserProfile(SessionStore.sessionId);
        } catch (error) {
          console.error('Failed to load user profile on connect:', error);
        }
      }

      // Load sound settings from server
      try {
        await SoundSettingsStore.loadFromServer();
      } catch (error) {
        console.error('Failed to load sound settings on connect:', error);
      }
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

  // Emit and return full response (including socketId, roomId, etc.)
  emitRaw(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // User methods
  async loadUserProfile(sessionId) {
    try {
      const userProfile = await this.emit('user:get', { sessionId });

      // Update ProfileStore with the loaded data
      ProfileStore.setProfile({
        avatarUrl: userProfile.avatar,
        avatarColor: userProfile.avatarData?.color,
        username: userProfile.username,
        energy: userProfile.energy,
        maxEnergy: userProfile.maxEnergy,
        hearts: userProfile.hearts,
        maxHearts: userProfile.maxHearts,
        currentStatus: userProfile.currentStatus
      });

      return userProfile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
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

  // Layer methods
  async listLayers() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('layers:list', {}, (response) => {
        if (response.success) {
          resolve(response.layers);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async joinLayer(layerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('layers:join', { layerId }, (response) => {
        if (response.success) {
          resolve(response.layer);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async leaveLayer() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('layers:leave', {}, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async getCurrentLayer() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('layers:current', {}, (response) => {
        if (response.success) {
          resolve(response.layer);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async createLayer(layerData) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('layers:create', layerData, (response) => {
        if (response.success) {
          resolve(response.layer);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
}

export default new WebSocketService();