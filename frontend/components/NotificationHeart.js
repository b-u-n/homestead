import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ImageBackground,  } from 'react-native';
import Scroll from './Scroll';
import { observer } from 'mobx-react-lite';
import StitchedBorder from './StitchedBorder';
import NotificationStore from '../stores/NotificationStore';

const buttonBgImage = require('../assets/images/button-bg.png');

const NotificationHeart = observer(({ style, onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize notification store when component mounts
    NotificationStore.init();

    return () => {
      NotificationStore.cleanup();
    };
  }, []);

  // Global click listener to close panel when clicking outside
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') return;

    const handleClickOutside = (event) => {
      // Check if click is outside the container
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Add listener with slight delay to avoid catching the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    const nav = NotificationStore.setPendingNavigation(notification);
    if (onNotificationClick && nav) {
      onNotificationClick(notification, nav);
    }
  };

  const handleDismiss = (e, notification) => {
    // Prevent the click from triggering navigation
    e.stopPropagation();
    NotificationStore.dismissNotification(notification._id);
  };

  const handleDismissAll = () => {
    NotificationStore.dismissAll();
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      {/* Heart Button */}
      <Pressable onPress={() => setIsOpen(!isOpen)} style={styles.heartButton}>
        {Platform.OS === 'web' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '20%',
              borderRadius: 8,
              pointerEvents: 'none',
              opacity: 0.8,
            }}
          />
        )}
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={buttonBgImage}
            style={styles.buttonBgImage}
            imageStyle={{ opacity: 0.8, borderRadius: 8 }}
            resizeMode="repeat"
          />
        )}
        <View style={styles.heartOverlay}>
          <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
            <View style={styles.heartIconContainer}>
              <Text style={styles.heartIcon}>❤️</Text>
            </View>
          </StitchedBorder>
        </View>

        {/* Unread Badge */}
        {NotificationStore.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {NotificationStore.unreadCount > 9 ? '9+' : NotificationStore.unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop for native platforms */}
          {Platform.OS !== 'web' && (
            <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
          )}

          {/* Notification Panel */}
          <View style={styles.panel}>
            {Platform.OS === 'web' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '10%',
                  borderRadius: 8,
                  pointerEvents: 'none',
                  opacity: 0.9,
                }}
              />
            )}
            <View style={styles.panelOverlay}>
              <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
                <View style={styles.panelContent}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {NotificationStore.notifications.length > 0 && (
                      <Pressable onPress={handleDismissAll}>
                        <Text style={styles.clearAll}>Dismiss all</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Notification List */}
                  <Scroll style={styles.notificationList} showsVerticalScrollIndicator={false}>
                    {NotificationStore.notifications.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No notifications yet</Text>
                      </View>
                    ) : (
                      NotificationStore.notifications.map((notification) => (
                        <Pressable
                          key={notification._id}
                          style={[
                            styles.notificationItem,
                            !notification.read && styles.unreadItem
                          ]}
                          onPress={() => handleNotificationClick(notification)}
                        >
                          {/* Actor Avatar */}
                          <View style={styles.avatarContainer}>
                            {notification.actor?.avatar ? (
                              <img
                                src={notification.actor.avatar}
                                alt=""
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <Text style={styles.avatarPlaceholder}>❤️</Text>
                            )}
                          </View>

                          {/* Content */}
                          <View style={styles.notificationContent}>
                            <Text style={styles.notificationMessage} numberOfLines={2}>
                              {notification.message}
                            </Text>
                            <Text style={styles.notificationTime}>
                              {formatTimeAgo(notification.createdAt)}
                            </Text>
                          </View>

                          {/* Dismiss Button */}
                          <Pressable
                            style={styles.dismissButton}
                            onPress={(e) => handleDismiss(e, notification)}
                          >
                            <Text style={styles.dismissButtonText}>✕</Text>
                          </Pressable>
                        </Pressable>
                      ))
                    )}
                  </Scroll>
                </View>
              </StitchedBorder>
            </View>
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  heartButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heartOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#7044C7',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9998,
    backgroundColor: 'transparent',
  },
  panel: {
    position: 'absolute',
    top: 55,
    right: 0,
    width: 320,
    maxHeight: 400,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    zIndex: 9999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  panelOverlay: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 4,
  },
  panelContent: {
    maxHeight: 380,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.2)',
  },
  headerTitle: {
    fontFamily: 'ChubbyTrail',
    fontSize: 18,
    color: '#403F3E',
  },
  clearAll: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#FF6B6B',
  },
  notificationList: {
    maxHeight: 320,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    opacity: 0.6,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.1)',
    gap: 10,
  },
  unreadItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    fontSize: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#403F3E',
    lineHeight: 18,
  },
  notificationTime: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.5,
    marginTop: 4,
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(92, 90, 88, 0.1)',
  },
  dismissButtonText: {
    fontSize: 12,
    color: '#5C5A58',
  },
});

export default NotificationHeart;
