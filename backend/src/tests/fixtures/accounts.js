const Account = require('../../models/Account');
const crypto = require('crypto');

/**
 * Create a test account with a session
 */
async function createAccount(overrides = {}) {
  const sessionId = overrides.sessionId || crypto.randomUUID();

  const account = new Account({
    visitorId: crypto.randomUUID(),
    hearts: 5,
    heartBank: 0,
    userData: {
      username: `TestUser_${Date.now()}`,
      avatar: null,
      ...overrides.userData
    },
    activeSessions: [{
      sessionId,
      visitorId: crypto.randomUUID(),
      createdAt: new Date(),
      lastActiveAt: new Date()
    }],
    ...overrides,
    // Ensure activeSessions isn't overwritten incorrectly
    ...(overrides.activeSessions ? {} : {})
  });

  // Re-apply sessionId to activeSessions if not provided in overrides
  if (!overrides.activeSessions) {
    account.activeSessions = [{
      sessionId,
      visitorId: crypto.randomUUID(),
      createdAt: new Date(),
      lastActiveAt: new Date()
    }];
  }

  await account.save();

  return {
    account,
    sessionId: account.activeSessions[0].sessionId
  };
}

module.exports = { createAccount };
