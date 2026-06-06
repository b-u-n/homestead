// Path tile assets (32x20 pixel-art tiles - top empty rows trimmed)
const pathStraightLeft = require('../../assets/images/path_straight_path_left.png');
const pathStraightRight = require('../../assets/images/path_straight_path_right.png');
const pathCornerLowerLeft = require('../../assets/images/path_corner_lower_left.png');   // connects RIGHT + TOP
const pathCornerLowerRight = require('../../assets/images/path_corner_lower_right.png'); // connects LEFT + TOP
const pathCornerUpperLeft = require('../../assets/images/path_corner_upper_left.png');   // connects RIGHT + BOTTOM
const pathCornerUpperRight = require('../../assets/images/path_corner_upper_right.png'); // connects LEFT + BOTTOM
// Build a horizontal path with optional bump-up sections.
// The bump-up pattern uses the full corner set so the path rises one tile
// for a stretch and then drops back down.
function buildPath(opts) {
  const {
    tileWidth = 128,
    tileHeight = 80,
    baseY,
    startX,
    tileCount,
    bumps = [], // [{ start, end }] in column indices, end > start
    zIndex = -100,
  } = opts;

  const tile = tileWidth; // legacy alias for column step
  const tiles = [];
  const upperY = baseY - tileHeight;

  const inBumpGap = (col) => bumps.some(b => col > b.start && col < b.end);
  const isBumpStart = (col) => bumps.find(b => b.start === col);
  const isBumpEnd = (col) => bumps.find(b => b.end === col);

  for (let i = 0; i < tileCount; i++) {
    const x = startX + i * tile;

    if (isBumpStart(i)) {
      tiles.push({
        id: `path-lower-${i}`, type: 'decoration',
        x, y: baseY, width: tileWidth, height: tileHeight, zIndex,
        image: pathCornerLowerRight, showTitle: false,
      });
      tiles.push({
        id: `path-upper-start-${i}`, type: 'decoration',
        x, y: upperY, width: tileWidth, height: tileHeight, zIndex,
        image: pathCornerUpperLeft, showTitle: false,
      });
    } else if (isBumpEnd(i)) {
      tiles.push({
        id: `path-lower-${i}`, type: 'decoration',
        x, y: baseY, width: tileWidth, height: tileHeight, zIndex,
        image: pathCornerLowerLeft, showTitle: false,
      });
      tiles.push({
        id: `path-upper-end-${i}`, type: 'decoration',
        x, y: upperY, width: tileWidth, height: tileHeight, zIndex,
        image: pathCornerUpperRight, showTitle: false,
      });
    } else if (inBumpGap(i)) {
      tiles.push({
        id: `path-upper-${i}`, type: 'decoration',
        x, y: upperY, width: tileWidth, height: tileHeight, zIndex,
        image: i % 2 === 0 ? pathStraightLeft : pathStraightRight,
        showTitle: false,
      });
    } else {
      tiles.push({
        id: `path-lower-${i}`, type: 'decoration',
        x, y: baseY, width: tileWidth, height: tileHeight, zIndex,
        image: i % 2 === 0 ? pathStraightLeft : pathStraightRight,
        showTitle: false,
      });
    }
  }
  return tiles;
}

export default (width, height) => ({
  name: 'Town Square',
  type: 'section',
  debugMode: false,
  showTitle: false,

  // Navigation to other sections (edge buttons) - disabled for now
  navigation: [],

  // Room entrances (doors to interior spaces)
  doors: [
    {
      id: 'sugarbee-cafe-door',
      // 64x64 source @ 3x = 192, anchored to previous bottom-center (1204, 560)
      x: width / 2 + 148,
      y: height / 2 - 172,
      width: 192,
      height: 192,
      zIndex: 2100,
      label: 'Sugarbee Cafe',
      showTitle: false,
      navigateTo: '/homestead/explore/map/sugarbee-cafe',
      image: require('../../assets/images/cat_cafe.png'),
      platformAssetId: 'entity-sugarbee-cafe'
    },
    {
      id: 'games-parlor-door',
      // 64x64 source @ 3x = 192, anchored to previous bottom-center
      x: width / 2 - 696,
      y: height / 2 - 212,
      width: 192,
      height: 192,
      label: 'Games Parlor',
      showTitle: false,
      navigateTo: '/homestead/explore/map/games-parlor',
      image: require('../../assets/images/Game_Parlour.png'),
      platformAssetId: 'entity-games-parlor'
    },
    {
      id: 'bazaar-door',
      // 128x128 source @ 3x = 384, shifted down 160px from original
      x: width / 2 - 792,
      y: height / 2 - 44,
      width: 384,
      height: 384,
      label: 'Bazaar',
      showTitle: false,
      navigateTo: '/homestead/explore/map/bazaar',
      image: require('../../assets/images/Market.png'),
      platformAssetId: 'entity-bazaar'
    },
  ],

  // Outdoor entities (decorations, interactables)
  entities: [
    // (Generated grass field removed — ground cover is now placed by hand with
    // the dev RoomEditor as overlay tiles, like the paths.)

    // (Static path tiles removed — paths are now placed via the dev RoomEditor and
    // persist as RoomLayoutOverlay tiles. Run backend/scripts/exportLayoutOverlay.js
    // to dump the overlay back to source when the layout is finalized.)

{
      id: 'wishing-well',
      type: 'interactable',
      // 50% size, bottom-center anchored to previous (width/2 - 160, height/2 + 150)
      x: width / 2 - 214,
      y: height / 2 - 1,
      width: 108,
      height: 151,
      label: 'Wishing Well',
      showTitle: false,
      image: 'wishing-well.png',
      platformAssetId: 'entity-wishing-well',
      description: 'A beautiful wishing well in the center of town.'
    },
    // Campfire between wishing well and sugarbee cafe
    {
      id: 'campfire',
      type: 'decoration',
      // 50% size, bottom-center anchored to previous (width/2 + 64, height/2 + 334)
      x: width / 2 + 14,
      y: height / 2 + 234,
      width: 100,
      height: 100,
      label: 'Campfire',
      showTitle: false,
      image: require('../../assets/images/campfire.png'),
      platformAssetId: 'entity-campfire',
      description: 'A warm campfire where travelers gather.',
      sounds: [
        'campfire',
        { key: 'campfire', delay: 2000 },
        { key: 'campfireRandom1', minDelay: 8000, maxDelay: 15000 },
        { key: 'campfireRandom2', minDelay: 12000, maxDelay: 20000 },
      ]
    },
    // Hidden journal in the weeping willow grove — temporarily removed
    // Nearby tree z-indexes: tree 7=1930, tree 8=1920, tree 9=1910, tree 10=1900
    // {
    //   id: 'grove-journal',
    //   type: 'interactable',
    //   x: width * 0.6 + 330,
    //   y: height * 0.2 - 80,
    //   width: 80,
    //   height: 80,
    //   zIndex: 1805,
    //   label: 'Journal',
    //   image: require('../../assets/images/journal.png'),
    //   platformAssetId: 'entity-journal',
    //   showTitle: false,
    //   flow: 'workbook',
    //   flowParams: { bookshelfId: 'depression', title: 'Journal' }
    // },
    {
      id: 'help-wanted',
      type: 'interactable',
      // 50% size, bottom-center anchored to previous (width/2 + 516, height/2 + 232)
      x: width / 2 + 468,
      y: height / 2 + 148,
      width: 96,
      height: 84,
      label: 'Help Wanted',
      showTitle: false,
      image: require('../../assets/images/help-sign.png'),
      platformAssetId: 'entity-help-wanted',
      description: 'A bulletin board where community members share their struggles and ask for support.',
      flow: 'weepingWillow',
      zIndex: 2100
    },
    {
      id: 'mailbox',
      type: 'interactable',
      // 50% size, bottom-center anchored to previous (width/2 + 500, height/2 + 420)
      x: width / 2 + 468,
      y: height / 2 + 352,
      width: 64,
      height: 68,
      label: 'Mailbox',
      showTitle: false,
      image: require('../../assets/images/mailbox.png'),
      platformAssetId: 'entity-knapsack',
      flow: 'mailbox',
      zIndex: 2100
    },
    // Weeping willow grove (280 generated trees) removed — trees are now placed
    // by hand with the room editor as overlay tiles. Note: the grove trees were
    // the map's entrance to the weeping-willow room (navigateTo).
  ]
});
