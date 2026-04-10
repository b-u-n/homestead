const express = require('express');
const router = express.Router();
const Account = require('../models/Account');

// Create new account with session ID or return existing
router.post('/create', async (req, res) => {
  try {
    const { sessionId, lastScreen } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Check if account already exists with this session
    const existingAccount = await Account.findOne({ 'activeSessions.sessionId': sessionId });
    if (existingAccount) {
      // Update last active time for this session
      await Account.updateOne(
        { _id: existingAccount._id, 'activeSessions.sessionId': sessionId },
        { $set: { 'activeSessions.$.lastActiveAt': new Date() } }
      );
      return res.json({
        success: true,
        account: existingAccount,
        accountId: existingAccount._id
      });
    }

    // Create new account with this session
    const account = new Account({
      activeSessions: [{
        sessionId,
        createdAt: new Date(),
        lastActiveAt: new Date()
      }],
      lastScreen: lastScreen || 'Landing',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await account.save();

    res.json({
      success: true,
      account: account,
      accountId: account._id
    });

  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

// Get account by session ID
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      account: account
    });

  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// Get account by account ID (MongoDB _id)
router.get('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      account: account
    });

  } catch (error) {
    console.error('Error fetching account by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// Update last screen
router.post('/update-screen', async (req, res) => {
  try {
    const { accountId, sessionId, lastScreen } = req.body;

    if (!lastScreen) {
      return res.status(400).json({
        success: false,
        error: 'Last screen is required'
      });
    }

    if (!accountId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID or Session ID is required'
      });
    }

    // Find by accountId (preferred) or sessionId (fallback)
    const query = accountId
      ? { _id: accountId }
      : { 'activeSessions.sessionId': sessionId };

    const account = await Account.findOneAndUpdate(
      query,
      {
        lastScreen,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      account: account
    });

  } catch (error) {
    console.error('Error updating last screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update last screen'
    });
  }
});

// Save user data and avatar to account
router.post('/save-user-avatar', async (req, res) => {
  try {
    const { accountId, sessionId, username, avatarUrl: sourceAvatarUrl, avatarData } = req.body;

    if (!username || !sourceAvatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Username and avatar URL are required'
      });
    }

    if (!accountId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID or Session ID is required'
      });
    }

    // Find account by accountId (preferred) or sessionId (fallback)
    let account;
    if (accountId) {
      account = await Account.findById(accountId);
    } else {
      account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // The avatar is already saved in GCS from the generation step.
    // sourceAvatarUrl is a relative path like /api/avatars/filename.png — just use it directly.
    const avatarUrl = sourceAvatarUrl;

    // Update account with user data and avatar
    account.userData = {
      username,
      avatar: avatarUrl,
      avatarData
    };
    account.updatedAt = new Date();
    await account.save();

    // Get the active sessionId for this request
    const activeSessionId = sessionId || (account.activeSessions[0]?.sessionId);

    // Return user object for AuthStore
    const user = {
      id: account._id,
      sessionId: activeSessionId,
      username: username,
      avatar: avatarUrl,
      avatarData: avatarData
    };

    res.json({
      success: true,
      user: user,
      accountId: account._id,
      message: 'User data and avatar saved successfully'
    });

  } catch (error) {
    console.error('Error saving user avatar:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save user data and avatar'
    });
  }
});

// Link Google account to session
router.post('/link-google', async (req, res) => {
  try {
    const { sessionId, googleUser, token } = req.body;

    if (!sessionId || !googleUser) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and Google user data are required'
      });
    }

    const account = await Account.findOneAndUpdate(
      { 'activeSessions.sessionId': sessionId },
      {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        googleData: googleUser,
        authToken: token,
        linkedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      account: account
    });

  } catch (error) {
    console.error('Error linking Google account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link Google account'
    });
  }
});

module.exports = router;