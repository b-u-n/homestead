export default (width, height) => ({
  name: 'Town Square',
  type: 'section',

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
      x: width / 2 + 96,
      y: height / 2 - 76,
      width: 320,
      height: 480,
      label: 'Sugarbee Cafe',
      navigateTo: '/homestead/explore/map/sugarbee-cafe',
      image: require('../../assets/images/sugarbee-cafe.png')
    },
    {
      id: 'bank-door',
      x: width / 2 - 284,
      y: height / 2 - 52,
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
      x: width / 2 - 68,
      y: height / 2 + 32,
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
      label: 'Weeping Willows',
      image: 'weeping-willow.png',
      description: 'A serene grove of weeping willows, perfect for quiet contemplation.',
      navigateTo: '/homestead/explore/map/weeping-willow'
    }
  ]
});
