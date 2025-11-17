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
      id: 'coffee-shop-door',
      x: width / 2 + 120,
      y: height / 2 - 100,
      width: 80,
      height: 120,
      label: 'Coffee Shop',
      navigateTo: '/homestead/explore/map/coffee-shop'
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
