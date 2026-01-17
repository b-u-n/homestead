export default (width, height) => ({
  name: 'Assertiveness',
  type: 'room',
  parentSection: 'workshop',
  showTitle: false,

  // Back button to return to workshop
  backButton: {
    id: 'back-to-workshop',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    label: 'Back',
    navigateTo: '/homestead/explore/map/library',
    image: require('../../assets/images/map-back-button.png'),
    showTitle: false
  },

  // Items on the wall for sale
  entities: []
});
