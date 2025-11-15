export default (width, height) => ({
  name: 'Player Housing',
  type: 'section',

  // Navigation to other sections (edge buttons)
  navigation: [
    // North - back to town square
    {
      id: 'to-town-square-1',
      x: width / 2 - 250,
      y: 10,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
    {
      id: 'to-town-square-2',
      x: width / 2 + 30,
      y: 10,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
  ],

  // Room entrances (could add player's house interior)
  doors: [],

  // Outdoor entities (housing area objects)
  entities: [
    {
      id: 'bed',
      type: 'interactive',
      x: width / 2 - 200,
      y: height / 2 - 80,
      width: 150,
      height: 100,
      label: 'Bed',
      description: 'A cozy bed to rest and restore energy.'
    },
    {
      id: 'storage-chest',
      type: 'interactive',
      x: width / 2 + 100,
      y: height / 2 + 50,
      width: 100,
      height: 80,
      label: 'Storage Chest',
      description: 'Extra storage for your items.'
    }
  ]
});
