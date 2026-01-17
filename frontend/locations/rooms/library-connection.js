export default (width, height) => ({
  name: 'Library - Connection',
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

  // Bookshelves - Connection (3 shelves), everything moved 200px right
  entities: [
    {
      id: 'bookshelf-attachment',
      type: 'interactive',
      x: width * 0.06 + 200,
      y: height * 0.12 + 40,
      width: 280,
      height: 370,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-attachment.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'attachment', title: 'Attachment' }
    },
    {
      id: 'bookshelf-boundaries',
      type: 'interactive',
      x: width * 0.4 + 200,
      y: height * 0.1,
      width: 255,
      height: 340,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-boundaries.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'boundaries', title: 'Boundaries' }
    },
    {
      id: 'bookshelf-loneliness',
      type: 'interactive',
      x: width * 0.2 + 280,
      y: height * 0.5,
      width: 210,
      height: 280,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-loneliness.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'loneliness', title: 'Loneliness' }
    }
  ]
});
