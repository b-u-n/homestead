export default (width, height) => ({
  name: 'Marketplace',
  type: 'section',

  // Navigation to other sections (edge buttons)
  navigation: [
    // South - back to town square
    {
      id: 'to-town-square-1',
      x: width / 2 - 250,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
    {
      id: 'to-town-square-2',
      x: width / 2 + 30,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
  ],

  // Room entrances (could add market shops later)
  doors: [],

  // Outdoor entities (market stalls)
  entities: [
    {
      id: 'fruit-stall',
      type: 'interactive',
      x: width / 2 - 250,
      y: height / 2 - 100,
      width: 120,
      height: 100,
      label: 'Fruit Stall',
      description: 'Fresh fruits and vegetables for sale.'
    },
    {
      id: 'goods-stall',
      type: 'interactive',
      x: width / 2 + 130,
      y: height / 2 - 100,
      width: 120,
      height: 100,
      label: 'Goods Stall',
      description: 'Various tools and supplies.'
    }
  ]
});
