import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, Image, Pressable, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { reaction } from 'mobx';
import inventoryStore from '../stores/InventoryStore';
import profileStore from '../stores/ProfileStore';
import characterStore from '../stores/CharacterStore';
import AuthStore from '../stores/AuthStore';
import NotificationStore from '../stores/NotificationStore';
import LayerStore from '../stores/LayerStore';
import UserStatus from './UserStatus';
import WoolButton from './WoolButton';
import HamburgerMenu from './HamburgerMenu';
import NotificationHeart from './NotificationHeart';
import Scroll from './Scroll';
import StitchedBorder from './StitchedBorder';
import TiledBackground from './TiledBackground';
import Heart from './Heart';
import WishingWell from './WishingWell';
import WeepingWillow from './WeepingWillow';
import Workbook from './Workbook';
import LibraryNav from './LibraryNav';
import FlowEngine from './FlowEngine';
import LayerSelectModal from './LayerSelectModal';
import SoundSettingsModal from './SoundSettingsModal';
import ThemeSettingsModal from './ThemeSettingsModal';
import ReportIssueModal from './ReportIssueModal';
import FontSettingsModal from './FontSettingsModal';
import AccessibilitySettingsModal from './AccessibilitySettingsModal';
import heartsFlow from '../flows/heartsFlow';
import CharacterIcon, { isPointInCharacter } from './CharacterIcon';
import EmoteMenu, { getClickedEmote } from './EmoteMenu';
import { EMOTES, drawEmote, measureEmote } from '../config/emotes';
import WebSocketService from '../services/websocket';
import { resolveAvatarUrl } from '../utils/domain';
// Import sections
import townSquare from '../locations/sections/town-square';
import marketplace from '../locations/sections/marketplace';
import playerHousing from '../locations/sections/player-housing';
import forest from '../locations/sections/forest';
import garden from '../locations/sections/garden';

// Import rooms
import weepingWillow from '../locations/rooms/weeping-willow';
import sugarbeeCafe from '../locations/rooms/sugarbee-cafe';
import bank from '../locations/rooms/bank';
import library from '../locations/rooms/library';
import workshopWorried from '../locations/rooms/workshop-worried';
import workshopSad from '../locations/rooms/workshop-sad';
import workshopAngry from '../locations/rooms/workshop-angry';
import workshopAssertiveness from '../locations/rooms/workshop-assertiveness';
import libraryRecovery from '../locations/rooms/library-recovery';
import libraryBalance from '../locations/rooms/library-balance';
import libraryConnection from '../locations/rooms/library-connection';

// Import images
const knapsackImage = require('../assets/images/knapsack.png');
const wishingWellImage = require('../assets/images/wishing-well.png');
const weepingWillowImage = require('../assets/images/weeping-willow.png');
const buttonBgImage = require('../assets/images/button-bg.png');

// Import sounds config and manager
import sounds from '../config/sounds';
import SoundManager from '../services/SoundManager';
import uxStore, { BASELINE_WIDTH, BASELINE_HEIGHT } from '../stores/UXStore';
import FontSettingsStore from '../stores/FontSettingsStore';

// Helper to play emote sound
const playEmoteSound = () => {
  SoundManager.play('emote');
};

// Location lookup object (includes both sections and rooms)
const LOCATIONS = {
  // Sections
  'town-square': townSquare,
  'marketplace': marketplace,
  'player-housing': playerHousing,
  'forest': forest,
  'garden': garden,
  // Rooms
  'weeping-willow': weepingWillow,
  'sugarbee-cafe': sugarbeeCafe,
  'bank': bank,
  'library': library,
  'workshop-worried': workshopWorried,
  'workshop-sad': workshopSad,
  'workshop-angry': workshopAngry,
  'workshop-assertiveness': workshopAssertiveness,
  // Library rooms
  'library-recovery': libraryRecovery,
  'library-balance': libraryBalance,
  'library-connection': libraryConnection,
};

// Mobile Overlay Panel component for sidebar mode
const MobileOverlayPanel = observer(({
  type,
  onClose,
  onNotificationClick,
  onShowLayerModal,
  onShowSoundSettings,
  onShowThemeSettings,
  onShowFontSettings,
  onShowAccessibilitySettings,
  onShowReportIssue,
}) => {
  const router = useRouter();

  const handleLogout = () => {
    onClose();
    AuthStore.logout();
    LayerStore.clearLayer();
    router.replace('/');
  };

  const handleNotificationPress = (notification) => {
    onClose();
    const nav = NotificationStore.setPendingNavigation(notification);
    if (onNotificationClick && nav) {
      onNotificationClick(notification, nav);
    }
  };

  const handleDismiss = (e, notification) => {
    e.stopPropagation();
    NotificationStore.dismissNotification(notification._id);
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

  const currentLayerName = LayerStore.currentLayer?.name || 'None';

  return (
    <View style={mobileOverlayStyles.backdrop}>
      <Pressable style={mobileOverlayStyles.backdropTouchArea} onPress={onClose} />
      <View
        style={mobileOverlayStyles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <TiledBackground style={{ flex: 1 }}>
          <View style={mobileOverlayStyles.contentWrapper}>
            <StitchedBorder borderRadius={12} borderColor="rgba(92, 90, 88, 0.2)" style={mobileOverlayStyles.border}>
              {/* Header */}
              <View style={mobileOverlayStyles.header}>
                <Text style={mobileOverlayStyles.headerTitle}>
                  {type === 'notifications' ? 'Notifications' : 'Menu'}
                </Text>
                <Pressable onPress={onClose} style={mobileOverlayStyles.closeButton}>
                  <Text style={mobileOverlayStyles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              {/* Content */}
              <Scroll fadeEdges={false} style={mobileOverlayStyles.content} contentContainerStyle={mobileOverlayStyles.contentContainer}>
                {type === 'notifications' ? (
                  <>
                    {NotificationStore.notifications.length > 0 && (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => NotificationStore.dismissAll()} style={mobileOverlayStyles.dismissAllButton}>
                        <Text style={mobileOverlayStyles.dismissAllText}>Dismiss all</Text>
                      </TouchableOpacity>
                    )}
                    {NotificationStore.notifications.length === 0 ? (
                      <View style={mobileOverlayStyles.emptyState}>
                        <Text style={mobileOverlayStyles.emptyText}>No notifications yet</Text>
                      </View>
                    ) : (
                      NotificationStore.notifications.map((notification) => (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          key={notification._id}
                          style={[
                            mobileOverlayStyles.notificationItem,
                            !notification.read && mobileOverlayStyles.unreadItem
                          ]}
                          onPress={() => handleNotificationPress(notification)}
                        >
                          <View style={mobileOverlayStyles.avatarContainer}>
                            {notification.actor?.avatar ? (
                              <img
                                src={notification.actor.avatar}
                                alt=""
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 6,
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <Heart size={28} />
                            )}
                          </View>
                          <View style={mobileOverlayStyles.notificationContent}>
                            <Text style={mobileOverlayStyles.notificationMessage} numberOfLines={2}>
                              {notification.message}
                            </Text>
                            <Text style={mobileOverlayStyles.notificationTime}>
                              {formatTimeAgo(notification.createdAt)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={mobileOverlayStyles.dismissButton}
                            onPress={(e) => handleDismiss(e, notification)}
                          >
                            <Text style={mobileOverlayStyles.dismissButtonText}>✕</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))
                    )}
                  </>
                ) : (
                  <View style={mobileOverlayStyles.menuContent}>
                    {/* Current Layer Display */}
                    <View style={mobileOverlayStyles.layerInfo}>
                      <Text style={mobileOverlayStyles.layerLabel}>Current Layer:</Text>
                      <Text style={mobileOverlayStyles.layerName}>{currentLayerName}</Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.7} onPress={onShowLayerModal} style={mobileOverlayStyles.menuButton}>
                      <View pointerEvents="none">
                        <WoolButton title="Switch Layers" variant="secondary" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={onShowSoundSettings} style={mobileOverlayStyles.menuButton}>
                      <View pointerEvents="none">
                        <WoolButton title="Sound Settings" variant="blue" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={onShowThemeSettings} style={mobileOverlayStyles.menuButton}>
                      <View pointerEvents="none">
                        <WoolButton title="Theme Settings" variant="purple" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={onShowFontSettings} style={mobileOverlayStyles.menuButton}>
                      <View pointerEvents="none">
                        <WoolButton title="Font Settings" variant="green" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={onShowAccessibilitySettings} style={mobileOverlayStyles.menuButton}>
                      <View pointerEvents="none">
                        <WoolButton title="Accessibility" variant="secondary" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={onShowReportIssue} style={mobileOverlayStyles.menuButton}>
                      <View pointerEvents="none">
                        <WoolButton title="Report Issue" variant="coral" />
                      </View>
                    </TouchableOpacity>
                    {AuthStore.isAuthenticated && (
                      <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={mobileOverlayStyles.menuButton}>
                        <View pointerEvents="none">
                          <WoolButton title="Logout" variant="coral" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Scroll>
            </StitchedBorder>
          </View>
        </TiledBackground>
      </View>
    </View>
  );
});

// Styles for mobile overlay panel
const mobileOverlayStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 500,
  },
  backdropTouchArea: {
    flex: 1,
  },
  panel: {
    width: 280,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  contentWrapper: {
    backgroundColor: 'rgba(222, 134, 223, 0.1)',
    padding: 4,
    flex: 1,
  },
  border: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.2)',
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: 'SuperStitch',
    fontSize: 20,
    color: '#403F3E',
    opacity: 0.8,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(92, 90, 88, 0.1)',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#5C5A58',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  // Notification styles
  dismissAllButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  dismissAllText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#FF6B6B',
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
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    gap: 10,
  },
  unreadItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Menu styles
  menuContent: {
    gap: 10,
  },
  layerInfo: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.2)',
  },
  layerLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
  },
  layerName: {
    fontFamily: 'SuperStitch',
    fontSize: 16,
    color: '#403F3E',
    opacity: 0.8,
    marginTop: 2,
  },
  menuButton: {
    marginVertical: 2,
  },
});

// ── Move animation config ──────────────────────────────────────────
// Four independent channels: ghost.fade, ghost.scale, real.fade, real.scale
// Each has its own duration (ms), delay (ms), value range, and easing curve.
const MOVE_ANIM = {
  ghost: {
    fade:  { duration: 126, delay: 0, from: 1, to: 0,   easing: 'easeInQuad' },
    scale: { duration: 200, delay: 0, from: 1, to: 1.2, easing: 'easeOutQuad' },
  },
  real: {
    fade:  { duration: 280, delay: 12, from: 0, to: 1,   easing: 'easeOutQuad' },
    scale: { duration: 300, delay: 12, from: 0.75, to: 1, easing: 'pounce' },
  },
};

const MOVE_EASINGS = {
  linear:       (t) => t,
  easeInQuad:   (t) => t * t,
  easeOutQuad:  (t) => 1 - (1 - t) * (1 - t),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  pounce:       (t) => {
    // easeOutBack with playful overshoot (~12% past target)
    const s = 2.5;
    return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  },
};

// Evaluate a single animation channel at a given elapsed time
const moveAnimValue = (cfg, elapsed) => {
  const local = Math.max(0, elapsed - cfg.delay);
  const t = Math.min(1, local / cfg.duration);
  const eased = MOVE_EASINGS[cfg.easing](t);
  return cfg.from + (cfg.to - cfg.from) * eased;
};

// Total duration = longest channel (delay + duration)
const MOVE_ANIM_DURATION = Math.max(
  MOVE_ANIM.ghost.fade.delay  + MOVE_ANIM.ghost.fade.duration,
  MOVE_ANIM.ghost.scale.delay + MOVE_ANIM.ghost.scale.duration,
  MOVE_ANIM.real.fade.delay   + MOVE_ANIM.real.fade.duration,
  MOVE_ANIM.real.scale.delay  + MOVE_ANIM.real.scale.duration,
);
// Trail opacity multiplier: lighter colors get more visible trails (white ≈ 2×, purple ≈ 1×)
const trailBrightnessMul = (hex) => {
  if (!hex) return 1;
  const n = parseInt(hex.replace('#', ''), 16);
  const brightness = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xFF) + 0.114 * (n & 0xFF)) / 255;
  return 0.5 + 1.5 * brightness;
};
// ────────────────────────────────────────────────────────────────────

const MapCanvas = ({ location }) => {
  const canvasRef = useRef(null);
  const router = useRouter();
  const [roomData, setRoomData] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const [isWishingWellOpen, setIsWishingWellOpen] = useState(false);
  const [isWeepingWillowOpen, setIsWeepingWillowOpen] = useState(false);
  const [weepingWillowStartAt, setWeepingWillowStartAt] = useState(null);
  const [weepingWillowParams, setWeepingWillowParams] = useState({});
  const [isBankFlowOpen, setIsBankFlowOpen] = useState(false);
  const [isWorkbookOpen, setIsWorkbookOpen] = useState(false);
  const [workbookBookshelfId, setWorkbookBookshelfId] = useState(null);
  const [workbookTitle, setWorkbookTitle] = useState('Workbook');
  const [isEmoteMenuOpen, setIsEmoteMenuOpen] = useState(false);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [isFontSettingsOpen, setIsFontSettingsOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isAccessibilitySettingsOpen, setIsAccessibilitySettingsOpen] = useState(false);
  const [mobileOverlay, setMobileOverlay] = useState(null); // 'menu' | 'notifications' | null
  const [characterPosition, setCharacterPosition] = useState(null);
  const [avatarImages, setAvatarImages] = useState({});
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [touchStart, setTouchStart] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [playersRefresh, setPlayersRefresh] = useState(0);

  // Avatar move animation state
  const moveAnimRef = useRef({
    active: false,
    startTime: 0,
    duration: 220,
    oldPos: null,
    newPos: null,
  });
  const drawCanvasRef = useRef(null);

  // Animation loop — drives redraws during poof animation
  useEffect(() => {
    let frameId;
    const tick = () => {
      const anim = moveAnimRef.current;
      if (anim.active) {
        const elapsed = Date.now() - anim.startTime;
        if (elapsed >= anim.duration) {
          anim.active = false;
        }
        if (drawCanvasRef.current) drawCanvasRef.current();
        frameId = requestAnimationFrame(tick);
      }
    };
    if (moveAnimRef.current.active) {
      frameId = requestAnimationFrame(tick);
    }
    return () => { if (frameId) cancelAnimationFrame(frameId); };
  }, [characterPosition]);

  // Watch for changes to other players and force re-render
  useEffect(() => {
    const dispose = reaction(
      () => {
        // Create a serializable representation of all player data
        // This triggers when players are added/removed OR when their properties change
        return characterStore.otherPlayersArray.map(p => ({
          id: p.socketId,
          x: p.position?.x,
          y: p.position?.y,
          emote: p.emote,
          emoteOpacity: p.emoteOpacity,
          moveAnimProgress: p.moveAnimProgress,
        }));
      },
      () => {
        setPlayersRefresh(prev => prev + 1);
      },
      { equals: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
    );
    return () => dispose();
  }, []);

  // Update canvas dimensions and detect mobile/portrait - sync with UXStore
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Update the UX store (calculates isPortrait, renderScale, isMobile)
      uxStore.updateDimensions(w, h);

      // Sync local state from store
      setCanvasWidth(uxStore.screenWidth);
      setCanvasHeight(uxStore.screenHeight);
      setIsMobile(uxStore.isMobile);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Track if we've entered this location to avoid duplicate map:enter calls
  const hasEnteredRef = useRef(false);

  // Track active entity sound instances and timeouts
  const entitySoundsRef = useRef({ instances: [], timeouts: [], started: false, location: null });

  // Helper to stop all entity sounds
  const stopAllEntitySounds = () => {
    const state = entitySoundsRef.current;
    console.log('[Sound] Stopping all sounds, instances:', state.instances.length, 'timeouts:', state.timeouts.length);

    // Clear all scheduled timeouts
    state.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    state.timeouts = [];

    // Stop all tracked instances with quick fade
    state.instances.forEach(instance => {
      console.log('[Sound] Stopping instance:', instance.soundKey);
      instance.fadeOut(200);
    });
    state.instances = [];
    state.started = false;

    // Also use SoundManager.stopAll() as a safety net
    SoundManager.stopAll();
  };


  // Load location data (section or room) - use baseline dimensions for consistent layout
  useEffect(() => {
    const locationFn = LOCATIONS[location];

    if (locationFn) {
      // Call location function with baseline dimensions (1080p) for consistent positioning
      const locationData = typeof locationFn === 'function' ? locationFn(BASELINE_WIDTH, BASELINE_HEIGHT) : locationFn;
      setRoomData(locationData);

      // Initialize character position from store or center
      const position = characterStore.getPosition(location, BASELINE_WIDTH, BASELINE_HEIGHT);
      setCharacterPosition(position);
    } else {
      console.error(`Failed to load location: ${location}`);
      // Fallback to town square if location doesn't exist
      if (location !== 'town-square') {
        router.replace('/homestead/explore/map/town-square');
      }
    }
  }, [location]);

  // Handle entering/leaving rooms - only runs once per location change
  useEffect(() => {
    // Clear other players when location changes (before entering new room)
    characterStore.clearOtherPlayers();
    // Reset on location change
    hasEnteredRef.current = false;
  }, [location]);

  // Separate effect to actually enter the room once everything is ready
  useEffect(() => {
    if (hasEnteredRef.current) return;
    if (!WebSocketService.socket || !profileStore.avatarUrl) return;

    hasEnteredRef.current = true;
    const position = characterStore.getPosition(location, BASELINE_WIDTH, BASELINE_HEIGHT);

    WebSocketService.emitRaw('map:enter', {
      roomId: location,
      x: position.x / BASELINE_WIDTH,
      y: position.y / BASELINE_HEIGHT,
      avatarUrl: profileStore.avatarUrl,
      avatarColor: profileStore.avatarColor,
      username: profileStore.username
    }).then(result => {
      if (result && result.data && result.data.existingPlayers) {
        // Add all existing players to the store
        result.data.existingPlayers.forEach(player => {
          const playerData = {
            position: { x: player.x * BASELINE_WIDTH, y: player.y * BASELINE_HEIGHT },
            avatarUrl: player.avatarUrl,
            avatarColor: player.avatarColor,
            username: player.username
          };
          // Include emote if it exists
          if (player.emote) {
            playerData.emote = player.emote;
          }
          characterStore.updateOtherPlayer(player.socketId, playerData);

          // Load avatar images
          if (player.avatarUrl && !avatarImages[player.avatarUrl]) {
            const img = new window.Image();
            img.onload = () => {
              setAvatarImages(prev => ({ ...prev, [player.avatarUrl]: img }));
            };
            img.src = player.avatarUrl;
          }
        });
      }

      // Start sounds for this room
      if (result && result.success && result.roomId) {
        console.log('[Sound] Entered room:', result.roomId);
        const locationFn = LOCATIONS[result.roomId];
        if (locationFn) {
          const locationData = typeof locationFn === 'function'
            ? locationFn(BASELINE_WIDTH, BASELINE_HEIGHT)
            : locationFn;
          if (locationData) {
            startEntitySounds(locationData.entities, locationData.backgroundSounds, result.roomId);
          }
        }
      }
    });

    // Save to localStorage - ensure location is a string
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined' && typeof location === 'string') {
      localStorage.setItem('lastMapLocation', location);
    }
  }, [location, profileStore.avatarUrl]);


  // Listen for map:leave (our own) to stop sounds
  useEffect(() => {
    if (!WebSocketService.socket) return;

    const socket = WebSocketService.socket;

    const handleLeave = (data) => {
      // Only stop sounds if it's our own leave event
      if (data.socketId === socket.id) {
        console.log('[Sound] Received map:leave for room:', data.roomId);
        stopAllEntitySounds();
      }
    };

    socket.on('map:leave', handleLeave);

    return () => {
      socket.off('map:leave', handleLeave);
    };
  }, []);

  // Helper to start sounds for current room
  const startEntitySounds = (entities, backgroundSounds, roomLocation) => {
    const state = entitySoundsRef.current;

    if (state.started && state.location === roomLocation) {
      console.log('[Sound] Already started for', roomLocation, ', skipping');
      return;
    }

    state.started = true;
    state.location = roomLocation;
    console.log('[Sound] Starting sounds for', roomLocation);

    // Start background sounds first
    if (backgroundSounds && backgroundSounds.length > 0) {
      console.log('[Sound] Starting background sounds:', backgroundSounds);
      backgroundSounds.forEach((soundDef) => {
        const soundKey = typeof soundDef === 'string' ? soundDef : soundDef.key;
        const initialDelay = typeof soundDef === 'object' ? (soundDef.initialDelay ?? soundDef.delay ?? 0) : 0;
        const minDelay = typeof soundDef === 'object' ? soundDef.minDelay : 0;
        const maxDelay = typeof soundDef === 'object' ? soundDef.maxDelay : 0;

        const instance = SoundManager.createInstance(soundKey);
        state.instances.push(instance);

        // Random interval background sounds
        if (minDelay && maxDelay) {
          const getRandomDelay = () => {
            const raw = minDelay + Math.random() * (maxDelay - minDelay);
            return Math.floor(raw / 480) * 480;
          };

          const scheduleNextPlay = () => {
            if (state.location !== roomLocation) return;

            const nextDelay = getRandomDelay();
            const timeoutId = setTimeout(() => {
              if (state.location !== roomLocation) return;
              instance.play();
              scheduleNextPlay();
            }, nextDelay);
            state.timeouts.push(timeoutId);
          };

          // Start with initial delay, then schedule random intervals
          const initialTimeout = setTimeout(() => {
            if (state.location !== roomLocation) return;
            instance.play();
            scheduleNextPlay();
          }, initialDelay);
          state.timeouts.push(initialTimeout);
        } else {
          // Simple delayed start (loops handled by sound config)
          const timeoutId = setTimeout(() => {
            if (state.location !== roomLocation) return;
            instance.play();
          }, initialDelay);
          state.timeouts.push(timeoutId);
        }
      });
    }

    const allEntities = [...(entities || [])];

    allEntities.forEach(entity => {
      if (!entity.sounds) return;

      const soundsList = Array.isArray(entity.sounds) ? entity.sounds : [entity.sounds];

      soundsList.forEach((soundDef) => {
        const soundKey = typeof soundDef === 'string' ? soundDef : soundDef.key;
        const delay = typeof soundDef === 'object' ? soundDef.delay : 0;
        const minDelay = typeof soundDef === 'object' ? soundDef.minDelay : 0;
        const maxDelay = typeof soundDef === 'object' ? soundDef.maxDelay : 0;

        if (minDelay && maxDelay) {
          const instance = SoundManager.createInstance(soundKey);
          state.instances.push(instance);

          const soundDuration = instance.config?.duration || 0;
          const effectiveMinDelay = Math.max(minDelay, soundDuration);
          const effectiveMaxDelay = Math.max(maxDelay, soundDuration);

          const getRandomDelay = () => {
            const raw = effectiveMinDelay + Math.random() * (effectiveMaxDelay - effectiveMinDelay);
            return Math.floor(raw / 480) * 480;
          };

          const scheduleNextPlay = () => {
            if (state.location !== roomLocation) return;

            const nextDelay = getRandomDelay();
            const timeoutId = setTimeout(() => {
              if (state.location !== roomLocation) return;

              if (!instance.isPlaying()) {
                instance.tryPlay();
              }
              scheduleNextPlay();
            }, nextDelay);
            state.timeouts.push(timeoutId);
          };

          if (delay) {
            const initialTimeout = setTimeout(() => {
              if (state.location !== roomLocation) return;
              if (!instance.isPlaying()) {
                instance.tryPlay();
              }
              scheduleNextPlay();
            }, delay);
            state.timeouts.push(initialTimeout);
          } else {
            if (!instance.isPlaying()) {
              instance.tryPlay();
            }
            scheduleNextPlay();
          }
        } else {
          const instance = SoundManager.createInstance(soundKey);
          state.instances.push(instance);

          const effectiveDelay = delay || 100;
          const timeoutId = setTimeout(() => {
            if (state.location !== roomLocation) return;
            instance.play();
          }, effectiveDelay);
          state.timeouts.push(timeoutId);
        }
      });
    });
  };


  // Load images for entities
  useEffect(() => {
    if (!roomData || Platform.OS !== 'web') return;

    const imageMap = {
      'wishing-well.png': wishingWellImage,
      'weeping-willow.png': weepingWillowImage,
    };

    const imagesToLoad = {};

    // Find all entities with images (including doors, navigation, and backButton)
    const allEntities = [
      ...(roomData.entities || []),
      ...(roomData.doors || []),
      ...(roomData.navigation || []),
      ...(roomData.backButton ? [roomData.backButton] : []),
    ];

    allEntities.forEach(entity => {
      if (entity.image) {
        const img = new window.Image();
        let imageSrc;
        let imageKey;

        // Check if entity.image is a string key for imageMap
        if (typeof entity.image === 'string' && imageMap[entity.image]) {
          imageKey = entity.image;
          imageSrc = typeof imageMap[entity.image] === 'string'
            ? imageMap[entity.image]
            : imageMap[entity.image].default || imageMap[entity.image].uri || imageMap[entity.image];
        } else if (entity.image) {
          // entity.image is already a require() result (number/module)
          imageKey = entity.id; // Use entity id as key for loaded images
          imageSrc = typeof entity.image === 'string'
            ? entity.image
            : entity.image.default || entity.image.uri || entity.image;
        }

        if (imageSrc) {
          img.onload = () => {
            setLoadedImages(prev => ({
              ...prev,
              [imageKey]: img
            }));
          };
          img.src = imageSrc;
        }
      }
    });
  }, [roomData]);

  // Set up websocket listeners for map events
  useEffect(() => {
    if (!WebSocketService.socket || Platform.OS !== 'web') return;

    const socket = WebSocketService.socket;

    // Listen for other players moving
    const handleMove = (data) => {
      // Don't update for our own socket
      if (data.socketId === socket.id) return;
      data.avatarUrl = resolveAvatarUrl(data.avatarUrl);

      // Only update if in same room
      if (data.roomId === location) {
        characterStore.updateOtherPlayer(data.socketId, {
          position: { x: data.x * BASELINE_WIDTH, y: data.y * BASELINE_HEIGHT },
          avatarUrl: data.avatarUrl,
          avatarColor: data.avatarColor,
          username: data.username
        });

        // Load avatar image if not already loaded
        if (data.avatarUrl && !avatarImages[data.avatarUrl]) {
          const img = new window.Image();
          img.onload = () => {
            setAvatarImages(prev => ({ ...prev, [data.avatarUrl]: img }));
          };
          img.src = data.avatarUrl;
        }
      }
    };

    // Listen for other players emoting
    const handleEmote = (data) => {
      // Don't update for our own socket (we handle that locally)
      if (data.socketId === socket.id) return;
      data.avatarUrl = resolveAvatarUrl(data.avatarUrl);

      // Only update if in same room
      if (data.roomId === location) {
        characterStore.updateOtherPlayer(data.socketId, {
          emote: data.emote,
          position: { x: data.x * BASELINE_WIDTH, y: data.y * BASELINE_HEIGHT },
          avatarUrl: data.avatarUrl,
          avatarColor: data.avatarColor,
          username: data.username
        });

        // Play emote sound
        playEmoteSound();

        // Load avatar image if not already loaded
        if (data.avatarUrl && !avatarImages[data.avatarUrl]) {
          const img = new window.Image();
          img.onload = () => {
            setAvatarImages(prev => ({ ...prev, [data.avatarUrl]: img }));
          };
          img.src = data.avatarUrl;
        }
      }
    };

    // Listen for players entering
    const handleEnter = (data) => {
      // Don't update for our own socket
      if (data.socketId === socket.id) return;
      data.avatarUrl = resolveAvatarUrl(data.avatarUrl);

      // Only update if in same room
      if (data.roomId === location) {
        characterStore.updateOtherPlayer(data.socketId, {
          position: { x: data.x * BASELINE_WIDTH, y: data.y * BASELINE_HEIGHT },
          avatarUrl: data.avatarUrl,
          avatarColor: data.avatarColor,
          username: data.username
        });

        // Load avatar image if not already loaded
        if (data.avatarUrl && !avatarImages[data.avatarUrl]) {
          const img = new window.Image();
          img.onload = () => {
            setAvatarImages(prev => ({ ...prev, [data.avatarUrl]: img }));
          };
          img.src = data.avatarUrl;
        }
      }
    };

    // Listen for players leaving
    const handleLeave = (data) => {
      // Only remove if they left the current room (or if roomId is not specified, meaning disconnect)
      if (!data.roomId || data.roomId === location) {
        characterStore.removeOtherPlayer(data.socketId);
      }
    };

    socket.on('map:move', handleMove);
    socket.on('map:emote', handleEmote);
    socket.on('map:enter', handleEnter);
    socket.on('map:leave', handleLeave);

    return () => {
      socket.off('map:move', handleMove);
      socket.off('map:emote', handleEmote);
      socket.off('map:enter', handleEnter);
      socket.off('map:leave', handleLeave);
    };
  }, [location, avatarImages, canvasWidth, canvasHeight]);

  // Load current user's avatar image when profileStore.avatarUrl changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (profileStore.avatarUrl && !avatarImages[profileStore.avatarUrl]) {
      const img = new window.Image();
      img.onload = () => {
        setAvatarImages(prev => ({ ...prev, [profileStore.avatarUrl]: img }));
      };
      img.src = profileStore.avatarUrl;
    }
  }, [profileStore.avatarUrl]);

  // Draw canvas
  useEffect(() => {
    if (roomData && Platform.OS === 'web') {
      drawCanvas();
    }
  }, [roomData, hoveredObject, loadedImages, characterPosition, isEmoteMenuOpen, characterStore.activeEmote, characterStore.emoteOpacity, playersRefresh, avatarImages, isMobile, uxStore.renderScale]);

  const drawCanvas = () => {
    drawCanvasRef.current = drawCanvas;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas (make transparent)
    ctx.clearRect(0, 0, width, height);

    if (!roomData) return;

    // Calculate avatar/emote size multiplier for smaller screens
    // When renderScale is small (mobile), make avatars 50% larger
    const avatarSizeMultiplier = uxStore.avatarSizeMultiplier;
    const baseAvatarSize = 64;
    const avatarSize = baseAvatarSize * avatarSizeMultiplier;

    // Collect debug labels to draw on top of everything
    const debugLabels = [];

    // Helper function to draw a button/entity
    const drawButton = (obj) => {
      const isHovered = hoveredObject === obj.id;

      // Check if this is the back/home button (for mobile scaling)
      const isBackButton = obj.id && (obj.id.startsWith('back-') || obj.id === 'home-hearts');
      // Scale back button 50% larger on mobile
      const mobileBackScale = (isBackButton && uxStore.shouldScaleUI) ? 1.5 : 1;

      // Check if this entity has an image
      // Image may be stored under obj.image (string key) or obj.id (for direct require() results)
      const imageKey = typeof obj.image === 'string' ? obj.image : obj.id;
      if (obj.image && loadedImages[imageKey]) {
        const img = loadedImages[imageKey];

        // Calculate scale based on hover (skip for decorations) and mobile back button scale
        const hoverScale = (isHovered && obj.type !== 'decoration') ? 1.06 : 1;
        const scale = hoverScale * mobileBackScale;
        const scaledWidth = obj.width * scale;
        const scaledHeight = obj.height * scale;
        const offsetX = (scaledWidth - obj.width) / 2;
        const offsetY = (scaledHeight - obj.height) / 2;

        // Draw the image with scaling
        ctx.drawImage(img, obj.x - offsetX, obj.y - offsetY, scaledWidth, scaledHeight);

        // If debug mode enabled at room level, collect decoration labels for later drawing on top
        if (roomData.debugMode && obj.type === 'decoration' && obj.label) {
          const labelText = obj.label.toUpperCase();
          const centerX = obj.x + obj.width / 2;
          const centerY = obj.y + obj.height / 2;
          debugLabels.push({ labelText, centerX, centerY });
        } else if (obj.showTitle !== false && obj.label) {
          // Draw normal label below the image with shadow (no box)
          const labelText = obj.label.toUpperCase();
          const labelFontSize = FontSettingsStore.getScaledFontSize(18);
          const textY = obj.y + obj.height + FontSettingsStore.getScaledSpacing(24); // Position text below image
          const textX = obj.x + obj.width / 2;

          ctx.save();
          ctx.font = `${labelFontSize}px SuperStitch`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';

          // Draw black shadow (offset)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillText(labelText, textX + 1, textY + 1);

          // Draw main text
          ctx.fillStyle = FontSettingsStore.getFontColor('#403F3E');
          ctx.fillText(labelText, textX, textY);
          ctx.restore();
        }
      } else if (!obj.image) {
        // Only draw placeholder if there's no image defined (not just waiting to load)
        // Draw button background
        ctx.fillStyle = isHovered ? 'rgba(179, 230, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

        // Draw dashed border
        ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.setLineDash([]);

        // Draw label with shadow
        if (obj.showTitle !== false && obj.label) {
          ctx.save();
          const placeholderFontSize = FontSettingsStore.getScaledFontSize(20);
          ctx.font = `${placeholderFontSize}px SuperStitch`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          const labelText = obj.label.toUpperCase();

          // Draw black shadow (offset)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillText(labelText, obj.x + obj.width / 2 + 0.5, obj.y + obj.height / 2 + 5.5);

          // Draw main text
          ctx.fillStyle = FontSettingsStore.getFontColor('#403F3E');
          ctx.fillText(labelText, obj.x + obj.width / 2, obj.y + obj.height / 2 + 5);
          ctx.restore();
        }
      }
      // If image exists but not loaded yet, don't draw anything (wait for load)
    };

    // Collect all drawable items and sort by zIndex (lower = behind, higher = in front)
    // Default zIndex is 0 if not specified
    const allDrawables = [
      ...(roomData.backButton ? [roomData.backButton] : []),
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || []),
    ];

    // Sort by zIndex (ascending - lower values drawn first/behind)
    allDrawables.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    // Draw all items in z-order
    allDrawables.forEach(drawButton);

    // Draw debug labels on top of everything (centered on object)
    if (debugLabels.length > 0) {
      ctx.save();
      const debugFontSize = FontSettingsStore.getScaledFontSize(18);
      ctx.font = `${debugFontSize}px SuperStitch`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      debugLabels.forEach(({ labelText, centerX, centerY }) => {
        const textWidth = ctx.measureText(labelText).width;
        const padding = FontSettingsStore.getScaledSpacing(6);
        const boxHeight = FontSettingsStore.getScaledSpacing(22);

        // White background centered on object
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(centerX - textWidth / 2 - padding, centerY - boxHeight / 2, textWidth + padding * 2, boxHeight);
        // Red border
        ctx.strokeStyle = 'rgba(200, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - textWidth / 2 - padding, centerY - boxHeight / 2, textWidth + padding * 2, boxHeight);
        // Text centered
        ctx.fillStyle = FontSettingsStore.getFontColor('#000');
        ctx.fillText(labelText, centerX, centerY);
      });
      ctx.restore();
    }

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Draw other players
    characterStore.otherPlayersArray.forEach(player => {
      if (player.position) {
        const size = avatarSize;
        const borderRadius = 8 * avatarSizeMultiplier;

        // Get border color from player's avatar color or use default
        const getBorderColor = (hexColor, opacity = 0.7) => {
          if (!hexColor) return `rgba(92, 90, 88, ${opacity})`;
          const hex = hexColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const borderColor = getBorderColor(player.avatarColor, 0.7);

        // Helper: draw this other player's avatar at a given position
        const drawOtherAt = (pos, showExtras) => {
          const parentAlpha = ctx.globalAlpha;
          const dx = pos.x - size / 2;
          const dy = pos.y - size / 2;

          // Draw outer background (white)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          drawRoundedRect(dx - 2, dy - 2, size + 4, size + 4, borderRadius + 2);
          ctx.fill();

          // Draw outer dashed border (using player's color)
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          drawRoundedRect(dx - 2, dy - 2, size + 4, size + 4, borderRadius + 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw avatar image if loaded, otherwise placeholder
          if (player.avatarUrl && avatarImages[player.avatarUrl]) {
            const img = avatarImages[player.avatarUrl];
            ctx.save();
            drawRoundedRect(dx, dy, size, size, borderRadius);
            ctx.clip();
            ctx.drawImage(img, dx, dy, size, size);
            ctx.restore();
          } else {
            ctx.save();
            drawRoundedRect(dx, dy, size, size, borderRadius);
            ctx.clip();
            ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(92, 90, 88, 0.4)';
            ctx.fillText('?', pos.x, pos.y);
            ctx.restore();
          }

          // Draw inner dashed border (using player's color)
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          drawRoundedRect(dx + 2, dy + 2, size - 4, size - 4, borderRadius - 2);
          ctx.stroke();
          ctx.setLineDash([]);

          if (!showExtras) return;

          // Draw emote if present
          if (player.emote) {
            const emoteSize = avatarSize;
            const opacity = player.emoteOpacity !== undefined ? player.emoteOpacity : 1;
            ctx.save();
            ctx.globalAlpha = parentAlpha * opacity;

            const emoteFontSize = 20 * avatarSizeMultiplier;
            const textWidth = measureEmote(ctx, player.emote, emoteFontSize);

            const bubbleWidth = textWidth + 12 * avatarSizeMultiplier;
            const bubbleHeight = 28 * avatarSizeMultiplier;
            const bubbleX = pos.x - bubbleWidth / 2 + 16 * avatarSizeMultiplier;
            const bubbleY = pos.y - emoteSize / 2 - 40 * avatarSizeMultiplier;
            const eBorderRadius = 6 * avatarSizeMultiplier;
            const tailTipY = pos.y - emoteSize / 2 - 6 * avatarSizeMultiplier;
            const tailBaseY = bubbleY + bubbleHeight;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, eBorderRadius + 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, eBorderRadius + 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.save();
            drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, eBorderRadius);
            ctx.clip();
            ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            drawRoundedRect(bubbleX + 2, bubbleY + 2, bubbleWidth - 4, bubbleHeight - 4, eBorderRadius - 2);
            ctx.stroke();
            ctx.setLineDash([]);

            const tailWidth = 4;
            const tailLeftX = bubbleX + 12;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.moveTo(tailLeftX, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(tailLeftX, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY);
            ctx.moveTo(tailLeftX + tailWidth, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY);
            ctx.stroke();
            ctx.setLineDash([]);

            drawEmote(ctx, player.emote, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2, emoteFontSize);
            ctx.restore();
          }

          // Draw username below character
          ctx.save();
          const otherUsernameFontSize = FontSettingsStore.getScaledFontSize(12);
          ctx.font = `${otherUsernameFontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(92, 90, 88, 0.55)';
          ctx.shadowBlur = 0.5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = FontSettingsStore.getFontColor('rgba(0, 0, 0, 0.7)');
          ctx.fillText(player.username || 'Player', pos.x, pos.y + avatarSize / 2 + FontSettingsStore.getScaledSpacing(9) * avatarSizeMultiplier);
          ctx.restore();
        };

        // Animate move if active, otherwise draw normally
        const ma = player.moveAnim;
        if (ma?.active && ma.oldPos) {
          const elapsed = Date.now() - ma.startTime;

          // Ghost at old position
          const ghostAlpha = moveAnimValue(MOVE_ANIM.ghost.fade, elapsed);
          const ghostScale = moveAnimValue(MOVE_ANIM.ghost.scale, elapsed);
          ctx.save();
          ctx.globalAlpha = Math.max(0, ghostAlpha);
          ctx.translate(ma.oldPos.x, ma.oldPos.y);
          ctx.scale(ghostScale, ghostScale);
          ctx.translate(-ma.oldPos.x, -ma.oldPos.y);
          drawOtherAt(ma.oldPos, false);
          ctx.restore();

          // Trail between old and new position
          const trailProgress = Math.min(1, elapsed / MOVE_ANIM_DURATION);
          const trailFade = 1 - trailProgress;
          const trailMul = trailBrightnessMul(player.avatarColor);
          for (let i = 1; i <= 15; i++) {
            const t = i / 16;
            const tx = ma.oldPos.x + (player.position.x - ma.oldPos.x) * t;
            const ty = ma.oldPos.y + (player.position.y - ma.oldPos.y) * t;
            const trailAlpha = 0.04 * trailMul * trailFade * (0.4 + 0.6 * t);
            ctx.save();
            ctx.globalAlpha = Math.max(0, trailAlpha);
            drawOtherAt({ x: tx, y: ty }, false);
            ctx.restore();
          }

          // Real at new position
          const realAlpha = moveAnimValue(MOVE_ANIM.real.fade, elapsed);
          const realScale = moveAnimValue(MOVE_ANIM.real.scale, elapsed);
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, realAlpha));
          ctx.translate(player.position.x, player.position.y);
          ctx.scale(realScale, realScale);
          ctx.translate(-player.position.x, -player.position.y);
          drawOtherAt(player.position, true);
          ctx.restore();
        } else {
          drawOtherAt(player.position, true);
        }
      }
    });

    // Draw current player
    if (characterPosition) {
      const anim = moveAnimRef.current;
      const size = avatarSize;
      const borderRadius = 8 * avatarSizeMultiplier;

      // Get border color from player's avatar color or use default
      const getMyBorderColor = (hexColor, opacity = 0.8) => {
        if (!hexColor) return `rgba(179, 230, 255, ${opacity})`;
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };
      const myBorderColor = getMyBorderColor(profileStore.avatarColor, 0.8);

      // Helper: draw avatar at a given position with alpha + scale
      const drawAvatarAt = (pos, alpha, scale, showExtras) => {
        const parentAlpha = ctx.globalAlpha;
        ctx.save();
        ctx.globalAlpha = parentAlpha * alpha;
        ctx.translate(pos.x, pos.y);
        ctx.scale(scale, scale);
        ctx.translate(-pos.x, -pos.y);

        const dx = pos.x - size / 2;
        const dy = pos.y - size / 2;

        // Glow
        ctx.shadowColor = 'rgba(179, 230, 255, 0.6)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Outer background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        drawRoundedRect(dx - 2, dy - 2, size + 4, size + 4, borderRadius + 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer dashed border
        ctx.strokeStyle = myBorderColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        drawRoundedRect(dx - 2, dy - 2, size + 4, size + 4, borderRadius + 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Avatar image or placeholder
        if (profileStore.avatarUrl && avatarImages[profileStore.avatarUrl]) {
          const img = avatarImages[profileStore.avatarUrl];
          ctx.save();
          drawRoundedRect(dx, dy, size, size, borderRadius);
          ctx.clip();
          ctx.drawImage(img, dx, dy, size, size);
          ctx.restore();
        } else {
          ctx.save();
          drawRoundedRect(dx, dy, size, size, borderRadius);
          ctx.clip();
          ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = getMyBorderColor(profileStore.avatarColor, 0.6);
          ctx.fillText('?', pos.x, pos.y);
          ctx.restore();
        }

        // Inner dashed border
        ctx.strokeStyle = myBorderColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        drawRoundedRect(dx + 2, dy + 2, size - 4, size - 4, borderRadius - 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Emote + username only on the real avatar
        if (showExtras) {
          if (characterStore.activeEmote) {
            const emoteAlpha = characterStore.emoteOpacity;
            ctx.save();
            ctx.globalAlpha = alpha * emoteAlpha;
            const emoteFontSize = 20 * avatarSizeMultiplier;
            const textWidth = measureEmote(ctx, characterStore.activeEmote, emoteFontSize);
            const bubbleWidth = textWidth + 12 * avatarSizeMultiplier;
            const bubbleHeight = 28 * avatarSizeMultiplier;
            const bubbleX = pos.x - bubbleWidth / 2 + 16 * avatarSizeMultiplier;
            const bubbleY = pos.y - size / 2 - 40 * avatarSizeMultiplier;
            const emoteBorderRadius = 6 * avatarSizeMultiplier;
            const tailTipY = pos.y - size / 2 - 6 * avatarSizeMultiplier;
            const tailBaseY = bubbleY + bubbleHeight;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, emoteBorderRadius + 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(179, 230, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, emoteBorderRadius + 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.save();
            drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, emoteBorderRadius);
            ctx.clip();
            ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = 'rgba(179, 230, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            drawRoundedRect(bubbleX + 2, bubbleY + 2, bubbleWidth - 4, bubbleHeight - 4, emoteBorderRadius - 2);
            ctx.stroke();
            ctx.setLineDash([]);
            const tailWidth = 4 * avatarSizeMultiplier;
            const tailLeftX = bubbleX + 12 * avatarSizeMultiplier;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.moveTo(tailLeftX, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(179, 230, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(tailLeftX, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY);
            ctx.moveTo(tailLeftX + tailWidth, tailBaseY);
            ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY);
            ctx.stroke();
            ctx.setLineDash([]);
            drawEmote(ctx, characterStore.activeEmote, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2, emoteFontSize);
            ctx.restore();
          }

          // Username
          ctx.save();
          const currentUsernameFontSize = FontSettingsStore.getScaledFontSize(12);
          ctx.font = `bold ${currentUsernameFontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(179, 230, 255, 0.8)';
          ctx.shadowBlur = 0.5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = FontSettingsStore.getFontColor('rgba(0, 0, 0, 0.9)');
          ctx.fillText(profileStore.username || 'You', pos.x, pos.y + size / 2 + FontSettingsStore.getScaledSpacing(9));
          ctx.restore();
        }

        ctx.restore(); // end transform
      };

      if (anim.active && anim.oldPos && anim.newPos) {
        const elapsed = Date.now() - anim.startTime;

        // Ghost (clone at old position)
        const ghostAlpha = moveAnimValue(MOVE_ANIM.ghost.fade, elapsed);
        const ghostScale = moveAnimValue(MOVE_ANIM.ghost.scale, elapsed);
        ctx.save();
        ctx.globalAlpha = Math.max(0, ghostAlpha);
        ctx.translate(anim.oldPos.x, anim.oldPos.y);
        ctx.scale(ghostScale, ghostScale);
        ctx.translate(-anim.oldPos.x, -anim.oldPos.y);
        drawAvatarAt(anim.oldPos, 1, 1, false);
        ctx.restore();

        // Trail between old and new position
        const trailProgress = Math.min(1, elapsed / MOVE_ANIM_DURATION);
        const trailFade = 1 - trailProgress;
        const trailMul = trailBrightnessMul(profileStore.avatarColor);
        for (let i = 1; i <= 15; i++) {
          const t = i / 16;
          const tx = anim.oldPos.x + (anim.newPos.x - anim.oldPos.x) * t;
          const ty = anim.oldPos.y + (anim.newPos.y - anim.oldPos.y) * t;
          const trailAlpha = 0.04 * trailMul * trailFade * (0.4 + 0.6 * t);
          ctx.save();
          ctx.globalAlpha = Math.max(0, trailAlpha);
          drawAvatarAt({ x: tx, y: ty }, 1, 1, false);
          ctx.restore();
        }

        // Real (original at new position)
        const realAlpha = moveAnimValue(MOVE_ANIM.real.fade, elapsed);
        const realScale = moveAnimValue(MOVE_ANIM.real.scale, elapsed);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, realAlpha));
        ctx.translate(anim.newPos.x, anim.newPos.y);
        ctx.scale(realScale, realScale);
        ctx.translate(-anim.newPos.x, -anim.newPos.y);
        drawAvatarAt(anim.newPos, 1, 1, true);
        ctx.restore();
      } else {
        drawAvatarAt(characterPosition, 1, 1, true);
      }
    }

    // Draw emote menu if open
    if (isEmoteMenuOpen && characterPosition) {
      const numEmotes = EMOTES.length;
      const radius = 160 * avatarSizeMultiplier;
      const angleStep = (Math.PI * 2) / numEmotes;

      // Draw semi-transparent background circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(characterPosition.x, characterPosition.y, radius + 30 * avatarSizeMultiplier, 0, Math.PI * 2);
      ctx.fill();

      // Draw separator lines between emotes (not going to center)
      ctx.strokeStyle = 'rgba(92, 90, 88, 0.2)';
      ctx.lineWidth = 1;
      EMOTES.forEach((_, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const startX = characterPosition.x + Math.cos(angle) * 80 * avatarSizeMultiplier;
        const startY = characterPosition.y + Math.sin(angle) * 80 * avatarSizeMultiplier;
        const endX = characterPosition.x + Math.cos(angle) * (radius + 20 * avatarSizeMultiplier);
        const endY = characterPosition.y + Math.sin(angle) * (radius + 20 * avatarSizeMultiplier);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      });

      // Draw each emote (offset by half angle step to be between lines)
      const emoteFontSize = 32 * avatarSizeMultiplier;
      EMOTES.forEach((emote, index) => {
        const angle = angleStep * index + angleStep / 2 - Math.PI / 2; // Offset by half step
        const emoteX = characterPosition.x + Math.cos(angle) * radius;
        const emoteY = characterPosition.y + Math.sin(angle) * radius;

        // Use centralized emote drawing (handles images vs text)
        drawEmote(ctx, emote, emoteX, emoteY, emoteFontSize);
      });
    }
  };

  const handleCanvasClick = (event) => {
    if (!roomData || Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (uxStore.isPortrait) {
      // Mobile mode: content is rotated 90deg, so we need to transform click coordinates
      // The visual X becomes canvas Y, visual Y becomes canvas X (inverted)
      const visualX = event.clientX - rect.left;
      const visualY = event.clientY - rect.top;
      // Scale and swap coordinates
      x = (visualY / rect.height) * BASELINE_WIDTH;
      y = BASELINE_HEIGHT - (visualX / rect.width) * BASELINE_HEIGHT;
    } else {
      // Normal mode: scale click coordinates from CSS size to baseline canvas size
      const scaleX = BASELINE_WIDTH / rect.width;
      const scaleY = BASELINE_HEIGHT / rect.height;
      x = (event.clientX - rect.left) * scaleX;
      y = (event.clientY - rect.top) * scaleY;
    }

    // If emote menu is open, check for emote selection
    // Scale emote menu radius for mobile
    const emoteMenuRadius = uxStore.shouldScaleUI ? 160 * 1.5 : 160;
    if (isEmoteMenuOpen && characterPosition) {
      const clickResult = getClickedEmote(x, y, characterPosition.x, characterPosition.y, emoteMenuRadius);

      if (clickResult.type === 'emote') {
        // Send emote to server
        if (WebSocketService.socket) {
          WebSocketService.socket.emit('map:emote', {
            roomId: location,
            emote: clickResult.emote,
            x: characterPosition.x / BASELINE_WIDTH,
            y: characterPosition.y / BASELINE_HEIGHT,
            avatarUrl: profileStore.avatarUrl,
            avatarColor: profileStore.avatarColor,
            username: profileStore.username
          });
        }

        // Set local emote and play sound
        characterStore.setEmote(clickResult.emote);
        playEmoteSound();
        setIsEmoteMenuOpen(false);
        return;
      } else if (clickResult.type === 'close' || clickResult.type === 'outside') {
        setIsEmoteMenuOpen(false);
        return;
      }
    }

    // Check if clicking on own character to open emote menu
    // Calculate avatar size (50% larger when scaled down for mobile)
    const clickAvatarSize = uxStore.avatarSize;
    if (characterPosition && isPointInCharacter(x, y, characterPosition.x, characterPosition.y, clickAvatarSize)) {
      setIsEmoteMenuOpen(true);
      return;
    }

    // Collect all clickable objects (skip decorations - they allow movement through)
    const allObjects = [
      roomData.backButton,
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || [])
    ].filter(obj => obj && obj.type !== 'decoration');

    // Check if click is on an object
    let clickedObject = false;
    const HITBOX_PADDING = 12; // Slightly larger hitbox for easier clicking
    for (const obj of allObjects) {
      // Check if this is the back/home button (scaled 50% larger on mobile)
      const isBackButton = obj.id && (obj.id.startsWith('back-') || obj.id === 'home-hearts');
      const mobileBackScale = (isBackButton && uxStore.shouldScaleUI) ? 1.5 : 1;

      // Images are drawn as squares using width for both dimensions
      // Non-images use their actual width/height
      const drawnWidth = obj.width * mobileBackScale;
      const drawnHeight = (obj.image ? obj.width : obj.height) * mobileBackScale;

      // Hitbox with padding
      const hitX = obj.x - HITBOX_PADDING;
      const hitY = obj.y - HITBOX_PADDING;
      const hitWidth = drawnWidth + HITBOX_PADDING * 2;
      const hitHeight = drawnHeight + HITBOX_PADDING * 2;

      if (x >= hitX && x <= hitX + hitWidth && y >= hitY && y <= hitY + hitHeight) {
        if (obj.navigateTo) {
          // Ensure navigateTo is a string and use push for proper navigation history
          const navPath = typeof obj.navigateTo === 'string' ? obj.navigateTo : obj.navigateTo.pathname || obj.navigateTo.path;
          if (navPath) {
            SoundManager.play('nextPage');
            router.push(navPath);
          }
        } else if (obj.id === 'wishing-well') {
          setIsWishingWellOpen(true);
        } else if (obj.flow === 'weepingWillow') {
          setIsWeepingWillowOpen(true);
        } else if (obj.flow === 'bank' || obj.action === 'openBankModal') {
          setIsBankFlowOpen(true);
        } else if (obj.flow === 'workbook') {
          setWorkbookBookshelfId(obj.flowParams?.bookshelfId || 'default');
          setWorkbookTitle(obj.flowParams?.title || 'Workbook');
          setIsWorkbookOpen(true);
        } else if (obj.description) {
          alert(obj.description); // TODO: Replace with modal
        }
        clickedObject = true;
        break;
      }
    }

    // If didn't click on any object, move character to clicked position
    if (!clickedObject && characterPosition) {
      // Start move animation (skip if reduce animations is on)
      if (!FontSettingsStore.reduceAnimations) {
        moveAnimRef.current = {
          active: true,
          startTime: Date.now(),
          duration: MOVE_ANIM_DURATION,
          oldPos: { ...characterPosition },
          newPos: { x, y },
        };
      }

      // Update local position
      setCharacterPosition({ x, y });
      characterStore.setPosition(location, x, y);

      // Send move command to server
      if (WebSocketService.socket) {
        WebSocketService.socket.emit('map:move', {
          roomId: location,
          x: x / BASELINE_WIDTH,
          y: y / BASELINE_HEIGHT,
          avatarUrl: profileStore.avatarUrl,
          avatarColor: profileStore.avatarColor,
          username: profileStore.username
        });
      }
    }
  };

  const handleCanvasMouseMove = (event) => {
    if (!roomData || Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (uxStore.isPortrait) {
      // Mobile mode: content is rotated 90deg, so we need to transform coordinates
      const visualX = event.clientX - rect.left;
      const visualY = event.clientY - rect.top;
      // Scale and swap coordinates
      x = (visualY / rect.height) * BASELINE_WIDTH;
      y = BASELINE_HEIGHT - (visualX / rect.width) * BASELINE_HEIGHT;
    } else {
      // Normal mode: scale coordinates from CSS size to baseline canvas size
      const scaleX = BASELINE_WIDTH / rect.width;
      const scaleY = BASELINE_HEIGHT / rect.height;
      x = (event.clientX - rect.left) * scaleX;
      y = (event.clientY - rect.top) * scaleY;
    }

    let foundHover = null;

    // Collect all hoverable objects (skip decorations)
    const allObjects = [
      roomData.backButton,
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || [])
    ].filter(obj => obj && obj.type !== 'decoration');

    // Check if mouse is over an object
    const HITBOX_PADDING = 12; // Slightly larger hitbox for easier hovering
    for (const obj of allObjects) {
      // Check if this is the back/home button (scaled 50% larger on mobile)
      const isBackButton = obj.id && (obj.id.startsWith('back-') || obj.id === 'home-hearts');
      const mobileBackScale = (isBackButton && uxStore.shouldScaleUI) ? 1.5 : 1;

      // Images are drawn as squares using width for both dimensions
      // Non-images use their actual width/height
      const drawnWidth = obj.width * mobileBackScale;
      const drawnHeight = (obj.image ? obj.width : obj.height) * mobileBackScale;

      // Hitbox with padding
      const hitX = obj.x - HITBOX_PADDING;
      const hitY = obj.y - HITBOX_PADDING;
      const hitWidth = drawnWidth + HITBOX_PADDING * 2;
      const hitHeight = drawnHeight + HITBOX_PADDING * 2;

      if (x >= hitX && x <= hitX + hitWidth && y >= hitY && y <= hitY + hitHeight) {
        foundHover = obj.id;
        canvas.style.cursor = 'pointer';
        break;
      }
    }

    if (!foundHover) {
      canvas.style.cursor = 'default';
    }

    if (foundHover !== hoveredObject) {
      setHoveredObject(foundHover);
    }
  };

  const handleTouchStart = (event) => {
    if (!roomData || Platform.OS !== 'web' || !isMobile) return;

    const touch = event.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleTouchEnd = (event) => {
    if (!roomData || Platform.OS !== 'web' || !isMobile || !touchStart) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Minimum swipe distance and maximum time for a swipe
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;

    if (deltaTime > maxSwipeTime) {
      setTouchStart(null);
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine swipe direction
    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      let direction = null;

      if (absX > absY) {
        // Horizontal swipe
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Find navigation option for this direction
      if (roomData.navigation && direction) {
        const nav = roomData.navigation.find(n => {
          // Map navigation positions to swipe directions (using baseline dimensions)
          const isLeft = n.x < BASELINE_WIDTH * 0.2;
          const isRight = n.x > BASELINE_WIDTH * 0.8;
          const isTop = n.y < BASELINE_HEIGHT * 0.2;
          const isBottom = n.y > BASELINE_HEIGHT * 0.8;

          if (direction === 'left' && isRight) return true;
          if (direction === 'right' && isLeft) return true;
          if (direction === 'up' && isBottom) return true;
          if (direction === 'down' && isTop) return true;

          return false;
        });

        if (nav && nav.navigateTo) {
          const navPath = typeof nav.navigateTo === 'string' ? nav.navigateTo : nav.navigateTo.pathname || nav.navigateTo.path;
          if (navPath) {
            SoundManager.play('nextPage');
            router.push(navPath);
          }
        }
      }
    }

    setTouchStart(null);
  };

  const handleKnapsackClick = () => {
    inventoryStore.toggleInventory();
  };

  const handleNotificationClick = (notification, nav) => {
    if (nav && nav.flow === 'weepingWillow') {
      setWeepingWillowStartAt(nav.dropId);
      setWeepingWillowParams(nav.params || {});
      setIsWeepingWillowOpen(true);
    }
    // Add other flows here as needed
  };

  const handleWeepingWillowClose = () => {
    setIsWeepingWillowOpen(false);
    // Reset deep link state
    setWeepingWillowStartAt(null);
    setWeepingWillowParams({});
  };


  if (Platform.OS === 'web') {
    // Check if we have a meaningful side panel (letterbox > 60px)
    const hasSidePanel = uxStore.letterboxWidth > 60;

    // Container style — portrait uses rotation, landscape uses straight flexbox
    const containerStyle = uxStore.isPortrait ? {
      position: 'fixed',
      top: 0,
      left: 0,
      width: hasSidePanel ? uxStore.fullWidth : canvasWidth,
      height: canvasHeight, // This is the shorter dimension (screen width)
      transform: `rotate(90deg) translateY(-${canvasHeight}px)`,
      transformOrigin: 'top left',
      backgroundColor: 'transparent',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'row',
    } : hasSidePanel ? {
      // Landscape with sidebar: no rotation, flexbox row
      ...styles.container,
      width: uxStore.fullWidth,
      height: canvasHeight,
      display: 'flex',
      flexDirection: 'row',
    } : {
      // Landscape without sidebar: container matches canvas size exactly
      ...styles.container,
      width: canvasWidth,
      height: canvasHeight,
    };

    // Side panel style for mobile letterbox area (only used when hasSidePanel)
    const sidePanelStyle = hasSidePanel ? {
      width: uxStore.letterboxWidth,
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderLeftWidth: 2,
      borderLeftColor: 'rgba(92, 90, 88, 0.3)',
      borderLeftStyle: 'dashed',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 20,
    } : null;

    // Room background element (only for rooms with custom backgrounds)
    // Uses tiled repeating pattern like TiledBackground
    const roomBackgroundElement = roomData?.background ? (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvasWidth,
          height: canvasHeight,
          backgroundImage: `url(${typeof roomData.background === 'string' ? roomData.background : roomData.background.default || roomData.background.uri || roomData.background})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          backgroundPosition: '0px 0px',
          zIndex: 0,
          filter: 'sepia(60%) saturate(140%) brightness(85%) hue-rotate(-10deg)',
        }}
      />
    ) : null;

    // Shared canvas element
    const canvasElement = (
      <>
        {roomBackgroundElement}
        <canvas
          ref={canvasRef}
          width={BASELINE_WIDTH}
          height={BASELINE_HEIGHT}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'block',
            background: 'transparent',
            width: canvasWidth,
            height: canvasHeight,
            position: roomData?.background ? 'relative' : undefined,
            zIndex: roomData?.background ? 1 : undefined,
          }}
        />
      </>
    );

    // Shared overlay elements (title, UserStatus when not in side panel, menu, inventory, knapsack)
    const overlayElements = (
      <>
        {roomData && roomData.showTitle !== false && (
          <View style={[styles.titleOverlay, uxStore.shouldScaleUI && { top: FontSettingsStore.getScaledSpacing(16) }]}>
            <Text style={[
              styles.roomTitle,
              {
                fontSize: FontSettingsStore.getScaledFontSize(uxStore.shouldScaleUI ? 28 : 42),
                color: FontSettingsStore.getFontColor('#5C5A58'),
              }
            ]}>{roomData.name.toUpperCase()}</Text>
          </View>
        )}
        {!hasSidePanel && <UserStatus />}
        {/* Library navigation overlay */}
        {(location === 'library' || location?.startsWith('library-')) && (
          <LibraryNav currentRoom={location} />
        )}
        {/* Menu container - only show on canvas when no side panel */}
        {!hasSidePanel && (
          <View style={[styles.menuContainer, uxStore.shouldScaleUI && { transform: 'scale(0.8)', transformOrigin: 'top right' }]}>
            <NotificationHeart style={{ marginRight: 10 }} onNotificationClick={handleNotificationClick} />
            <HamburgerMenu
              onShowLayerModal={() => setIsLayerModalOpen(true)}
              onShowSoundSettings={() => setIsSoundSettingsOpen(true)}
              onShowThemeSettings={() => setIsThemeSettingsOpen(true)}
              onShowFontSettings={() => setIsFontSettingsOpen(true)}
              onShowAccessibilitySettings={() => setIsAccessibilitySettingsOpen(true)}
              onShowReportIssue={() => setIsReportIssueOpen(true)}
            />
          </View>
        )}
        {inventoryStore.isOpen && (
          <View style={styles.inventoryPanel}>
            <View style={styles.inventoryHeader}>
              <Text style={styles.inventoryTitle}>Knapsack</Text>
              <button onClick={() => inventoryStore.closeInventory()} style={styles.closeButton}>
                ✕
              </button>
            </View>
            <View style={styles.inventoryGrid}>
              {inventoryStore.items.map((item, index) => (
                <View key={item.uniqueId || `${item.itemId}-${index}`} style={styles.inventorySlot}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity > 1 && (
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  )}
                </View>
              ))}
              {/* Empty slots */}
              {Array.from({ length: inventoryStore.maxSlots - inventoryStore.items.length }).map((_, index) => (
                <View key={`empty-${index}`} style={[styles.inventorySlot, styles.emptySlot]} />
              ))}
            </View>
          </View>
        )}
        {/* Knapsack - only show on canvas when no side panel */}
        {!hasSidePanel && (
          <View style={[styles.knapsackContainer, uxStore.shouldScaleUI && { transform: 'scale(0.7)', transformOrigin: 'bottom right' }]}>
            <button onClick={handleKnapsackClick} style={styles.knapsackButton}>
              <img
                src={typeof knapsackImage === 'string' ? knapsackImage : knapsackImage.default || knapsackImage.uri || knapsackImage}
                alt="Knapsack"
                style={{ width: 72, height: 72, display: 'block' }}
              />
            </button>
          </View>
        )}
      </>
    );

    // Knapsack button component for side panel
    const knapsackButton = (
      <button onClick={handleKnapsackClick} style={{
        ...styles.knapsackButton,
        width: '100%',
        maxWidth: uxStore.letterboxWidth - 24,
      }}>
        <img
          src={typeof knapsackImage === 'string' ? knapsackImage : knapsackImage.default || knapsackImage.uri || knapsackImage}
          alt="Knapsack"
          style={{ width: 56, height: 56, display: 'block' }}
        />
      </button>
    );

    // Modals (always rendered at container level)
    const modals = (
      <>
        <WishingWell
          visible={isWishingWellOpen}
          onClose={() => setIsWishingWellOpen(false)}
        />
        <WeepingWillow
          visible={isWeepingWillowOpen}
          onClose={handleWeepingWillowClose}
          startAt={weepingWillowStartAt}
          initialParams={weepingWillowParams}
        />
        <FlowEngine
          flowDefinition={heartsFlow}
          visible={isBankFlowOpen}
          onClose={() => setIsBankFlowOpen(false)}
        />
        <Workbook
          visible={isWorkbookOpen}
          onClose={() => {
            setIsWorkbookOpen(false);
            setWorkbookBookshelfId(null);
            setWorkbookTitle('Workbook');
          }}
          bookshelfId={workbookBookshelfId}
          title={workbookTitle}
        />
        <LayerSelectModal
          visible={isLayerModalOpen}
          onClose={() => setIsLayerModalOpen(false)}
          onLayerSelected={() => setIsLayerModalOpen(false)}
        />
        <SoundSettingsModal
          visible={isSoundSettingsOpen}
          onClose={() => setIsSoundSettingsOpen(false)}
        />
        <ThemeSettingsModal
          visible={isThemeSettingsOpen}
          onClose={() => setIsThemeSettingsOpen(false)}
        />
        <FontSettingsModal
          visible={isFontSettingsOpen}
          onClose={() => setIsFontSettingsOpen(false)}
        />
        <AccessibilitySettingsModal
          visible={isAccessibilitySettingsOpen}
          onClose={() => setIsAccessibilitySettingsOpen(false)}
          onOpenFontSettings={() => {
            setIsAccessibilitySettingsOpen(false);
            setIsFontSettingsOpen(true);
          }}
        />
        <ReportIssueModal
          visible={isReportIssueOpen}
          onClose={() => setIsReportIssueOpen(false)}
        />
      </>
    );

    return (
      <>
        <View style={containerStyle}>
          <style>{`
            .map-canvas-button:hover {
              transform: scale(1.06) !important;
            }
          `}</style>
          {hasSidePanel ? (
            <>
              {/* Canvas area wrapped for flex layout */}
              <View style={{ position: 'relative', width: canvasWidth, height: canvasHeight }}>
                {canvasElement}
                {overlayElements}
                {/* Mobile overlay panel */}
                {mobileOverlay && (
                  <MobileOverlayPanel
                    type={mobileOverlay}
                    onClose={() => setMobileOverlay(null)}
                    onNotificationClick={handleNotificationClick}
                    onShowLayerModal={() => { setMobileOverlay(null); setIsLayerModalOpen(true); }}
                    onShowSoundSettings={() => { setMobileOverlay(null); setIsSoundSettingsOpen(true); }}
                    onShowThemeSettings={() => { setMobileOverlay(null); setIsThemeSettingsOpen(true); }}
                    onShowFontSettings={() => { setMobileOverlay(null); setIsFontSettingsOpen(true); }}
                    onShowAccessibilitySettings={() => { setMobileOverlay(null); setIsAccessibilitySettingsOpen(true); }}
                    onShowReportIssue={() => { setMobileOverlay(null); setIsReportIssueOpen(true); }}
                  />
                )}
              </View>
              {/* Side panel */}
              <View style={sidePanelStyle}>
                <UserStatus compact />
                {/* Menu buttons in side panel */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <NotificationHeart
                    onNotificationClick={handleNotificationClick}
                    onButtonPress={() => setMobileOverlay(mobileOverlay === 'notifications' ? null : 'notifications')}
                  />
                  <HamburgerMenu
                    onShowLayerModal={() => setIsLayerModalOpen(true)}
                    onShowSoundSettings={() => setIsSoundSettingsOpen(true)}
                    onShowThemeSettings={() => setIsThemeSettingsOpen(true)}
                    onShowFontSettings={() => setIsFontSettingsOpen(true)}
                    onShowAccessibilitySettings={() => setIsAccessibilitySettingsOpen(true)}
                    onShowReportIssue={() => setIsReportIssueOpen(true)}
                    onButtonPress={() => setMobileOverlay(mobileOverlay === 'menu' ? null : 'menu')}
                  />
                </View>
                {/* Knapsack in side panel */}
                <View style={{ marginTop: 'auto', paddingTop: 12 }}>
                  {knapsackButton}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Canvas and overlays directly in container (no wrapper) */}
              {canvasElement}
              {overlayElements}
            </>
          )}
        </View>
        {/* Modals rendered outside rotated container so they stay upright */}
        {modals}
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Map canvas is only available on web</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  titleOverlay: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  roomTitle: {
    fontSize: 42,
    fontFamily: 'SuperStitch',
    color: '#5C5A58',
    opacity: 0.8,
  },
  menuContainer: {
    position: 'absolute',
    top: 20,
    right: 30,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  knapsackContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  knapsackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '3px solid rgba(92, 90, 88, 0.55)',
    borderRadius: 12,
    padding: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryPanel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '3px solid rgba(92, 90, 88, 0.55)',
    borderRadius: 12,
    padding: 20,
    minWidth: 500,
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(92, 90, 88, 0.3)',
  },
  inventoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5C5A58',
  },
  closeButton: {
    fontSize: 24,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#5C5A58',
    cursor: 'pointer',
    padding: 5,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inventorySlot: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
    border: '2px dashed rgba(92, 90, 88, 0.35)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  emptySlot: {
    backgroundColor: 'rgba(92, 90, 88, 0.05)',
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 10,
    color: '#5C5A58',
    textAlign: 'center',
    fontWeight: '600',
  },
  itemQuantity: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5C5A58',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  message: {
    fontSize: 16,
    color: '#5C5A58',
  },
});

export default observer(MapCanvas);
