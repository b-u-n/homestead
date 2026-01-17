export default (width, height) => ({
  name: 'Library',
  type: 'room',
  parentSection: 'town-square',
  showTitle: false,
  background: require('../../assets/images/wood-texture.jpg'),

  // Back button to return to weeping willow
  backButton: {
    id: 'back-to-weeping-willow',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    label: 'Back',
    navigateTo: '/homestead/explore/map/weeping-willow',
    image: require('../../assets/images/map-back-button.png'),
    showTitle: false
  },

  navigation: [],

  doors: [],

  // Bookshelves - scattered across room, ~330px height with +/- 20% size variations
  entities: [
    {
      id: 'bookshelf-emotions',
      type: 'interactive',
      x: width * 0.05 + 40,
      y: height * 0.12 + 120,
      width: 248,
      height: 330,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-emotions.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'emotions', title: 'Emotions' }
    },
    {
      id: 'bookshelf-depression',
      type: 'interactive',
      x: width * 0.32,
      y: height * 0.08,
      width: 280,
      height: 370,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-depression.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'depression', title: 'Depression' }
    },
    {
      id: 'bookshelf-stress',
      type: 'interactive',
      x: width * 0.58,
      y: height * 0.15,
      width: 210,
      height: 280,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-stress.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'stress', title: 'Stress' }
    },
    {
      id: 'bookshelf-anxiety',
      type: 'interactive',
      x: width * 0.18 + 400,
      y: height * 0.52,
      width: 255,
      height: 340,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-anxiety.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'anxiety', title: 'Anxiety' }
    }
  ]
});
