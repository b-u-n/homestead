// Portable item types show in the knapsack.
// Non-portable types (map-sprite, decoration, avvie) only appear in
// the Customization Table or other specialized UIs.
const PORTABLE_TYPES = ['sketch', 'toy', 'emoji', 'spell'];

/**
 * Determine if an item storeType is portable (shows in knapsack).
 */
function isPortable(storeType) {
  return PORTABLE_TYPES.includes(storeType);
}

module.exports = { isPortable, PORTABLE_TYPES };
