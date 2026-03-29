const FEATURE_LEVELS = require('../config/featureLevels');
const Account = require('../models/Account');

/**
 * Check if an account has access to a specific feature.
 * Returns false if the feature ID is not in the config (unknown features are inaccessible).
 */
function hasFeature(account, featureId) {
  const requiredLevel = FEATURE_LEVELS[featureId];
  if (requiredLevel === undefined) return false;
  return (account.featureLevel || 0) >= requiredLevel;
}

/**
 * Filter a list of feature IDs to only those accessible by the account.
 */
function filterFeatures(account, featureIds) {
  return featureIds.filter(id => hasFeature(account, id));
}

/**
 * Get all feature IDs accessible by the account.
 */
function getAccessibleFeatures(account) {
  const level = account.featureLevel || 0;
  return Object.entries(FEATURE_LEVELS)
    .filter(([, requiredLevel]) => level >= requiredLevel)
    .map(([featureId]) => featureId);
}

/**
 * Set a player's feature level (admin function).
 * Returns the updated account or null if not found.
 */
async function setFeatureLevel(accountId, level) {
  const account = await Account.findByIdAndUpdate(
    accountId,
    { featureLevel: level },
    { new: true }
  );
  return account;
}

module.exports = {
  hasFeature,
  filterFeatures,
  getAccessibleFeatures,
  setFeatureLevel,
  FEATURE_LEVELS
};
