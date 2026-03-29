// Feature level requirements
// Maps feature IDs to the minimum featureLevel needed on the account.
// If a player's featureLevel is below the requirement, the feature
// does not exist to them (invisible, not locked).
//
// To add a new gated feature:
//   1. Add its ID and required level here
//   2. Use hasFeature(account, featureId) in backend handlers
//   3. Use FeatureStore.has(featureId) in frontend components

const FEATURE_LEVELS = {
  // Pixel Pals board sizes
  'pixelPals:size:16x16': 0,
  'pixelPals:size:32x32': 0,
  'pixelPals:size:48x48': 1,
  'pixelPals:size:custom': 3,
};

module.exports = FEATURE_LEVELS;
