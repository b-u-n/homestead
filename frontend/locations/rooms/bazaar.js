export default (width, height) => ({
  name: 'Bazaar',
  type: 'room',

  // Back button to return to town square
  backButton: {
    id: 'back-to-town-square',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    label: 'Home',
    navigateTo: '/homestead/explore/map/town-square',
    image: require('../../assets/images/map-back-button.png'),
    showTitle: false
  },

  // Bazaar entities
  entities: [
    {
      id: 'drawing-board',
      type: 'interactable',
      x: width / 2 - 200,
      y: height / 2 - 100,
      width: 200,
      height: 80,
      label: 'Drawing Board',
      description: 'Submit your art and contribute to the platform.',
      flow: 'drawingBoard'
    },
    {
      id: 'map-sprites-stall',
      type: 'interactable',
      x: width / 2 + 20,
      y: height / 2 - 100,
      width: 200,
      height: 80,
      label: 'Map Sprites',
      description: 'Browse and purchase community-created map sprites.',
      flow: 'mapSpritesStall'
    }
  ]
});
