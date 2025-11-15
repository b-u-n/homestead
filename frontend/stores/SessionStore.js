import { makeAutoObservable } from 'mobx';
import domain from '../utils/domain';

class SessionStore {
  sessionId = null;
  lastScreen = 'Landing';
  accountData = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
    this.initSession();
  }

  async initSession() {
    this.isLoading = true;
    
    try {
      // Generate new session ID
      this.sessionId = this.generateSessionId();
      console.log('Generated session ID:', this.sessionId);
      
      // Load or create account
      await this.loadAccount();
      
    } catch (error) {
      console.error('Error initializing session:', error);
      // Fallback to generated ID
      this.sessionId = this.generateSessionId();
    }
    
    this.isLoading = false;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async loadAccount() {
    if (!this.sessionId) return;

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
        this.lastScreen = data.account.lastScreen || 'Landing';
        console.log('Loaded existing account:', data.account);
      } else if (response.status === 404) {
        // Account doesn't exist, create new one
        await this.createAccount();
      }
    } catch (error) {
      console.error('Error loading account:', error);
      await this.createAccount();
    }
  }

  async createAccount() {
    if (!this.sessionId) return;

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
        this.lastScreen = 'Landing';
        console.log('Created new account:', data.account);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  }

  async updateLastScreen(screenName) {
    this.lastScreen = screenName;
    
    if (!this.sessionId) return;

    try {
      await fetch(`${domain()}/api/accounts/update-screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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