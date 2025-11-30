import { Audio } from 'expo-av';
import sounds from '../config/sounds';
import SoundSettingsStore from '../stores/SoundSettingsStore';

/**
 * SoundManager - Cross-platform audio using expo-av
 * Supports: fade in/out, looping, chance-based playback, luck protection
 * Integrates with SoundSettingsStore for user-configurable overrides
 *
 * Usage:
 *   const instance = SoundManager.createInstance('campfire');
 *   await instance.play();      // Always plays
 *   await instance.tryPlay();   // Respects chance, returns true/false
 *   await instance.stop();      // Stops with fade if configured
 *   await instance.fadeOut();   // Fade out and stop
 */

// Default fade duration in ms
const DEFAULT_FADE_DURATION = 500;

class SoundManagerClass {
  constructor() {
    // Track all active instances for cleanup
    this.activeInstances = new Set();
    this.initialized = false;
    // Shared recent picks per group key (prevents same sound across instances)
    this.groupRecentPicks = {};
  }

  /**
   * Get shared recent picks for a group
   */
  getGroupRecentPicks(soundKey) {
    if (!this.groupRecentPicks[soundKey]) {
      this.groupRecentPicks[soundKey] = [];
    }
    return this.groupRecentPicks[soundKey];
  }

  /**
   * Add to shared recent picks for a group
   */
  addGroupRecentPick(soundKey, index, maxHistory = 2) {
    if (!this.groupRecentPicks[soundKey]) {
      this.groupRecentPicks[soundKey] = [];
    }
    this.groupRecentPicks[soundKey].push(index);
    if (this.groupRecentPicks[soundKey].length > maxHistory) {
      this.groupRecentPicks[soundKey].shift();
    }
  }

  /**
   * Initialize audio mode (call once at app start)
   */
  async init() {
    if (this.initialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Create a sound instance with its own state
   * @param {string} soundKey - Key from sounds config
   * @returns {SoundInstance|SoundGroupInstance}
   */
  createInstance(soundKey) {
    const config = sounds[soundKey];
    if (!config) {
      console.warn(`Sound "${soundKey}" not found in config`);
      return new SoundInstance(null, soundKey, this);
    }
    // Handle group type
    if (config.type === 'group') {
      return new SoundGroupInstance(config, soundKey, this);
    }
    return new SoundInstance(config, soundKey, this);
  }

  /**
   * Play a sound once (simple helper)
   * @param {string} soundKey - Key from sounds config
   */
  async play(soundKey) {
    const instance = this.createInstance(soundKey);
    await instance.play();
    return instance;
  }

  /**
   * Stop all sounds
   */
  async stopAll() {
    const promises = [];
    this.activeInstances.forEach(instance => {
      promises.push(instance.stop());
    });
    await Promise.all(promises);
  }

  /**
   * Register an instance as active
   */
  registerInstance(instance) {
    this.activeInstances.add(instance);
  }

  /**
   * Unregister an instance
   */
  unregisterInstance(instance) {
    this.activeInstances.delete(instance);
  }
}

/**
 * Individual sound instance with its own state
 */
class SoundInstance {
  constructor(config, soundKey, manager) {
    this.config = config;
    this.soundKey = soundKey;
    this.manager = manager;
    this.sound = null;
    this.isLoaded = false;
    this._isPlaying = false;

    // Luck protection state
    this.failedAttempts = 0;
    this.baseChance = config?.chance ?? 1;

    // Volume tracking for fades
    this.targetVolume = this.getVolume();
    this.currentVolume = 0;
    this.fadeInterval = null;
  }

  /**
   * Get the effective chance after luck protection adjustments
   */
  getEffectiveChance() {
    const luckBonus = this.config?.luckProtection || 0;
    if (!luckBonus || this.baseChance >= 1) {
      return this.baseChance;
    }

    // Add luckProtection value per failed attempt
    const bonus = this.failedAttempts * luckBonus;
    return Math.min(1, this.baseChance + bonus);
  }

  /**
   * Check if this sound is enabled (via user settings)
   */
  isEnabledByUser() {
    return SoundSettingsStore.isEnabled(this.soundKey);
  }

  /**
   * Get volume (fixed or random within range), with user override applied
   */
  getVolume() {
    let baseVolume;

    if (this.config?.volume !== undefined) {
      baseVolume = this.config.volume;
    } else {
      const min = this.config?.minVolume ?? 0.5;
      const max = this.config?.maxVolume ?? 1;
      baseVolume = min + Math.random() * (max - min);
    }

    // Apply user volume override (multiplier style)
    const userOverride = SoundSettingsStore.getSettings(this.soundKey);
    if (userOverride?.volume !== undefined) {
      // User volume is a multiplier of the base volume
      return baseVolume * userOverride.volume;
    }

    return baseVolume;
  }

  /**
   * Check if sound should loop
   */
  shouldLoop() {
    const repeat = this.config?.repeat;
    return repeat === 0 || repeat === -1;
  }

  /**
   * Check if fade is enabled
   */
  shouldFade() {
    return this.config?.fade === true;
  }

  /**
   * Get fade duration
   */
  getFadeDuration() {
    return this.config?.fadeDuration || DEFAULT_FADE_DURATION;
  }

  /**
   * Load the sound if not already loaded
   */
  async load() {
    if (this.isLoaded || !this.config) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        this.config.file,
        {
          isLooping: this.shouldLoop(),
          volume: this.shouldFade() ? 0 : this.targetVolume,
        }
      );
      this.sound = sound;
      this.isLoaded = true;
      this.currentVolume = this.shouldFade() ? 0 : this.targetVolume;
    } catch (error) {
      console.error(`Error loading sound "${this.soundKey}":`, error);
    }
  }

  /**
   * Try to play the sound (respects chance parameter)
   * @returns {boolean} true if sound played, false if chance failed
   */
  async tryPlay() {
    if (!this.config) return false;

    const effectiveChance = this.getEffectiveChance();
    const roll = Math.random();

    if (roll > effectiveChance) {
      // Failed the roll
      if (this.config.luckProtection) {
        this.failedAttempts++;
      }
      return false;
    }

    // Success - reset luck protection
    this.failedAttempts = 0;
    await this.play();
    return true;
  }

  /**
   * Play the sound (ignores chance, always plays if enabled)
   */
  async play() {
    if (!this.config) return;

    // Check if sound is disabled by user
    if (!this.isEnabledByUser()) {
      return;
    }

    try {
      await this.load();
      if (!this.sound) return;

      this.manager.registerInstance(this);
      this._isPlaying = true;

      await this.sound.playAsync();

      // Fade in if configured
      if (this.shouldFade()) {
        await this.fadeIn();
      }
    } catch (error) {
      console.error(`Error playing sound "${this.soundKey}":`, error);
    }
  }

  /**
   * Fade in to target volume
   */
  async fadeIn(duration = this.getFadeDuration()) {
    if (!this.sound) return;

    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = this.targetVolume / steps;
      let currentStep = 0;

      this.clearFadeInterval();
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        this.currentVolume = Math.min(this.targetVolume, volumeStep * currentStep);

        try {
          await this.sound?.setVolumeAsync(this.currentVolume);
        } catch (e) {}

        if (currentStep >= steps) {
          this.clearFadeInterval();
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Fade out and optionally stop
   */
  async fadeOut(duration = this.getFadeDuration(), stopAfter = true) {
    if (!this.sound) return;

    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const startVolume = this.currentVolume;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      this.clearFadeInterval();
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        this.currentVolume = Math.max(0, startVolume - (volumeStep * currentStep));

        try {
          await this.sound?.setVolumeAsync(this.currentVolume);
        } catch (e) {}

        if (currentStep >= steps) {
          this.clearFadeInterval();
          if (stopAfter) {
            await this.stop(false); // Don't fade again
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Clear any active fade interval
   */
  clearFadeInterval() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  /**
   * Stop playback
   * @param {boolean} fade - Whether to fade out first (default: use config)
   */
  async stop(fade = this.shouldFade()) {
    this.clearFadeInterval();

    if (fade && this._isPlaying && this.currentVolume > 0) {
      await this.fadeOut(this.getFadeDuration(), false);
    }

    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (e) {}
      this.sound = null;
    }

    this.isLoaded = false;
    this._isPlaying = false;
    this.manager.unregisterInstance(this);
  }

  /**
   * Set volume (0-1)
   */
  async setVolume(volume) {
    this.targetVolume = Math.max(0, Math.min(1, volume));
    this.currentVolume = this.targetVolume;
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(this.targetVolume);
      } catch (e) {}
    }
  }

  /**
   * Check if currently playing
   */
  isPlaying() {
    return this._isPlaying;
  }

  /**
   * Pause playback
   */
  async pause() {
    if (this.sound && this._isPlaying) {
      try {
        await this.sound.pauseAsync();
        this._isPlaying = false;
      } catch (e) {}
    }
  }

  /**
   * Resume playback
   */
  async resume() {
    if (this.sound && !this._isPlaying) {
      try {
        await this.sound.playAsync();
        this._isPlaying = true;
      } catch (e) {}
    }
  }
}

/**
 * Sound group instance - randomly picks from a pool of sounds
 * When one sound ends, it picks another random one from the pool
 */
class SoundGroupInstance {
  constructor(config, soundKey, manager) {
    this.config = config;
    this.soundKey = soundKey;
    this.manager = manager;
    this.sound = null;
    this.isLoaded = false;
    this._isPlaying = false;
    this._isStopped = false;

    // Luck protection state
    this.failedAttempts = 0;
    this.baseChance = config?.chance ?? 1;

    // Volume tracking for fades
    this.targetVolume = this.getVolume();
    this.currentVolume = 0;
    this.fadeInterval = null;

    // Current sound file from the group
    this.currentSoundFile = null;
  }

  /**
   * Pick a random sound from the group
   * Returns { file, volumeMultiplier, index }
   * Avoids picking the same sound as the last 2 plays (shared across all instances of this group)
   */
  pickRandomSound(forceIndex = null) {
    const soundFiles = this.config.sounds;
    if (!soundFiles || soundFiles.length === 0) return null;

    let index;

    if (forceIndex !== null && forceIndex >= 0 && forceIndex < soundFiles.length) {
      // Use forced index (for initial play)
      index = forceIndex;
    } else {
      // Get shared recent picks for this group
      const recentPicks = this.manager.getGroupRecentPicks(this.soundKey);

      // Build list of available indices (exclude recent picks)
      let availableIndices = [];
      for (let i = 0; i < soundFiles.length; i++) {
        if (!recentPicks.includes(i)) {
          availableIndices.push(i);
        }
      }

      // If all are excluded (shouldn't happen with 3+ sounds), use all
      if (availableIndices.length === 0) {
        availableIndices = soundFiles.map((_, i) => i);
      }

      index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    const sound = soundFiles[index];

    // Update shared recent picks (keep last 2)
    this.manager.addGroupRecentPick(this.soundKey, index, 2);

    // Random volume variation +/- 20%
    const volumeVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

    // Support both simple file references and objects with file + volume
    if (typeof sound === 'object' && sound.file) {
      return { file: sound.file, volumeMultiplier: (sound.volume ?? 1) * volumeVariation, index };
    }
    return { file: sound, volumeMultiplier: volumeVariation, index };
  }

  /**
   * Get the effective chance after luck protection adjustments
   */
  getEffectiveChance() {
    const luckBonus = this.config?.luckProtection || 0;
    if (!luckBonus || this.baseChance >= 1) {
      return this.baseChance;
    }
    const bonus = this.failedAttempts * luckBonus;
    return Math.min(1, this.baseChance + bonus);
  }

  /**
   * Check if this sound is enabled (via user settings)
   */
  isEnabledByUser() {
    return SoundSettingsStore.isEnabled(this.soundKey);
  }

  /**
   * Get volume (fixed or random within range), with user override applied
   */
  getVolume() {
    let baseVolume;

    if (this.config?.volume !== undefined) {
      baseVolume = this.config.volume;
    } else {
      const min = this.config?.minVolume ?? 0.5;
      const max = this.config?.maxVolume ?? 1;
      baseVolume = min + Math.random() * (max - min);
    }

    const userOverride = SoundSettingsStore.getSettings(this.soundKey);
    if (userOverride?.volume !== undefined) {
      return baseVolume * userOverride.volume;
    }

    return baseVolume;
  }

  /**
   * Check if sound should loop (for groups, we handle looping manually)
   */
  shouldLoop() {
    const repeat = this.config?.repeat;
    return repeat === 0 || repeat === -1;
  }

  shouldFade() {
    return this.config?.fade === true;
  }

  getFadeDuration() {
    return this.config?.fadeDuration || DEFAULT_FADE_DURATION;
  }

  /**
   * Load a specific sound file
   */
  async loadSound(soundFile) {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (e) {}
      this.sound = null;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        {
          isLooping: false, // We handle looping manually for groups
          volume: this.shouldFade() ? 0 : this.targetVolume,
        }
      );
      this.sound = sound;
      this.isLoaded = true;
      this.currentVolume = this.shouldFade() ? 0 : this.targetVolume;

      // Set up callback for when sound finishes
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish && !this._isStopped && this.shouldLoop()) {
          this.playNextRandom();
        }
      });
    } catch (error) {
      console.error(`Error loading sound from group "${this.soundKey}":`, error);
    }
  }

  /**
   * Play the next random sound from the group
   */
  async playNextRandom() {
    if (this._isStopped) return;
    if (!this.isEnabledByUser()) return;

    // Pick new sound
    const picked = this.pickRandomSound();
    if (!picked) return;

    this.currentSoundFile = picked.file;
    this.currentVolumeMultiplier = picked.volumeMultiplier;

    // Update volume for potential random range, with per-sound multiplier
    this.targetVolume = this.getVolume() * this.currentVolumeMultiplier;

    // Load the new sound (this unloads the old one in loadSound)
    await this.loadSound(this.currentSoundFile);
    if (!this.sound || this._isStopped) return;

    try {
      await this.sound.playAsync();
      this._isPlaying = true;

      if (this.shouldFade()) {
        await this.fadeIn();
      }
    } catch (error) {
      console.error(`Error playing sound from group "${this.soundKey}":`, error);
    }
  }

  /**
   * Try to play the sound (respects chance parameter)
   */
  async tryPlay() {
    if (!this.config) return false;

    const effectiveChance = this.getEffectiveChance();
    const roll = Math.random();

    if (roll > effectiveChance) {
      if (this.config.luckProtection) {
        this.failedAttempts++;
      }
      return false;
    }

    this.failedAttempts = 0;
    await this.play();
    return true;
  }

  /**
   * Play the sound group (starts with sound at startIndex, default index 6 which is random7)
   */
  async play() {
    console.log(`[SoundGroup] play() called for "${this.soundKey}"`);
    if (!this.config) {
      console.log(`[SoundGroup] No config for "${this.soundKey}"`);
      return;
    }
    if (!this.isEnabledByUser()) {
      console.log(`[SoundGroup] "${this.soundKey}" disabled by user`);
      return;
    }

    this._isStopped = false;
    this.manager.registerInstance(this);

    // First instance starts with index 6 (random7), subsequent instances pick randomly
    const recentPicks = this.manager.getGroupRecentPicks(this.soundKey);
    const isFirstInstance = recentPicks.length === 0;
    const startIndex = isFirstInstance ? (this.config.startIndex ?? 6) : null;
    const picked = this.pickRandomSound(startIndex);
    console.log(`[SoundGroup] Picked sound:`, picked);
    if (!picked) {
      console.log(`[SoundGroup] No sound file picked for "${this.soundKey}"`);
      return;
    }

    this.currentSoundFile = picked.file;
    this.currentVolumeMultiplier = picked.volumeMultiplier;
    this.targetVolume = this.getVolume() * this.currentVolumeMultiplier;

    await this.loadSound(this.currentSoundFile);
    if (!this.sound) {
      console.log(`[SoundGroup] Failed to load sound for "${this.soundKey}"`);
      return;
    }

    try {
      this._isPlaying = true;
      console.log(`[SoundGroup] Playing "${this.soundKey}"`);
      await this.sound.playAsync();

      if (this.shouldFade()) {
        await this.fadeIn();
      }
    } catch (error) {
      console.error(`Error playing sound from group "${this.soundKey}":`, error);
    }
  }

  async fadeIn(duration = this.getFadeDuration()) {
    if (!this.sound) return;

    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = this.targetVolume / steps;
      let currentStep = 0;

      this.clearFadeInterval();
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        this.currentVolume = Math.min(this.targetVolume, volumeStep * currentStep);

        try {
          await this.sound?.setVolumeAsync(this.currentVolume);
        } catch (e) {}

        if (currentStep >= steps) {
          this.clearFadeInterval();
          resolve();
        }
      }, stepDuration);
    });
  }

  async fadeOut(duration = this.getFadeDuration(), stopAfter = true) {
    if (!this.sound) return;

    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const startVolume = this.currentVolume;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      this.clearFadeInterval();
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        this.currentVolume = Math.max(0, startVolume - (volumeStep * currentStep));

        try {
          await this.sound?.setVolumeAsync(this.currentVolume);
        } catch (e) {}

        if (currentStep >= steps) {
          this.clearFadeInterval();
          if (stopAfter) {
            await this.stop(false);
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  clearFadeInterval() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  async stop(fade = this.shouldFade()) {
    this._isStopped = true;
    this.clearFadeInterval();

    if (fade && this._isPlaying && this.currentVolume > 0) {
      await this.fadeOut(this.getFadeDuration(), false);
    }

    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (e) {}
      this.sound = null;
    }

    this.isLoaded = false;
    this._isPlaying = false;
    this.manager.unregisterInstance(this);
  }

  async setVolume(volume) {
    this.targetVolume = Math.max(0, Math.min(1, volume));
    this.currentVolume = this.targetVolume;
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(this.targetVolume);
      } catch (e) {}
    }
  }

  isPlaying() {
    return this._isPlaying;
  }

  async pause() {
    if (this.sound && this._isPlaying) {
      try {
        await this.sound.pauseAsync();
        this._isPlaying = false;
      } catch (e) {}
    }
  }

  async resume() {
    if (this.sound && !this._isPlaying) {
      try {
        await this.sound.playAsync();
        this._isPlaying = true;
      } catch (e) {}
    }
  }
}

const SoundManager = new SoundManagerClass();
export default SoundManager;
export { SoundInstance, SoundGroupInstance };
