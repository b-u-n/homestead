export default (width, height) => ({
  name: 'Town Square',
  type: 'section',
  debugMode: false,
  showTitle: false,

  // Heart button on homepage (same position as back button on other screens)
  backButton: {
    id: 'home-hearts',
    x: 18,
    y: 18,
    width: 80,
    height: 80,
    label: 'Hearts',
    flow: 'bank', // Opens the hearts/bank flow
    image: require('../../assets/images/heart.png'),
    showTitle: false
  },

  // Navigation to other sections (edge buttons) - disabled for now
  navigation: [],

  // Room entrances (doors to interior spaces)
  doors: [
    {
      id: 'sugarbee-cafe-door',
      x: width / 2 + 36,
      y: height / 2 - 396,
      width: 416,
      height: 416,
      zIndex: 2100,
      label: 'Sugarbee Cafe',
      showTitle: false,
      navigateTo: '/homestead/explore/map/sugarbee-cafe',
      image: require('../../assets/images/sugarbee-cafe.png')
    },
    {
      id: 'bank-door',
      x: width / 2 - 780,
      y: height / 2 - 280,
      width: 360,
      height: 360,
      label: 'Bank',
      showTitle: false,
      navigateTo: '/homestead/explore/map/bank',
      image: require('../../assets/images/bank.png')
    },
  ],

  // Outdoor entities (decorations, interactables)
  entities: [
    {
      id: 'wishing-well',
      type: 'interactable',
      x: width / 2 - 268,
      y: height / 2 - 152,
      width: 216,
      height: 302,
      label: 'Wishing Well',
      showTitle: false,
      image: 'wishing-well.png',
      description: 'A beautiful wishing well in the center of town.'
    },
    // Campfire between wishing well and sugarbee cafe
    {
      id: 'campfire',
      type: 'decoration',
      x: width / 2 - 36,
      y: height / 2 + 134,
      width: 200,
      height: 200,
      label: 'Campfire',
      showTitle: false,
      image: require('../../assets/images/campfire.png'),
      description: 'A warm campfire where travelers gather.',
      sounds: [
        'campfire',
        { key: 'campfire', delay: 2000 },
        { key: 'campfireRandom1', minDelay: 8000, maxDelay: 15000 },
        { key: 'campfireRandom2', minDelay: 12000, maxDelay: 20000 },
      ]
    },
    // Hidden journal in the weeping willow grove
    // Nearby tree z-indexes: tree 7=1930, tree 8=1920, tree 9=1910, tree 10=1900
    {
      id: 'grove-journal',
      type: 'interactable',
      x: width * 0.6 + 330,
      y: height * 0.2 - 80,
      width: 80,
      height: 80,
      zIndex: 1805,
      label: 'Journal',
      image: require('../../assets/images/journal.png'),
      showTitle: false,
      navigateTo: '/homestead/explore/map/weeping-willow'
    },
    // Generate weeping willow grove - 70 trees spreading up and to the left (10 per row)
    ...Array.from({ length: 70 }, (_, i) => {
      // Seeded random based on index for consistent positions
      const seed = (i * 7919) % 1000 / 1000; // Prime number for good distribution
      const seed2 = (i * 6271) % 1000 / 1000;
      const seed3 = (i * 8923) % 1000 / 1000;

      // Hard-coded x offsets to spread trees leftward (10 trees per row)
      const xOffsets = [
        -285, -235, -185, -135, -85, -35, 25, 66, 107, 148,           // Row 0 - front row
        -309, -259, -209, -159, -109, -59, 7, 98, 139, 180,           // Row 1 - journal area
        -400, -350, -300, -250, -200, -150, -40, 20, 80, 130,         // Row 2
        -525, -475, -425, -375, -325, -275, -123, -46, 72, 122,       // Row 3 - expanded left
        -600, -550, -500, -450, -400, -350, -186, -105, 121, 191,     // Row 4 - sparse right side
        -670, -620, -570, -520, -470, -420, -260, -90, 60, 140,       // Row 5 - sparse right side
        -750, -700, -650, -600, -550, -500, -310, -140, 10, 100,      // Row 6 - sparse right side
      ];

      // Base position spreads up and to the right (heavy overlap - 2/5 to 4/5 tree height)
      const baseX = width * 0.6 + 160 + (i % 10) * 80 + xOffsets[i];
      const baseY = height * 0.2 - 40 - Math.floor(i / 10) * 100;

      // Randomize position +/- 28.5px
      const x = baseX + (seed - 0.5) * 57;
      const y = baseY + (seed2 - 0.5) * 57;

      // Randomize size +/- 14.2%
      const sizeVariance = 0.142;
      const sizeMultiplier = 1 + (seed3 - 0.5) * 2 * sizeVariance;
      const baseWidth = 300;
      const baseHeight = 300;

      return {
        id: `weeping-willow-${i}`,
        type: 'interactable', // All trees are clickable
        x,
        y,
        width: baseWidth * sizeMultiplier,
        height: baseHeight * sizeMultiplier,
        zIndex: i === 0 ? 1965 : 2000 - i * 10,
        image: 'weeping-willow.png',
        description: 'A serene grove of weeping willows, perfect for quiet contemplation.',
        navigateTo: '/homestead/explore/map/weeping-willow',
        showTitle: false
      };
    })
  ]
});
