/**
 * Permission middleware for WebSocket and REST routes
 */

/**
 * Check if account has a specific permission
 * @param {Object} account - Account document
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
function hasPermission(account, permission) {
  if (!account || !account.permissions) return false;
  return account.permissions.includes(permission);
}

/**
 * Check if account has admin permission
 * @param {Object} account - Account document
 * @returns {boolean}
 */
function isAdmin(account) {
  return hasPermission(account, 'admin');
}

/**
 * Check if account has moderator permission (or higher)
 * @param {Object} account - Account document
 * @returns {boolean}
 */
function isModerator(account) {
  return hasPermission(account, 'moderator') || isAdmin(account);
}

/**
 * Check if account has creator permission (or higher)
 * @param {Object} account - Account document
 * @returns {boolean}
 */
function isCreator(account) {
  return hasPermission(account, 'creator') || isModerator(account);
}

/**
 * WebSocket middleware to require a permission
 * @param {string} permission - Required permission
 * @returns {Function} Middleware function
 */
function requirePermission(permission) {
  return (socket, next) => {
    const account = socket.user;
    if (!account) {
      return next(new Error('Not authenticated'));
    }
    if (!hasPermission(account, permission) && !isAdmin(account)) {
      return next(new Error(`Permission denied: requires ${permission}`));
    }
    next();
  };
}

/**
 * REST middleware to require a permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
function requirePermissionREST(permission) {
  return (req, res, next) => {
    const account = req.account;
    if (!account) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!hasPermission(account, permission) && !isAdmin(account)) {
      return res.status(403).json({ error: `Permission denied: requires ${permission}` });
    }
    next();
  };
}

module.exports = {
  hasPermission,
  isAdmin,
  isModerator,
  isCreator,
  requirePermission,
  requirePermissionREST
};
