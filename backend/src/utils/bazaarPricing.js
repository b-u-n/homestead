/**
 * Calculate the price of a shop item based on purchase count.
 * All items start at 8 hearts and increase with popularity.
 *
 * Tier 1: Every 5 purchases → +1 heart (8→17 over 45 purchases)
 * Tier 2: Every 15 purchases → +1 heart (17→23 over 90 more)
 * Tier 3: Every 40 purchases → +1 heart (23→31 over 320 more)
 * Tier 4: Every 90 purchases → +1 heart (31→33 over 180 more)
 * Tier 5: Flat 33 until 4635, then 35
 */
function getPrice(purchaseCount) {
  if (purchaseCount < 45) return 8 + Math.floor(purchaseCount / 5);
  if (purchaseCount < 135) return 17 + Math.floor((purchaseCount - 45) / 15);
  if (purchaseCount < 455) return 23 + Math.floor((purchaseCount - 135) / 40);
  if (purchaseCount < 635) return 31 + Math.floor((purchaseCount - 455) / 90);
  if (purchaseCount < 4635) return 33;
  return 35;
}

module.exports = { getPrice };
