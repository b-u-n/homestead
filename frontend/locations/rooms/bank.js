export default (width, height) => ({
  name: 'Heart Bank',
  type: 'room',

  // Back button to return to town square
  backButton: {
    id: 'back-to-town-square',
    x: 20,
    y: height - 70,
    width: 180,
    height: 50,
    label: 'Back to Town Square',
    navigateTo: '/homestead/explore/map/town-square'
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
