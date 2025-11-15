export default (width, height) => ({
  name: 'Library',
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
      id: 'bookshelf',
      type: 'interactive',
      x: width / 2 - 200,
      y: height / 2 - 120,
      width: 120,
      height: 180,
      label: 'Bookshelf',
      description: 'Rows of books line the shelves.'
    },
    {
      id: 'reading-table',
      type: 'decoration',
      x: width / 2 + 100,
      y: height / 2 - 30,
      width: 100,
      height: 60,
      label: 'Reading Table',
      description: 'A cozy spot to read.'
    }
  ]
});
