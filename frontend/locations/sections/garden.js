export default (width, height) => ({
  name: 'Garden',
  type: 'section',

  // Navigation to other sections (edge buttons)
  navigation: [
    // West - back to town square
    {
      id: 'to-town-square-1',
      x: 10,
      y: 100,
      width: 120,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
    {
      id: 'to-town-square-2',
      x: 10,
      y: height / 2,
      width: 120,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
  ],

  // Room entrances (could add garden shed)
  doors: [],

  // Outdoor entities (garden objects)
  entities: [
    {
      id: 'flower-bed',
      type: 'interactive',
      x: width / 2 - 150,
      y: height / 2 - 60,
      width: 120,
      height: 80,
      label: 'Flower Bed',
      description: 'Beautiful flowers bloom here.'
    },
    {
      id: 'vegetable-patch',
      type: 'interactive',
      x: width / 2 + 50,
      y: height / 2 - 60,
      width: 120,
      height: 80,
      label: 'Vegetable Patch',
      description: 'Fresh vegetables growing in neat rows.'
    }
  ]
});
