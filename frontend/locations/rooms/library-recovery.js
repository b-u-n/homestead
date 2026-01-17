export default (width, height) => ({
  name: 'Library - Recovery',
  type: 'room',
  parentSection: 'town-square',
  showTitle: false,
  background: require('../../assets/images/wood-texture.jpg'),

  // Back button to return to main library (workshop)
  backButton: {
    id: 'back-to-library',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    label: 'Back',
    navigateTo: '/homestead/explore/map/library',
    image: require('../../assets/images/map-back-button.png'),
    showTitle: false
  },

  navigation: [],

  doors: [],

  // Bookshelves - Recovery, ~330px height with +/- 20% size variations
  entities: [
    {
      id: 'bookshelf-adhd',
      type: 'interactive',
      x: width * 0.06 + 340,
      y: height * 0.1 + 120,
      width: 248,
      height: 330,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-adhd.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'adhd', title: 'ADHD' }
    },
    {
      id: 'bookshelf-burnout',
      type: 'interactive',
      x: width * 0.42 + 120,
      y: height * 0.08,
      width: 252,
      height: 336,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-burnout.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'burnout', title: 'Burnout' }
    },
    {
      id: 'bookshelf-grief',
      type: 'interactive',
      x: width * 0.04,
      y: height * 0.5,
      width: 255,
      height: 340,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-grief.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'grief', title: 'Grief' }
    },
    {
      id: 'bookshelf-trauma',
      type: 'interactive',
      x: width * 0.35 + 420,
      y: height * 0.52,
      width: 224,
      height: 296,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-trauma.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'trauma', title: 'Trauma' }
    }
  ]
});
