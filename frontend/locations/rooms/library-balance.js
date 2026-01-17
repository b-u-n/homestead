export default (width, height) => ({
  name: 'Library - Finding Balance',
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

  // Bookshelves - Finding Balance, ~330px height with +/- 20% size variations
  // Swapped: anger <-> accountability (both moved right), impulses <-> self
  entities: [
    {
      id: 'bookshelf-accountability',
      type: 'interactive',
      x: width * 0.15 + 120,
      y: height * 0.18 + 20,
      width: 210,
      height: 280,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-accountability.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'accountability', title: 'Accountability' }
    },
    {
      id: 'bookshelf-self',
      type: 'interactive',
      x: width * 0.45,
      y: height * 0.15,
      width: 255,
      height: 340,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-self.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'self', title: 'Self' }
    },
    {
      id: 'bookshelf-impulses',
      type: 'interactive',
      x: width * 0.12,
      y: height * 0.5,
      width: 290,
      height: 385,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-impulses.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'impulses', title: 'Impulses' }
    },
    {
      id: 'bookshelf-anger',
      type: 'interactive',
      x: width * 0.45 + 200,
      y: height * 0.52,
      width: 300,
      height: 400,
      label: '',
      showTitle: false,
      image: require('../../assets/images/bookshelf-anger.png'),
      flow: 'workbook',
      flowParams: { bookshelfId: 'anger', title: 'Anger' }
    }
  ]
});
