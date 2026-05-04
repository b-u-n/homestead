// Path tile assets (32x20 pixel-art tiles - top empty rows trimmed)
const pathStraightLeft = require('../../assets/images/path_straight_path_left.png');
const pathStraightRight = require('../../assets/images/path_straight_path_right.png');
const pathCornerLowerLeft = require('../../assets/images/path_corner_lower_left.png');   // connects RIGHT + TOP
const pathCornerLowerRight = require('../../assets/images/path_corner_lower_right.png'); // connects LEFT + TOP
const pathCornerUpperLeft = require('../../assets/images/path_corner_upper_left.png');   // connects RIGHT + BOTTOM
const pathCornerUpperRight = require('../../assets/images/path_corner_upper_right.png'); // connects LEFT + BOTTOM
const grassImage = require('../../assets/images/grass.png');

// Tile the canvas with 40x40 grass cells. Each row is physically positioned 20 source pixels
// below the previous (50% vertical overlap), creating a half-overlap isometric pattern.
// At 4x render scale: 160x160 tile, rows 80 rendered px apart.
function buildGrassTiles(canvasWidth, canvasHeight) {
  const cellSrc = 40;          // source-pixel cell size
  const renderScale = 4;
  const tile = cellSrc * renderScale;        // 160 rendered
  const rowStep = 20 * renderScale - 44;     // 36 rendered (44px closer vertically)
  const colStep = tile - 32;                  // 128 rendered (tiles 32px closer horizontally)
  const halfCol = colStep / 2;                // 64 rendered (half-tile offset on alt rows)

  const tiles = [];
  const numRows = Math.ceil(canvasHeight / rowStep) + 1;
  const numCols = Math.ceil(canvasWidth / colStep) + 1;

  for (let r = 0; r < numRows; r++) {
    const y = r * rowStep - tile / 2;
    const offset = (r % 2) * halfCol;
    for (let c = -1; c < numCols; c++) {
      const x = c * colStep + offset;
      tiles.push({
        id: `grass-${r}-${c}`,
        type: 'decoration',
        x, y,
        width: tile, height: tile,
        zIndex: -200,
        image: grassImage,
        showTitle: false,
      });
    }
  }
  return tiles;
}

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
    // Grass field tiled across the canvas with isometric half-overlap rows
    ...buildGrassTiles(width, height),

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
    // Generate weeping willow grove - 280 trees in a denser pattern
    // Each tree drifts right and down as the index increases (cumulative offset)
    ...Array.from({ length: 280 }, (_, i) => {
      // Seeded random based on index for consistent positions
      const seed = (i * 7919) % 1000 / 1000; // Prime number for good distribution
      const seed2 = (i * 6271) % 1000 / 1000;
      const seed3 = (i * 8923) % 1000 / 1000;

      // Pack into 14 rows of 20. Smaller column step (40px) and row step (50px)
      // for tighter packing matching the smaller (80x105) tree sprite.
      const colsPerRow = 20;
      const col = i % colsPerRow;
      const row = Math.floor(i / colsPerRow);

      // Base anchor: same upper-right grove area, but each tree also drifts
      // a few pixels to the right and down with each successive index so the
      // overall placement order flows right-and-down.
      const driftX = i * 0.6;
      const driftY = i * 0.4;

      // Spread leftward like before (col 0 = farthest right, col N = farther left).
      const baseX = width * 0.6 + 200 - col * 40 + driftX;
      const baseY = height * 0.2 + 60 - row * 50 + driftY;

      // Randomize position +/- 28.5px
      const x = baseX + (seed - 0.5) * 57;
      const y = baseY + (seed2 - 0.5) * 57;

      // Randomize size +/- 14.2%
      const sizeVariance = 0.142;
      const sizeMultiplier = 1 + (seed3 - 0.5) * 2 * sizeVariance;
      // 32x42 source (top-trimmed) @ 2.5x = 80x105
      const baseWidth = 80;
      const baseHeight = 105;

      return {
        id: `weeping-willow-${i}`,
        type: 'interactable', // All trees are clickable
        x,
        y,
        width: baseWidth * sizeMultiplier,
        height: baseHeight * sizeMultiplier,
        // Trees further back (higher row, smaller y) render behind closer ones.
        // Stay above path (zIndex -100) and below interactable doors (~2100).
        zIndex: 1900 - row * 5 - col,
        image: require('../../assets/images/Tree.png'),
        description: 'A serene grove of weeping willows, perfect for quiet contemplation.',
        navigateTo: '/homestead/explore/map/weeping-willow',
        showTitle: false
      };
    })
  ]
});
