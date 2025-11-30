// Sound configuration for the app
// Adjust volumes and parameters here to rebalance sounds
//
// Parameters:
// - file: required, the sound file
// - volume: fixed volume (use this OR minVolume/maxVolume)
// - minVolume: minimum volume for random range (0-1)
// - maxVolume: maximum volume for random range (0-1)
// - repeat: number of times to repeat (-1 or 0 = loop forever, 1 = play once, 2 = play twice, etc.)
// - chance: probability of playing (0-1, default 1 = always play)
// - luckProtection: bonus added to chance per failed roll (e.g., 0.2 = +20% per fail)
// - fade: if true, fade in on play and fade out on stop
// - fadeDuration: fade duration in ms (default 500)
// - duration: sound duration in ms (used to prevent overlap for looping sounds)

export const sounds = {
  emote: {
    file: require('../assets/sounds/notification.mp3'),
    volume: 0.6,
    fade: true,
    fadeDuration: 24,
  },
  openActivity: {
    file: require('../assets/sounds/open-activity.mp3'),
    volume: 1,
  },
  closeActivity: {
    file: require('../assets/sounds/close-activity.mp3'),
    volume: 1,
  },
  weepingWillow: {
    file: require('../assets/sounds/weepingwillow.mp3'),
    volume: 0.15,
    repeat: 0, // Loop forever
    fade: true,
    fadeDuration: 1500,
  },
  weepingWillowRandom: {
    file: require('../assets/sounds/weepingwillow.mp3'),
    minVolume: 0.08,
    maxVolume: 0.12,
    repeat: 0, // Loop forever
    fade: true,
    fadeDuration: 1500,
  },
  wishingWell: {
    file: require('../assets/sounds/wishingwell.wav'),
    volume: 1,
  },
  campfire: {
    file: require('../assets/sounds/campfire.mp3'),
    volume: 0.048,
    repeat: 0, // Loop forever
    fade: true,
    fadeDuration: 1000,
    duration: 8000,
  },
  campfireRandom1: {
    file: require('../assets/sounds/campfire-random1.mp3'),
    minVolume: 0.04,
    maxVolume: 0.08,
    chance: 0.6,
    luckProtection: 0.2, // +20% per failed roll
    duration: 8000,
  },
  campfireRandom2: {
    file: require('../assets/sounds/campfire-random2.mp3'),
    minVolume: 0.04,
    maxVolume: 0.08,
    chance: 0.6,
    luckProtection: 0.2, // +20% per failed roll
    duration: 8000,
  },
  // Cafe ambient group - picks random sound from pool, loops forever
  cafeAmbientGroup: {
    type: 'group',
    sounds: [
      { file: require('../assets/sounds/cafe-random1.mp3'), volume: 0.4 },
      { file: require('../assets/sounds/cafe-random2.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random3.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random4.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random6.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random7.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random8.mp3'), volume: 1 },
    ],
    volume: 0.15,
    repeat: 0, // Loop forever (picks new random each time)
    fade: true,
    fadeDuration: 1000,
  },
  // Cafe overlay group - random chance-based sounds
  cafeOverlayGroup: {
    type: 'group',
    sounds: [
      { file: require('../assets/sounds/cafe-random2.mp3'), volume: 2.5 },
      { file: require('../assets/sounds/cafe-random5.mp3'), volume: 1.3 },
      { file: require('../assets/sounds/cafe-random6.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random7.mp3'), volume: 1 },
      { file: require('../assets/sounds/cafe-random8.mp3'), volume: 1 },
    ],
    minVolume: 0.1,
    maxVolume: 0.2,
    chance: 0.4,
    luckProtection: 0.1,
  },
};

export default sounds;
