export default (width, height) => ({
  name: 'Coffee Shop',
  type: 'room',
  parentSection: 'town-square',

  // Back button to parent section
  backButton: {
    id: 'back-to-town-square',
    x: 20,
    y: 180,
    width: 180,
    height: 50,
    label: 'Back to Town Square',
    navigateTo: '/homestead/explore/map/town-square'
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
      navigateTo: '/homestead/explore/map/town-square'
    },
    {
      id: 'to-town-square-2',
      x: width - 320,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
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
      id: 'cozy-chair',
      type: 'decoration',
      x: width / 2 - 180,
      y: height / 2 + 50,
      width: 70,
      height: 70,
      label: 'Cozy Chair',
      description: 'A comfortable armchair perfect for sipping coffee.'
    }
  ]
});
