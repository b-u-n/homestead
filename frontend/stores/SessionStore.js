import { makeAutoObservable } from 'mobx';
import { Platform } from 'react-native';
import domain from '../utils/domain';

const AUTH_STORAGE_KEY = '@homestead:auth';

class SessionStore {
  sessionId = null;
  accountId = null;
  lastScreen = 'Landing';
  accountData = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
    // Don't auto-init in constructor - let _layout.tsx call initSession after fonts load
  }

  async initSession() {
    this.isLoading = true;

    try {
      // Check if this is an OAuth callback (has token param) - don't create session, let OAuth handle it
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('token')) {
          console.log('OAuth callback detected, skipping session init');
          this.isLoading = false;
          return;
        }
      }

      // First check if we have persisted auth with a session
      const existingSession = await this.getPersistedSessionId();

      if (existingSession) {
        this.sessionId = existingSession;
        console.log('Using persisted session ID:', this.sessionId);
        await this.loadAccount();
      } else {
        // Generate new session ID for anonymous user
        this.sessionId = this.generateSessionId();
        console.log('Generated new session ID:', this.sessionId);
        await this.loadAccount();
      }

    } catch (error) {
      console.error('Error initializing session:', error);
      // Fallback to generated ID
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
      }
    }

    this.isLoading = false;
  }

  async getPersistedSessionId() {
    try {
      let data;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(AUTH_STORAGE_KEY);
      }
      // Note: AsyncStorage for native would need to be added if needed

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.user?.sessionId) {
          return parsed.user.sessionId;
        }
      }
    } catch (error) {
      console.error('Error getting persisted session:', error);
    }
    return null;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async loadAccount() {
    if (!this.sessionId) return null;

    // Don't load/create account if OAuth callback is pending
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token')) {
        console.log('OAuth callback pending, skipping account load');
        return null;
      }
    }

    try {
      const response = await fetch(`${domain()}/api/accounts/session/${this.sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.accountData = data.account;
        this.accountId = data.account._id;
        this.lastScreen = data.account.lastScreen || 'Landing';
        console.log('Loaded existing account:', data.account, 'accountId:', this.accountId);
        return data.account;
      } else if (response.status === 404) {
        // Account doesn't exist, create new one
        await this.createAccount();
        return this.accountData;
      }
    } catch (error) {
      console.error('Error loading account:', error);
      await this.createAccount();
      return this.accountData;
    }
  }

  async createAccount() {
    if (!this.sessionId) return;

    // Don't create account if OAuth callback is pending
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token')) {
        console.log('OAuth callback pending, skipping account creation');
        return;
      }
    }

    try {
      const response = await fetch(`${domain()}/api/accounts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          lastScreen: 'Landing',
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.accountData = data.account;
        this.accountId = data.accountId;
        this.lastScreen = 'Landing';
        console.log('Created new account:', data.account, 'accountId:', data.accountId);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  }

  async updateLastScreen(screenName) {
    this.lastScreen = screenName;

    if (!this.accountId && !this.sessionId) return;

    try {
      await fetch(`${domain()}/api/accounts/update-screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: this.accountId,
          sessionId: this.sessionId,
          lastScreen: screenName
        })
      });

      console.log('Updated last screen to:', screenName);
    } catch (error) {
      console.error('Error updating last screen:', error);
    }
  }

  async linkGoogleAccount(googleUser, token) {
    if (!this.sessionId) return;

    try {
      const response = await fetch(`${domain()}/api/accounts/link-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          googleUser,
          token
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.accountData = data.account;
        console.log('Linked Google account:', data.account);
        return true;
      }
    } catch (error) {
      console.error('Error linking Google account:', error);
    }
    
    return false;
  }

  getResumeScreen() {
    return this.lastScreen || 'Landing';
  }
}

export default new SessionStore();