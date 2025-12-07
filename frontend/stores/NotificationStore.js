import { makeAutoObservable, runInAction } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';
import SoundManager from '../services/SoundManager';

class NotificationStore {
  notifications = [];
  unreadCount = 0;
  isLoading = false;
  isInitialized = false;

  // Pending navigation - set when user clicks a notification
  pendingNavigation = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Initialize the notification store
   * Sets up WebSocket listeners and loads initial notifications
   */
  async init() {
    if (this.isInitialized) return;

    // Listen for new notifications
    WebSocketService.socket?.on('notifications:new', this.handleNewNotification);

    // Load initial notifications
    await this.loadNotifications();

    runInAction(() => {
      this.isInitialized = true;
    });
  }

  /**
   * Cleanup WebSocket listeners
   */
  cleanup() {
    WebSocketService.socket?.off('notifications:new', this.handleNewNotification);
    this.isInitialized = false;
  }

  /**
   * Handle incoming notification from WebSocket
   */
  handleNewNotification = (data) => {
    // Only process notifications meant for this user
    // Compare as strings to handle ObjectId vs string mismatch
    const myAccountId = SessionStore.accountId?.toString();
    const notificationRecipient = data.recipientId?.toString();

    if (!myAccountId || notificationRecipient !== myAccountId) return;

    // Play notification sound
    SoundManager.play('notification');

    runInAction(() => {
      // Add to beginning of list
      this.notifications.unshift(data.notification);
      // Keep only 10 active
      if (this.notifications.length > 10) {
        this.notifications = this.notifications.slice(0, 10);
      }
      this.unreadCount++;
    });
  };

  /**
   * Load notifications from server
   */
  async loadNotifications() {
    if (!SessionStore.sessionId) return;

    this.isLoading = true;

    try {
      const result = await WebSocketService.emit('notifications:get', {
        sessionId: SessionStore.sessionId
      });

      runInAction(() => {
        this.notifications = result.notifications || [];
        this.unreadCount = result.unreadCount || 0;
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Get just the unread count (lightweight)
   */
  async refreshUnreadCount() {
    if (!SessionStore.sessionId) return;

    try {
      const result = await WebSocketService.emit('notifications:unreadCount', {
        sessionId: SessionStore.sessionId
      });

      runInAction(() => {
        this.unreadCount = result.unreadCount || 0;
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markRead(notificationId) {
    if (!SessionStore.sessionId) return;

    try {
      const result = await WebSocketService.emit('notifications:markRead', {
        sessionId: SessionStore.sessionId,
        notificationId
      });

      runInAction(() => {
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.read = true;
        }
        this.unreadCount = result.unreadCount || 0;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead() {
    if (!SessionStore.sessionId) return;

    try {
      await WebSocketService.emit('notifications:markAllRead', {
        sessionId: SessionStore.sessionId
      });

      runInAction(() => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Dismiss a notification (removes from active list, keeps in history)
   */
  async dismissNotification(notificationId) {
    if (!SessionStore.sessionId) return;

    try {
      const result = await WebSocketService.emit('notifications:dismiss', {
        sessionId: SessionStore.sessionId,
        notificationId
      });

      runInAction(() => {
        const index = this.notifications.findIndex(n => n._id === notificationId);
        if (index !== -1) {
          this.notifications.splice(index, 1);
        }
        this.unreadCount = result.unreadCount || 0;
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Dismiss all notifications (clears active list, keeps in history)
   */
  async dismissAll() {
    if (!SessionStore.sessionId) return;

    try {
      await WebSocketService.emit('notifications:dismissAll', {
        sessionId: SessionStore.sessionId
      });

      runInAction(() => {
        this.notifications = [];
        this.unreadCount = 0;
      });
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }

  /**
   * Set pending navigation from a notification click
   * Returns the navigation data so the caller can act on it
   */
  setPendingNavigation(notification) {
    if (!notification.navigation) return null;

    const nav = {
      flow: notification.navigation.flow,
      dropId: notification.navigation.dropId,
      params: notification.navigation.params instanceof Map
        ? Object.fromEntries(notification.navigation.params)
        : notification.navigation.params || {}
    };

    this.pendingNavigation = nav;

    // Mark as read when clicked
    this.markRead(notification._id);

    return nav;
  }

  /**
   * Clear pending navigation (called after navigation is complete)
   */
  clearPendingNavigation() {
    this.pendingNavigation = null;
  }

  /**
   * Check if there's a pending navigation and return it
   */
  consumePendingNavigation() {
    const nav = this.pendingNavigation;
    this.pendingNavigation = null;
    return nav;
  }
}

export default new NotificationStore();
