import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { reaction } from 'mobx';
import inventoryStore from '../stores/InventoryStore';
import profileStore from '../stores/ProfileStore';
import characterStore from '../stores/CharacterStore';
import AuthStore from '../stores/AuthStore';
import UserStatus from './UserStatus';
import WoolButton from './WoolButton';
import HamburgerMenu from './HamburgerMenu';
import NotificationHeart from './NotificationHeart';
import WishingWell from './WishingWell';
import WeepingWillow from './WeepingWillow';
import FlowEngine from './FlowEngine';
import LayerSelectModal from './LayerSelectModal';
import SoundSettingsModal from './SoundSettingsModal';
import ThemeSettingsModal from './ThemeSettingsModal';
import heartsFlow from '../flows/heartsFlow';
import CharacterIcon, { isPointInCharacter } from './CharacterIcon';
import EmoteMenu, { getClickedEmote } from './EmoteMenu';
import { EMOTES, drawEmote, measureEmote } from '../config/emotes';
import WebSocketService from '../services/websocket';
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

// Import images
const knapsackImage = require('../assets/images/knapsack.png');
const wishingWellImage = require('../assets/images/wishing-well.png');
const weepingWillowImage = require('../assets/images/weeping-willow.png');

// Import sounds config and manager
import sounds from '../config/sounds';
import SoundManager from '../services/SoundManager';
import uxStore, { BASELINE_WIDTH, BASELINE_HEIGHT } from '../stores/UXStore';

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
};

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
  const [isEmoteMenuOpen, setIsEmoteMenuOpen] = useState(false);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [characterPosition, setCharacterPosition] = useState(null);
  const [avatarImages, setAvatarImages] = useState({});
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [touchStart, setTouchStart] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [playersRefresh, setPlayersRefresh] = useState(0);

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
          emoteOpacity: p.emoteOpacity
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

    // Find all entities with images (including doors and navigation)
    const allEntities = [
      ...(roomData.entities || []),
      ...(roomData.doors || []),
      ...(roomData.navigation || []),
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

    // Helper function to draw a button/entity
    const drawButton = (obj) => {
      const isHovered = hoveredObject === obj.id;

      // Check if this entity has an image
      // Image may be stored under obj.image (string key) or obj.id (for direct require() results)
      const imageKey = typeof obj.image === 'string' ? obj.image : obj.id;
      if (obj.image && loadedImages[imageKey]) {
        const img = loadedImages[imageKey];

        // Calculate scale based on hover
        const scale = isHovered ? 1.06 : 1;
        const scaledWidth = obj.width * scale;
        const offsetX = (scaledWidth - obj.width) / 2;
        const offsetY = (scaledWidth - obj.width) / 2;

        // Draw the image with scaling
        ctx.drawImage(img, obj.x - offsetX, obj.y - offsetY, scaledWidth, scaledWidth);

        // Draw label below the image with shadow (no box)
        ctx.save();
        ctx.font = '18px ChubbyTrail';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const labelText = obj.label.toUpperCase();

        const textY = obj.y + obj.width + 24; // Position text below image

        // Draw black shadow (offset)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillText(labelText, obj.x + obj.width / 2 + 1, textY + 1);

        // Draw main text
        ctx.fillStyle = '#403F3E';
        ctx.fillText(labelText, obj.x + obj.width / 2, textY);
        ctx.restore();
      } else {
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
        ctx.save();
        ctx.font = '20px ChubbyTrail';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const labelText = obj.label.toUpperCase();

        // Draw black shadow (offset)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(labelText, obj.x + obj.width / 2 + 0.5, obj.y + obj.height / 2 + 5.5);

        // Draw main text
        ctx.fillStyle = '#403F3E';
        ctx.fillText(labelText, obj.x + obj.width / 2, obj.y + obj.height / 2 + 5);
        ctx.restore();
      }
    };

    // Draw back button (for rooms)
    if (roomData.backButton) {
      drawButton(roomData.backButton);
    }

    // Draw navigation buttons (section-to-section)
    if (roomData.navigation) {
      roomData.navigation.forEach(drawButton);
    }

    // Draw doors (room entrances in sections)
    if (roomData.doors) {
      roomData.doors.forEach(drawButton);
    }

    // Draw entities (interactive objects)
    if (roomData.entities) {
      roomData.entities.forEach(drawButton);
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
        const drawX = player.position.x - size / 2;
        const drawY = player.position.y - size / 2;
        const borderRadius = 8 * avatarSizeMultiplier;

        // Get border color from player's avatar color or use default
        const getBorderColor = (hexColor, opacity = 0.7) => {
          if (!hexColor) return `rgba(92, 90, 88, ${opacity})`;
          // Convert hex to rgb
          const hex = hexColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const borderColor = getBorderColor(player.avatarColor, 0.7);

        // Draw outer background (white)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        drawRoundedRect(drawX - 2, drawY - 2, size + 4, size + 4, borderRadius + 2);
        ctx.fill();

        // Draw outer dashed border (using player's color)
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        drawRoundedRect(drawX - 2, drawY - 2, size + 4, size + 4, borderRadius + 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw avatar image if loaded, otherwise placeholder
        if (player.avatarUrl && avatarImages[player.avatarUrl]) {
          const img = avatarImages[player.avatarUrl];

          // Draw avatar (clipped to rounded rectangle)
          ctx.save();
          drawRoundedRect(drawX, drawY, size, size, borderRadius);
          ctx.clip();
          ctx.drawImage(img, drawX, drawY, size, size);
          ctx.restore();
        } else {
          // Draw placeholder background
          ctx.save();
          drawRoundedRect(drawX, drawY, size, size, borderRadius);
          ctx.clip();
          ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
          ctx.fill();
          ctx.restore();

          // Draw placeholder "?"
          ctx.save();
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(92, 90, 88, 0.4)';
          ctx.fillText('?', player.position.x, player.position.y);
          ctx.restore();
        }

        // Draw inner dashed border (using player's color)
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        drawRoundedRect(drawX + 2, drawY + 2, size - 4, size - 4, borderRadius - 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw emote if present
        if (player.emote) {
          const emoteSize = avatarSize;
          const opacity = player.emoteOpacity !== undefined ? player.emoteOpacity : 1;
          ctx.save();
          ctx.globalAlpha = opacity;

          // Measure emote (text or image)
          const emoteFontSize = 20 * avatarSizeMultiplier;
          const textWidth = measureEmote(ctx, player.emote, emoteFontSize);

          // Expression bubble dimensions (offset scaled)
          const bubbleWidth = textWidth + 12 * avatarSizeMultiplier;
          const bubbleHeight = 28 * avatarSizeMultiplier;
          const bubbleX = player.position.x - bubbleWidth / 2 + 16 * avatarSizeMultiplier;
          const bubbleY = player.position.y - emoteSize / 2 - 40 * avatarSizeMultiplier;
          const borderRadius = 6 * avatarSizeMultiplier;
          const tailTipY = player.position.y - emoteSize / 2 - 6 * avatarSizeMultiplier; // gap above avatar
          const tailBaseY = bubbleY + bubbleHeight;

          // Draw outer background for bubble
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, borderRadius + 2);
          ctx.fill();

          // Draw outer dashed border for bubble
          ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, borderRadius + 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw inner bubble with clipping
          ctx.save();
          drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, borderRadius);
          ctx.clip();
          ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
          ctx.fill();
          ctx.restore();

          // Draw inner dashed border for bubble
          ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          drawRoundedRect(bubbleX + 2, bubbleY + 2, bubbleWidth - 4, bubbleHeight - 4, borderRadius - 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw triangle tail (sticking out from lower left corner of bubble)
          const tailWidth = 4;
          const tailLeftX = bubbleX + 12; // 12px from left edge of bubble

          // Draw tail background (triangle pointing down to 2px above avatar)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.moveTo(tailLeftX, tailBaseY); // Top left at bubble bottom
          ctx.lineTo(tailLeftX + tailWidth, tailBaseY); // Top right at bubble bottom
          ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY); // Point at 2px above avatar
          ctx.closePath();
          ctx.fill();

          // Draw tail dashed border
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

          // Draw emote (centered in the bubble)
          drawEmote(ctx, player.emote, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2, emoteFontSize);
          ctx.restore();
        }

        // Draw username below character
        ctx.save();
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Add glow effect
        ctx.shadowColor = 'rgba(92, 90, 88, 0.55)';
        ctx.shadowBlur = 0.5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText(player.username || 'Player', player.position.x, player.position.y + avatarSize / 2 + 9 * avatarSizeMultiplier);
        ctx.restore();
      }
    });

    // Draw current player
    if (characterPosition) {
      const size = avatarSize;
      const drawX = characterPosition.x - size / 2;
      const drawY = characterPosition.y - size / 2;
      const borderRadius = 8 * avatarSizeMultiplier;

      // Draw shadow/glow for current user
      ctx.shadowColor = 'rgba(179, 230, 255, 0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw outer background (white)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      drawRoundedRect(drawX - 2, drawY - 2, size + 4, size + 4, borderRadius + 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Get border color from player's avatar color or use default
      const getMyBorderColor = (hexColor, opacity = 0.8) => {
        if (!hexColor) return `rgba(179, 230, 255, ${opacity})`; // Default sky blue
        // Convert hex to rgb
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      const myBorderColor = getMyBorderColor(profileStore.avatarColor, 0.8);

      // Draw outer dashed border (thicker for current user with their color)
      ctx.strokeStyle = myBorderColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      drawRoundedRect(drawX - 2, drawY - 2, size + 4, size + 4, borderRadius + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw avatar image if loaded, otherwise placeholder
      if (profileStore.avatarUrl && avatarImages[profileStore.avatarUrl]) {
        const img = avatarImages[profileStore.avatarUrl];

        ctx.save();
        drawRoundedRect(drawX, drawY, size, size, borderRadius);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, size, size);
        ctx.restore();
      } else {
        // Draw placeholder background
        ctx.save();
        drawRoundedRect(drawX, drawY, size, size, borderRadius);
        ctx.clip();
        ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
        ctx.fill();
        ctx.restore();

        // Draw placeholder "?"
        ctx.save();
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = getMyBorderColor(profileStore.avatarColor, 0.6);
        ctx.fillText('?', characterPosition.x, characterPosition.y);
        ctx.restore();
      }

      // Draw inner dashed border
      ctx.strokeStyle = myBorderColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      drawRoundedRect(drawX + 2, drawY + 2, size - 4, size - 4, borderRadius - 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw emote if present
      if (characterStore.activeEmote) {
        const opacity = characterStore.emoteOpacity;
        ctx.save();
        ctx.globalAlpha = opacity;

        // Measure emote (text or image)
        const emoteFontSize = 20 * avatarSizeMultiplier;
        const textWidth = measureEmote(ctx, characterStore.activeEmote, emoteFontSize);

        // Expression bubble dimensions (offset scaled)
        const bubbleWidth = textWidth + 12 * avatarSizeMultiplier;
        const bubbleHeight = 28 * avatarSizeMultiplier;
        const bubbleX = characterPosition.x - bubbleWidth / 2 + 16 * avatarSizeMultiplier;
        const bubbleY = characterPosition.y - size / 2 - 40 * avatarSizeMultiplier;
        const emoteBorderRadius = 6 * avatarSizeMultiplier;
        const tailTipY = characterPosition.y - size / 2 - 6 * avatarSizeMultiplier; // gap above avatar
        const tailBaseY = bubbleY + bubbleHeight;

        // Draw outer background for bubble
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, emoteBorderRadius + 2);
        ctx.fill();

        // Draw outer dashed border for bubble (cyan for current player)
        ctx.strokeStyle = 'rgba(179, 230, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        drawRoundedRect(bubbleX - 2, bubbleY - 2, bubbleWidth + 4, bubbleHeight + 4, emoteBorderRadius + 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw inner bubble with clipping
        ctx.save();
        drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, emoteBorderRadius);
        ctx.clip();
        ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
        ctx.fill();
        ctx.restore();

        // Draw inner dashed border for bubble (cyan for current player)
        ctx.strokeStyle = 'rgba(179, 230, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        drawRoundedRect(bubbleX + 2, bubbleY + 2, bubbleWidth - 4, bubbleHeight - 4, emoteBorderRadius - 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw triangle tail (sticking out from lower left corner of bubble)
        const tailWidth = 4 * avatarSizeMultiplier;
        const tailLeftX = bubbleX + 12 * avatarSizeMultiplier;

        // Draw tail background (triangle pointing down to 2px above avatar)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.moveTo(tailLeftX, tailBaseY); // Top left at bubble bottom
        ctx.lineTo(tailLeftX + tailWidth, tailBaseY); // Top right at bubble bottom
        ctx.lineTo(tailLeftX + tailWidth / 2, tailTipY); // Point at 2px above avatar
        ctx.closePath();
        ctx.fill();

        // Draw tail dashed border (cyan for current player)
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

        // Draw emote (centered in the bubble)
        drawEmote(ctx, characterStore.activeEmote, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2, emoteFontSize);
        ctx.restore();
      }

      // Draw username below character
      ctx.save();
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Add glow effect with cyan color for current player
      ctx.shadowColor = 'rgba(179, 230, 255, 0.8)';
      ctx.shadowBlur = 0.5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillText(profileStore.username || 'You', characterPosition.x, characterPosition.y + size / 2 + 9);
      ctx.restore();
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

    // Collect all clickable objects
    const allObjects = [
      roomData.backButton,
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || [])
    ].filter(Boolean);

    // Check if click is on an object
    let clickedObject = false;
    for (const obj of allObjects) {
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
        if (obj.navigateTo) {
          // Ensure navigateTo is a string and use push for proper navigation history
          const navPath = typeof obj.navigateTo === 'string' ? obj.navigateTo : obj.navigateTo.pathname || obj.navigateTo.path;
          if (navPath) {
            router.push(navPath);
          }
        } else if (obj.id === 'wishing-well') {
          setIsWishingWellOpen(true);
        } else if (obj.flow === 'weepingWillow') {
          setIsWeepingWillowOpen(true);
        } else if (obj.action === 'openBankModal') {
          setIsBankFlowOpen(true);
        } else if (obj.description) {
          alert(obj.description); // TODO: Replace with modal
        }
        clickedObject = true;
        break;
      }
    }

    // If didn't click on any object, move character to clicked position
    if (!clickedObject && characterPosition) {
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

    // Collect all hoverable objects
    const allObjects = [
      roomData.backButton,
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || [])
    ].filter(Boolean);

    // Check if mouse is over an object
    for (const obj of allObjects) {
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
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
    // Container style with rotation when in portrait
    // canvasWidth/canvasHeight are already swapped when isPortrait is true
    // So canvasWidth = screen height, canvasHeight = screen width
    const containerStyle = uxStore.isPortrait ? {
      position: 'fixed',
      top: 0,
      left: 0,
      width: canvasWidth,   // This is the taller dimension (screen height)
      height: canvasHeight, // This is the shorter dimension (screen width)
      transform: `rotate(90deg) translateY(-${canvasHeight}px)`,
      transformOrigin: 'top left',
      backgroundColor: 'transparent',
      zIndex: 1,
    } : styles.container;

    return (
      <View style={containerStyle}>
        <style>{`
          .map-canvas-button:hover {
            transform: scale(1.06) !important;
          }
        `}</style>
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
          }}
        />
        {roomData && (
          <View style={[styles.titleOverlay, uxStore.shouldScaleUI && { top: 16 }]}>
            <Text style={[styles.roomTitle, uxStore.shouldScaleUI && { fontSize: 28 }]}>{roomData.name.toUpperCase()}</Text>
          </View>
        )}
        <UserStatus />
        <View style={[styles.menuContainer, uxStore.shouldScaleUI && { transform: 'scale(0.8)', transformOrigin: 'top right' }]}>
          <NotificationHeart style={{ marginRight: 10 }} onNotificationClick={handleNotificationClick} />
          <HamburgerMenu
            onShowLayerModal={() => setIsLayerModalOpen(true)}
            onShowSoundSettings={() => setIsSoundSettingsOpen(true)}
            onShowThemeSettings={() => setIsThemeSettingsOpen(true)}
          />
        </View>
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
        <View style={[styles.knapsackContainer, uxStore.shouldScaleUI && { transform: 'scale(0.7)', transformOrigin: 'bottom right' }]}>
          <button onClick={handleKnapsackClick} style={styles.knapsackButton}>
            <img
              src={typeof knapsackImage === 'string' ? knapsackImage : knapsackImage.default || knapsackImage.uri || knapsackImage}
              alt="Knapsack"
              style={{ width: 72, height: 72, display: 'block' }}
            />
          </button>
        </View>
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
      </View>
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
    fontFamily: 'ChubbyTrail',
    color: '#5C5A58',
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
