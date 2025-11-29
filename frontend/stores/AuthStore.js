import { makeAutoObservable } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileStore from './ProfileStore';

const AUTH_STORAGE_KEY = '@homestead:auth';

class AuthStore {
  user = null;
  token = null;
  isAuthenticated = false;
  isLoading = false;
  isInitialized = false;

  constructor() {
    makeAutoObservable(this);
    this.rehydrate();
  }

  setUser(user, token) {
    this.user = user;
    this.token = token;
    this.isAuthenticated = true;

    // Update ProfileStore with user data
    if (user) {
      ProfileStore.setProfile({
        avatarUrl: user.avatar,
        username: user.username,
      });
    }

    // Persist auth state
    this.persist();
  }

  logout() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    this.clearPersistedAuth();
  }

  setLoading(loading) {
    this.isLoading = loading;
  }

  /**
   * Persist auth data to storage
   */
  async persist() {
    try {
      const data = {
        user: this.user,
        token: this.token,
      };

      const jsonData = JSON.stringify(data);

      if (Platform.OS === 'web') {
        localStorage.setItem(AUTH_STORAGE_KEY, jsonData);
      } else {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, jsonData);
      }
    } catch (error) {
      console.error('Error persisting auth:', error);
    }
  }

  /**
   * Rehydrate auth data from storage
   */
  async rehydrate() {
    try {
      let data;

      if (Platform.OS === 'web') {
        data = localStorage.getItem(AUTH_STORAGE_KEY);
      } else {
        data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.user && parsed.token) {
          this.user = parsed.user;
          this.token = parsed.token;
          this.isAuthenticated = true;

          // Also restore ProfileStore
          if (parsed.user) {
            ProfileStore.setProfile({
              avatarUrl: parsed.user.avatar,
              username: parsed.user.username,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error rehydrating auth:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  /**
   * Clear persisted auth data
   */
  async clearPersistedAuth() {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }
}

export default new AuthStore();