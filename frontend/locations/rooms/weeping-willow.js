export default (width, height) => ({
  name: 'Weeping Willows',
  type: 'room',
  parentSection: 'town-square',

  // Background ambient sounds for this room
  backgroundSounds: [
    'weepingWillow', // Main loop
    { key: 'weepingWillowRandom', minDelay: 8000, maxDelay: 12000, initialDelay: 4000 }, // Random copy 1, offset 4s
    { key: 'weepingWillowRandom', minDelay: 8000, maxDelay: 12000, initialDelay: 8000 }, // Random copy 2, offset 8s
  ],

  // Back button to parent section
  backButton: {
    id: 'back-to-town-square',
    x: 20,
    y: 180,
    width: 180,
    height: 50,
    label: 'Back to Town Square',
    navigateTo: '/homestead/explore/map/town-square'
  },

  // Edge navigation back to section
  navigation: [
    {
      id: 'to-town-square-1',
      x: 100,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
    {
      id: 'to-town-square-2',
      x: width - 320,
      y: height - 70,
      width: 220,
      height: 60,
      label: 'To Town Square',
      navigateTo: '/homestead/explore/map/town-square'
    },
  ],

  // Peaceful entities under the willow
  entities: [
    {
      id: 'help-wanted',
      type: 'interactive',
      x: width / 2 - 100,
      y: height / 2 - 100,
      width: 200,
      height: 80,
      label: 'Help Wanted',
      description: 'A bulletin board where community members share their struggles and ask for support.',
      flow: 'weepingWillow'
    },
    {
      id: 'meditation-bench',
      type: 'interactive',
      x: width / 2 - 100,
      y: height / 2 + 40,
      width: 200,
      height: 80,
      label: 'Meditation Bench',
      description: 'A peaceful bench beneath the willow branches, perfect for quiet reflection.'
    },
    {
      id: 'pond',
      type: 'decoration',
      x: width / 2 + 150,
      y: height / 2 + 60,
      width: 140,
      height: 100,
      label: 'Still Pond',
      description: 'A tranquil pond reflects the willow branches above.'
    },
    {
      id: 'journal',
      type: 'interactive',
      x: width / 2 - 180,
      y: height / 2 + 120,
      width: 80,
      height: 60,
      label: 'Journal',
      description: 'A weathered journal sits here, inviting you to record your thoughts.'
    }
  ]
});
