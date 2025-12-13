export default (width, height) => ({
  name: 'Heart Bank',
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

  // Bank-specific entities
  entities: [
    {
      id: 'bank-teller',
      type: 'interactable',
      x: width / 2 - 100,
      y: height / 2 - 100,
      width: 200,
      height: 80,
      label: 'Bank Teller',
      description: 'Welcome to the Heart Bank! We keep your hearts safe.',
      // When clicked, open BankModal
      action: 'openBankModal'
    }
  ]
});
