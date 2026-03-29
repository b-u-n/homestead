export default (width, height) => ({
  name: 'Games Parlor',
  type: 'room',

  backButton: {
    id: 'back-to-town-square',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    label: 'Home',
    showTitle: false,
    navigateTo: '/homestead/explore/map/town-square',
    image: require('../../assets/images/map-back-button.png')
  },

  navigation: [],
  doors: [],

  entities: [
    {
      id: 'pixel-pals-table',
      type: 'interactable',
      x: width / 2 - 120,
      y: height / 2 - 100,
      width: 240,
      height: 200,
      label: 'Pixel Pals',
      description: 'A shared pixel art game board',
      flow: 'pixelPals',
      image: require('../../assets/images/pixel-pals.png'),
      platformAssetId: 'entity-pixel-pals'
    }
    // Future games go here as additional entities
  ]
});
