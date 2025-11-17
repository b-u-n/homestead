import { makeAutoObservable } from 'mobx';
import { Platform } from 'react-native';

class CharacterStore {
  // Character positions per room (roomId -> {x, y})
  positions = {};

  // Current active emote
  activeEmote = null;
  emoteTimestamp = null;
  emoteOpacity = 1;
  emoteAnimationFrame = null;

  // Other players' data (socketId -> {position, emote, avatarUrl, username, emoteOpacity})
  otherPlayers = {};

  constructor() {
    makeAutoObservable(this);

    // Load positions from localStorage on web
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const savedPositions = localStorage.getItem('characterPositions');
        if (savedPositions) {
          this.positions = JSON.parse(savedPositions);
        }
      } catch (error) {
        console.error('Error loading character positions:', error);
      }
    }
  }

  // Get position for a specific room, or return center position
  getPosition(roomId, canvasWidth, canvasHeight) {
    if (this.positions[roomId]) {
      return this.positions[roomId];
    }

    // Default to center
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };
  }

  // Set position for a specific room
  setPosition(roomId, x, y) {
    this.positions[roomId] = { x, y };

    // Save to localStorage on web
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('characterPositions', JSON.stringify(this.positions));
      } catch (error) {
        console.error('Error saving character positions:', error);
      }
    }
  }

  // Set active emote
  setEmote(emote) {
    this.activeEmote = emote;
    this.emoteTimestamp = Date.now();
    this.emoteOpacity = 1;

    // Cancel any existing animation
    if (this.emoteAnimationFrame) {
      cancelAnimationFrame(this.emoteAnimationFrame);
    }

    // Start fade after 3 seconds, fade duration 1.2 seconds
    const fadeStartTime = Date.now() + 3000;
    const fadeDuration = 1200;

    const animate = () => {
      const now = Date.now();

      if (now < fadeStartTime) {
        // Still showing at full opacity
        this.emoteOpacity = 1;
        this.emoteAnimationFrame = requestAnimationFrame(animate);
      } else {
        // Fading
        const fadeElapsed = now - fadeStartTime;
        const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);

        // Quadratic ease out: 1 - (1-t)^2
        const easedProgress = 1 - Math.pow(1 - fadeProgress, 2);
        this.emoteOpacity = 1 - easedProgress;

        if (fadeProgress < 1) {
          this.emoteAnimationFrame = requestAnimationFrame(animate);
        } else {
          // Fade complete
          this.activeEmote = null;
          this.emoteTimestamp = null;
          this.emoteOpacity = 1;
          this.emoteAnimationFrame = null;
        }
      }
    };

    this.emoteAnimationFrame = requestAnimationFrame(animate);
  }

  // Clear active emote
  clearEmote() {
    if (this.emoteAnimationFrame) {
      cancelAnimationFrame(this.emoteAnimationFrame);
      this.emoteAnimationFrame = null;
    }
    this.activeEmote = null;
    this.emoteTimestamp = null;
    this.emoteOpacity = 1;
  }

  // Update other player data
  updateOtherPlayer(socketId, data) {
    const existingPlayer = this.otherPlayers[socketId] || {};
    this.otherPlayers[socketId] = {
      ...existingPlayer,
      ...data
    };

    // If emote was updated, start fade animation for this player
    if (data.emote && data.emote !== existingPlayer.emote) {
      this.otherPlayers[socketId].emoteOpacity = 1;
      this.otherPlayers[socketId].emoteTimestamp = Date.now();

      // Start fade animation for this player's emote
      const fadeStartTime = Date.now() + 3000;
      const fadeDuration = 1200;

      const animate = () => {
        const player = this.otherPlayers[socketId];
        if (!player || !player.emote) return;

        const now = Date.now();

        if (now < fadeStartTime) {
          player.emoteOpacity = 1;
          requestAnimationFrame(animate);
        } else {
          const fadeElapsed = now - fadeStartTime;
          const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);

          // Quadratic ease out: 1 - (1-t)^2
          const easedProgress = 1 - Math.pow(1 - fadeProgress, 2);
          player.emoteOpacity = 1 - easedProgress;

          if (fadeProgress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Fade complete
            if (this.otherPlayers[socketId]) {
              this.otherPlayers[socketId].emote = null;
              this.otherPlayers[socketId].emoteOpacity = 1;
            }
          }
        }
      };

      requestAnimationFrame(animate);
    }
  }

  // Remove other player
  removeOtherPlayer(socketId) {
    delete this.otherPlayers[socketId];
  }

  // Clear all other players (e.g., when changing rooms)
  clearOtherPlayers() {
    this.otherPlayers = {};
  }

  // Get all other players as array
  get otherPlayersArray() {
    return Object.entries(this.otherPlayers).map(([socketId, data]) => ({
      socketId,
      ...data
    }));
  }
}

export default new CharacterStore();
