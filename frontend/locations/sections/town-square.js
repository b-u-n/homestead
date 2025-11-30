export default (width, height) => ({
  name: 'Town Square',
  type: 'section',

  // Navigation to other sections (edge buttons)
  navigation: [
    // Bottom
    {
      id: 'to-player-housing',
      x: width / 2 - 250,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Player Housing',
      navigateTo: '/homestead/explore/map/player-housing'
    },

    // Left (below profile)
    {
      id: 'to-forest-1',
      x: 10,
      y: 200,
      width: 120,
      height: 60,
      label: 'To Forest',
      navigateTo: '/homestead/explore/map/forest'
    },
    {
      id: 'to-forest-2',
      x: 10,
      y: height / 2,
      width: 120,
      height: 60,
      label: 'To Forest',
      navigateTo: '/homestead/explore/map/forest'
    },

    // Top right
    {
      id: 'to-marketplace',
      x: 3 * width / 4 - 100,
      y: 10,
      width: 200,
      height: 60,
      label: 'To Marketplace',
      navigateTo: '/homestead/explore/map/marketplace'
    },

    // Right
    {
      id: 'to-garden-1',
      x: width - 130,
      y: 200,
      width: 120,
      height: 60,
      label: 'To Garden',
      navigateTo: '/homestead/explore/map/garden'
    },
    {
      id: 'to-garden-2',
      x: width - 130,
      y: height / 2,
      width: 120,
      height: 60,
      label: 'To Garden',
      navigateTo: '/homestead/explore/map/garden'
    },
  ],

  // Room entrances (doors to interior spaces)
  doors: [
    {
      id: 'sugarbee-cafe-door',
      x: width / 2 + 120,
      y: height / 2 - 100,
      width: 320,
      height: 480,
      label: 'Sugarbee Cafe',
      navigateTo: '/homestead/explore/map/sugarbee-cafe',
      image: require('../../assets/images/sugarbee-cafe.png')
    },
    {
      id: 'bank-door',
      x: width / 2 - 200,
      y: height / 2 - 100,
      width: 80,
      height: 120,
      label: 'Bank',
      navigateTo: '/homestead/explore/map/bank'
    },
  ],

  // Outdoor entities (decorations, interactables)
  entities: [
    {
      id: 'campfire',
      type: 'decoration',
      x: width / 2 - 50,
      y: height / 2 + 50,
      width: 100,
      height: 100,
      label: 'Campfire',
      image: 'campfire.png', // TODO: Add actual campfire image
      description: 'A warm campfire where travelers gather.',
      // Sounds can be a string key, array of keys, or array of sound objects
      // Sound objects: { key, volume?, delay?, minDelay?, maxDelay? }
      // minDelay/maxDelay: randomized interval between tryPlay() calls
      sounds: [
        'campfire', // Main loop
        { key: 'campfire', delay: 2000 }, // Offset copy for richer sound
        { key: 'campfireRandom1', minDelay: 8000, maxDelay: 15000 },
        { key: 'campfireRandom2', minDelay: 12000, maxDelay: 20000 },
      ]
    },
    {
      id: 'wishing-well',
      type: 'decoration',
      x: width * 0.7,
      y: height * 0.75 - 24,
      width: 150,
      height: 150,
      label: 'Wishing Well',
      image: 'wishing-well.png',
      description: 'A beautiful wishing well in the center of town.'
    },
    {
      id: 'weeping-willow',
      type: 'interactable',
      x: width * 0.6,
      y: height * 0.2,
      width: 200,
      height: 240,
      label: 'Weeping Willow',
      image: 'weeping-willow.png',
      description: 'A serene weeping willow, perfect for quiet contemplation.',
      navigateTo: '/homestead/explore/map/weeping-willow'
    }
  ]
});
