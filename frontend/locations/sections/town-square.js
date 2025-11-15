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
      id: 'library-door',
      x: width / 2 - 200,
      y: height / 2 - 100,
      width: 80,
      height: 120,
      label: 'Library',
      navigateTo: '/homestead/explore/map/library'
    },
    {
      id: 'coffee-shop-door',
      x: width / 2 + 120,
      y: height / 2 - 100,
      width: 80,
      height: 120,
      label: 'Coffee Shop',
      navigateTo: '/homestead/explore/map/coffee-shop'
    },
  ],

  // Outdoor entities (decorations, interactables)
  entities: [
    {
      id: 'fountain',
      type: 'decoration',
      x: width / 2 - 30,
      y: height / 2 + 80,
      width: 60,
      height: 60,
      label: 'Fountain',
      description: 'A beautiful fountain in the center of town.'
    }
  ]
});
