# Sound System

The sound system provides cross-platform audio playback for web, iOS, and Android using expo-av.

## Library

**expo-av** - Expo's audio/video library
- Cross-platform (web, iOS, Android)
- Supports looping, volume control
- Handles audio mode configuration

## Architecture

### Files

| File | Purpose |
|------|---------|
| `/frontend/services/SoundManager.js` | Core sound management class |
| `/frontend/config/sounds.js` | Sound definitions and parameters |
| `/frontend/components/MapCanvas.js` | Entity sound triggering |

### SoundManager

Singleton class that manages all audio playback:

```javascript
import SoundManager from '../services/SoundManager';

// Simple playback
await SoundManager.play('emote');

// Instance-based (for loops or controlled playback)
const instance = SoundManager.createInstance('campfire');
await instance.play();
await instance.stop();
```

### SoundInstance

Each sound creates an instance with its own state:
- Volume tracking
- Fade intervals
- Luck protection counters
- Play/stop control

## Sound Configuration

**File**: `/frontend/config/sounds.js`

```javascript
export const sounds = {
  soundKey: {
    file: require('../assets/sounds/file.mp3'),
    volume: 0.5,           // Fixed volume (0-1)
    // OR
    minVolume: 0.04,       // Random volume range min
    maxVolume: 0.08,       // Random volume range max

    repeat: 0,             // 0 or -1 = loop forever, 1 = once
    chance: 0.6,           // Probability of playing (0-1)
    luckProtection: 0.2,   // Bonus per failed roll
    fade: true,            // Enable fade in/out
    fadeDuration: 1000,    // Fade duration in ms
    duration: 8000,        // Sound duration (for overlap prevention)
  }
};
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | require() | Required | Sound file path |
| `volume` | number | - | Fixed volume 0-1 |
| `minVolume` | number | 0.5 | Random range minimum |
| `maxVolume` | number | 1.0 | Random range maximum |
| `repeat` | number | 1 | 0/-1=loop, else play count |
| `chance` | number | 1.0 | Play probability |
| `luckProtection` | number | 0 | Bonus per failed roll |
| `fade` | boolean | false | Enable fade in/out |
| `fadeDuration` | number | 500 | Fade duration ms |
| `duration` | number | - | Used for overlap prevention |

## Entity Sounds

Entities (decorations, interactables) can define sounds:

```javascript
// In location definition
{
  id: 'campfire',
  type: 'decoration',
  sounds: [
    'campfire',                                    // Simple key
    { key: 'campfire', delay: 2000 },             // Delayed start
    { key: 'campfireRandom1', minDelay: 8000, maxDelay: 15000 }  // Random interval
  ]
}
```

### Sound Object Properties

| Property | Description |
|----------|-------------|
| `key` | Sound key from config |
| `delay` | Initial delay before playing (ms) |
| `minDelay` | Min interval for random sounds |
| `maxDelay` | Max interval for random sounds |

## Playback Methods

### SoundManager

```javascript
// Initialize (call once at app start)
await SoundManager.init();

// Play once
const instance = await SoundManager.play('soundKey');

// Create controllable instance
const instance = SoundManager.createInstance('soundKey');

// Stop all sounds
await SoundManager.stopAll();
```

### SoundInstance

```javascript
// Play (ignores chance)
await instance.play();

// Try to play (respects chance)
const didPlay = await instance.tryPlay();

// Stop
await instance.stop();

// Fade
await instance.fadeIn(duration);
await instance.fadeOut(duration);

// Volume
await instance.setVolume(0.5);

// Pause/Resume
await instance.pause();
await instance.resume();

// Check state
instance.isPlaying();
```

## Luck Protection

For chance-based sounds, luck protection prevents long dry spells:

1. Sound has `chance: 0.6` and `luckProtection: 0.2`
2. First attempt: 60% chance
3. If failed, next attempt: 60% + 20% = 80%
4. If failed again: 80% + 20% = 100% (guaranteed)
5. On success, counter resets to base chance

## Fading

When `fade: true`:
- `play()` starts at 0 volume, fades in
- `stop()` fades out, then stops
- Uses 20 steps over fadeDuration

## Initialization

**File**: `/frontend/app/_layout.tsx`

```javascript
useEffect(() => {
  if (fontsLoaded) {
    SoundManager.init();
  }
}, [fontsLoaded]);
```

`init()` configures audio mode:
- `playsInSilentModeIOS: true` - Play even in silent mode
- `staysActiveInBackground: false` - Stop when app backgrounds
- `shouldDuckAndroid: true` - Lower other app audio

## Entity Sound Lifecycle

**File**: `/frontend/components/MapCanvas.js`

```javascript
useEffect(() => {
  if (!roomData) return;

  const state = entitySoundsRef.current;
  if (state.started) return;
  state.started = true;

  // Start sounds for each entity
  for (const entity of entities) {
    if (entity.sounds) {
      // Process sounds array
    }
  }

  return () => {
    // Cleanup: clear timeouts, stop instances
    state.timeouts.forEach(clearTimeout);
    state.instances.forEach(instance => instance.stop());
    state.started = false;
  };
}, [location, roomData]);
```

## Gotchas & Limitations

### Browser Autoplay Policy

**Issue**: Modern browsers block audio autoplay until user interaction.

**Current Behavior**:
- Sounds won't play on initial page load/refresh
- Sounds work after any user interaction (click, touch, keydown)
- Sounds work on room navigation (since user clicked to navigate)

**Why Not "Fixed"**:
Previous attempts to queue sounds until user interaction broke the stop functionality. When cleanup ran, nothing was playing yet. When user clicked, queued sounds would fire after leaving the room.

**Workaround**: Accept that sounds require interaction first. The layer selection modal provides this interaction naturally.

### Overlap Prevention

For random/repeating sounds, use `duration` in config:
- MapCanvas floors random delays to 480ms intervals
- Ensures sounds don't stack/overlap unnaturally

### Memory Management

- `stop()` calls `unloadAsync()` to free resources
- SoundManager tracks active instances in `activeInstances` Set
- Instances are unregistered on stop/unload

### Volume Ranges

Use `minVolume`/`maxVolume` for natural variation:
```javascript
{
  minVolume: 0.04,
  maxVolume: 0.08,
}
```
Each play generates a random volume in range.

### iOS Silent Mode

`playsInSilentModeIOS: true` means sounds play even when device is silenced. Consider this for user experience - ambient sounds may be unwanted.

### Android Audio Focus

`shouldDuckAndroid: true` lowers other app audio when playing. Set to `false` if sounds should layer with music apps.

## Example: Campfire Sound Setup

```javascript
// sounds.js
campfire: {
  file: require('../assets/sounds/campfire.mp3'),
  volume: 0.1,
  repeat: 0,
  fade: true,
  fadeDuration: 1000,
  duration: 8000,
},
campfireRandom1: {
  file: require('../assets/sounds/campfire-random1.mp3'),
  minVolume: 0.04,
  maxVolume: 0.08,
  chance: 0.6,
  luckProtection: 0.2,
  duration: 8000,
},

// town-square.js entity
{
  id: 'campfire',
  sounds: [
    'campfire',                    // Main loop
    { key: 'campfire', delay: 2000 }, // Offset copy
    { key: 'campfireRandom1', minDelay: 8000, maxDelay: 15000 },
    { key: 'campfireRandom2', minDelay: 12000, maxDelay: 20000 },
  ]
}
```

This creates:
1. Two overlapping campfire loops (offset by 2s for richer sound)
2. Random crackle sounds at varying intervals
3. Automatic fade in when entering room
4. Automatic fade out when leaving room

## Adding New Sounds

1. Add sound file to `/frontend/assets/sounds/`
2. Define in `/frontend/config/sounds.js`:
   ```javascript
   newSound: {
     file: require('../assets/sounds/newsound.mp3'),
     volume: 1,
   }
   ```
3. Use in code:
   ```javascript
   SoundManager.play('newSound');
   ```

Or attach to entity in location file:
```javascript
{
  id: 'entity-id',
  sounds: ['newSound']
}
```

## Debugging

Check console for:
- `Error loading sound "key":` - File not found or format issue
- `Error playing sound "key":` - Playback failed
- `Sound "key" not found in config` - Key not in sounds.js

Monitor active instances:
```javascript
console.log(SoundManager.activeInstances.size);
```
