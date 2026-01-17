const willowImage = require('../../assets/images/weeping-willow.png');

// Size multiplier for willow decorations (1.0 = original, 2.4 = 240% of original)
const WILLOW_SIZE_MULTIPLIER = 2.4;

// Helper to create a willow decoration
// num is used as id, label, and z-index (higher numbers render on top)
const willow = (num, x, y, baseSize) => ({
  id: `willow-${num}`,
  type: 'decoration',
  x,
  y,
  width: Math.round(baseSize * WILLOW_SIZE_MULTIPLIER),
  height: Math.round(baseSize * WILLOW_SIZE_MULTIPLIER),
  label: `${num}`,
  image: willowImage,
  showTitle: false,
  zIndex: num
});

export default (width, height) => ({
  name: 'Weeping Willows',
  type: 'room',
  parentSection: 'town-square',
  showTitle: false,
  debugMode: false,

  // Background ambient sounds for this room
  backgroundSounds: [
    'weepingWillow', // Main loop
    { key: 'weepingWillowRandom', minDelay: 8000, maxDelay: 12000, initialDelay: 4000 }, // Random copy 1, offset 4s
    { key: 'weepingWillowRandom', minDelay: 8000, maxDelay: 12000, initialDelay: 8000 }, // Random copy 2, offset 8s
  ],

  // Back button to parent section (positioned left of UserStatus)
  backButton: {
    id: 'back-to-town-square',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    label: 'Home',
    navigateTo: '/homestead/explore/map/town-square',
    image: require('../../assets/images/map-back-button.png'),
    showTitle: false
  },

  // Peaceful entities under the willow
  entities: [
    // Background decorations - number is both label and z-index (higher = on top)
    // 50 weeping willows scattered around the room (sizes randomized +/- 8%)
    willow(40, 80, 0, 187),
    willow(16, width - 260, -20, 188),
    willow(9, width / 2 - 280, height - 400, 170),
    willow(22, width / 2 + 180, height - 380, 134),
    willow(400, 40, height / 2 - 180, 153),
    willow(734, width - 180, height / 2 - 80, 158),
    willow(2, width / 2 - 100, -60, 139),
    willow(5, 200, height - 320, 118),
    willow(920, width - 320, height - 300, 139),
    willow(28, 280, 18, 138),
    willow(4, width - 400, 20, 163),
    willow(867, 120, height / 2, 115),
    willow(245, width - 200, 160, 178),
    willow(33, width / 2 + 80, height - 340, 112),
    willow(56, 60, height - 280, 146),
    willow(19, width / 2 - 180, -20, 127),
    willow(378, width - 140, height - 420, 133),
    willow(512, width / 2 + 260, height / 2 - 160, 144),
    willow(31, 350, 60, 141),
    willow(1, width - 480, -60, 132),
    willow(300, 160, height / 2 - 260, 137),
    willow(634, width - 350, height / 2 - 220, 152),
    willow(20, width / 2 - 350, 60, 136),
    willow(6, width / 2 + 350, 40, 141),
    willow(3, width / 2 + 70, -24, 124),
    willow(3, width / 2 - 362, 28, 124),
    willow(900, width - 120, 80, 112),
    willow(334, 380, height - 270, 147),
    willow(940, width - 450, height - 260, 140),
    willow(45, width / 2 - 60, height - 280, 131),
    willow(890, 240, height / 2 - 60, 143),
    willow(800, width - 280, height / 2 + 20, 142),
    willow(2, width / 2 + 280, -80, 140),
    willow(10, width - 550, 100, 127),
    willow(-10, 112, -20, 147),
    willow(756, width - 100, height - 320, 139),
    willow(4, width / 2 + 140, 0, 137),
    willow(834, width / 2 - 420, height / 2 - 120, 161),
    willow(167, 300, height - 220, 110),
    willow(95, width - 380, 200, 170),
    willow(12, 440, 0, 127),
    willow(701, width / 2 + 400, height / 2 - 40, 138),
    willow(-3, 30, height - 370, 144),
    willow(178, width - 220, 260, 141),
    willow(856, width / 2 - 240, height - 300, 133),
    willow(534, 500, height / 2 - 200, 163),
    willow(17, width - 160, height / 2 - 280, 127),
    willow(6, 420, height - 360, 147),
    willow(389, width / 2 + 200, height - 240, 112),
    willow(978, 140, height - 200, 169),
    willow(960, width - 300, height - 220, 147),

    // Interactive elements (default z-index 0, drawn on top)
    {
      id: 'journal',
      type: 'interactive',
      x: width / 2 + 260,
      y: height / 2 - 222,
      width: 134,
      height: 134,
      label: 'Journal',
      description: 'A weathered journal sits here, inviting you to record your thoughts.',
      image: require('../../assets/images/journal.png'),
      showTitle: false,
      zIndex: 1001,
      navigateTo: '/homestead/explore/map/library'
    },
    {
      id: 'help-wanted',
      type: 'interactive',
      x: width / 2 - 26,
      y: height / 2 - 186,
      width: 192,
      height: 192,
      label: 'Help Wanted',
      description: 'A bulletin board where community members share their struggles and ask for support.',
      flow: 'weepingWillow',
      image: require('../../assets/images/help-wanted.png'),
      showTitle: false,
      zIndex: 1002
    }
  ]
});
