export default (width, height) => ({
  name: 'Sugarbee Cafe',
  type: 'room',
  parentSection: 'town-square',
  showTitle: false,

  // Background sounds for the cafe
  backgroundSounds: [
    // Two ambient loops that pick random sounds from pool
    'cafeAmbientGroup',
    { key: 'cafeAmbientGroup', initialDelay: 4000 },
    // Random overlay sounds
    { key: 'cafeOverlayGroup', minDelay: 10000, maxDelay: 18000, initialDelay: 6000 },
    { key: 'cafeOverlayGroup', minDelay: 12000, maxDelay: 20000, initialDelay: 10000 },
  ],

  // Back button to parent section
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

  // Edge navigation back to section
  navigation: [
    {
      id: 'to-town-square-1',
      x: 100,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square',
      showTitle: false
    },
    {
      id: 'to-town-square-2',
      x: width - 320,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square',
      showTitle: false
    },
  ],

  // Interior entities (objects in the room)
  entities: [
    {
      id: 'counter',
      type: 'interactive',
      x: width / 2 - 75,
      y: height / 2 - 150,
      width: 150,
      height: 80,
      label: 'Coffee Counter',
      description: 'Order your favorite brew here.'
    },
    {
      id: 'cat-couch',
      type: 'decoration',
      x: width / 2 + 100,
      y: height / 2 + 70,
      width: 262,
      height: 262,
      label: 'Cat Couch',
      showTitle: false,
      description: 'A comfortable armchair perfect for sipping coffee.',
      image: require('../../assets/images/sugarbee-cafe-couch.png')
    },
    {
      id: 'journal',
      type: 'interactive',
      x: width / 2 - 180,
      y: height / 2 + 100,
      width: 134,
      height: 134,
      label: 'Journal',
      description: 'A weathered journal sits here, inviting you to record your thoughts.',
      image: require('../../assets/images/journal.png'),
      showTitle: false,
      navigateTo: '/homestead/explore/map/library'
    }
  ]
});
