/**
 * Platform Asset Catalog
 * Catalog of existing platform assets grouped by category.
 * Contributors can propose updates to these assets via the Drawing Board.
 * Each asset has an optional `image` require for thumbnail display.
 */
export const PLATFORM_ASSETS = [
  // Sprites — interactive objects placed on location maps
  { id: 'entity-campfire', category: 'Sprites', name: 'Campfire', image: require('../assets/images/campfire.png') },
  { id: 'entity-wishing-well', category: 'Sprites', name: 'Wishing Well', image: require('../assets/images/wishing-well.png') },
  { id: 'entity-help-wanted', category: 'Sprites', name: 'Help Wanted Board', image: require('../assets/images/help-wanted.png') },
  { id: 'entity-journal', category: 'Sprites', name: 'Journal', image: require('../assets/images/journal.png') },
  { id: 'entity-weeping-willow', category: 'Sprites', name: 'Weeping Willow Tree', image: require('../assets/images/weeping-willow.png') },
  { id: 'entity-sugarbee-cafe', category: 'Sprites', name: 'Sugarbee Cafe Door', image: require('../assets/images/sugarbee-cafe.png') },
  { id: 'entity-bazaar', category: 'Sprites', name: 'Bazaar Door', image: require('../assets/images/bank.png') },
  { id: 'entity-cafe-couch', category: 'Sprites', name: 'Cafe Couch', image: require('../assets/images/sugarbee-cafe-couch.png') },
  { id: 'entity-back-button', category: 'Sprites', name: 'Back Button Sign', image: require('../assets/images/map-back-button.png') },
  { id: 'entity-knapsack', category: 'Sprites', name: 'Knapsack', image: require('../assets/images/knapsack.png') },

  // Bookshelves — library room interactive shelves
  { id: 'bookshelf-emotions', category: 'Bookshelves', name: 'Emotions', image: require('../assets/images/bookshelf-emotions.png') },
  { id: 'bookshelf-depression', category: 'Bookshelves', name: 'Depression', image: require('../assets/images/bookshelf-depression.png') },
  { id: 'bookshelf-stress', category: 'Bookshelves', name: 'Stress', image: require('../assets/images/bookshelf-stress.png') },
  { id: 'bookshelf-anxiety', category: 'Bookshelves', name: 'Anxiety', image: require('../assets/images/bookshelf-anxiety.png') },
  { id: 'bookshelf-attachment', category: 'Bookshelves', name: 'Attachment', image: require('../assets/images/bookshelf-attachment.png') },
  { id: 'bookshelf-boundaries', category: 'Bookshelves', name: 'Boundaries', image: require('../assets/images/bookshelf-boundaries.png') },
  { id: 'bookshelf-loneliness', category: 'Bookshelves', name: 'Loneliness', image: require('../assets/images/bookshelf-loneliness.png') },
  { id: 'bookshelf-adhd', category: 'Bookshelves', name: 'ADHD', image: require('../assets/images/bookshelf-adhd.png') },
  { id: 'bookshelf-burnout', category: 'Bookshelves', name: 'Burnout', image: require('../assets/images/bookshelf-burnout.png') },
  { id: 'bookshelf-grief', category: 'Bookshelves', name: 'Grief', image: require('../assets/images/bookshelf-grief.png') },
  { id: 'bookshelf-trauma', category: 'Bookshelves', name: 'Trauma', image: require('../assets/images/bookshelf-trauma.png') },
  { id: 'bookshelf-accountability', category: 'Bookshelves', name: 'Accountability', image: require('../assets/images/bookshelf-accountability.png') },
  { id: 'bookshelf-self', category: 'Bookshelves', name: 'Self', image: require('../assets/images/bookshelf-self.png') },
  { id: 'bookshelf-impulses', category: 'Bookshelves', name: 'Impulses', image: require('../assets/images/bookshelf-impulses.png') },
  { id: 'bookshelf-anger', category: 'Bookshelves', name: 'Anger', image: require('../assets/images/bookshelf-anger.png') },

  // Textures — UI component backgrounds
  { id: 'texture-minky', category: 'Textures', name: 'Minky Panel', image: require('../assets/images/slot-bg-2.jpeg') },
  { id: 'texture-wool', category: 'Textures', name: 'Wool Button', image: require('../assets/images/button-bg.png') },
  { id: 'texture-wood', category: 'Textures', name: 'Wood Background', image: require('../assets/images/wood-texture.jpg') },

  // Background Tiles — repeating tile patterns
  { id: 'bg-tile-main', category: 'Background Tiles', name: 'Main Tile', image: require('../assets/images/background-tile.jpeg') },
  { id: 'bg-tile-1', category: 'Background Tiles', name: 'Tile Variant 1', image: require('../assets/images/bg-tile-1.png') },
  { id: 'bg-tile-2', category: 'Background Tiles', name: 'Tile Variant 2', image: require('../assets/images/bg-tile-2.png') },
  { id: 'bg-tile-3', category: 'Background Tiles', name: 'Tile Variant 3', image: require('../assets/images/bg-tile-3.png') },
  { id: 'bg-tile-4', category: 'Background Tiles', name: 'Tile Variant 4', image: require('../assets/images/bg-tile-4.png') },

  // Emotes — character reaction images
  { id: 'emote-heart', category: 'Emotes', name: 'Heart', image: require('../assets/images/heart.png') },
  { id: 'emote-happy-moet', category: 'Emotes', name: 'Happy Moet', image: require('../assets/images/happy-moet.png') },
  { id: 'emote-blank-moet', category: 'Emotes', name: 'Blank Moet', image: require('../assets/images/blank-moet.png') },
  { id: 'emote-fier-moet', category: 'Emotes', name: 'Fier Moet', image: require('../assets/images/fier-moet.png') },
];

export const ASSET_CATEGORIES = [...new Set(PLATFORM_ASSETS.map(a => a.category))];

export default PLATFORM_ASSETS;
