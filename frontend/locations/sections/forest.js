export default (width, height) => ({
  name: 'Forest',
  type: 'section',

  // Navigation to other sections (edge buttons)
  navigation: [
    // East - back to town square
    {
      id: 'to-town-square-1',
      x: width - 130,
      y: 100,
      width: 120,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
    {
      id: 'to-town-square-2',
      x: width - 130,
      y: height / 2,
      width: 120,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
  ],

  // Room entrances (could add forest cabins/clearings)
  doors: [],

  // Outdoor entities (forest objects)
  entities: [
    {
      id: 'oak-tree',
      type: 'interactive',
      x: width / 2 - 100,
      y: height / 2 - 120,
      width: 100,
      height: 150,
      label: 'Oak Tree',
      description: 'A large, ancient oak tree.'
    },
    {
      id: 'berry-bush',
      type: 'interactive',
      x: width / 2 + 80,
      y: height / 2 + 40,
      width: 80,
      height: 70,
      label: 'Berry Bush',
      description: 'Wild berries grow here.'
    }
  ]
});
