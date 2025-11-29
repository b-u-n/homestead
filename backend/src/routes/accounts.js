const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Helper to get backend base URL
// TODO: Move to S3, then this will be replaced with S3 URL
const getBackendUrl = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

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
        account: existingAccount
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
      account: account
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

// Update last screen
router.post('/update-screen', async (req, res) => {
  try {
    const { sessionId, lastScreen } = req.body;

    if (!sessionId || !lastScreen) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and last screen are required'
      });
    }

    const account = await Account.findOneAndUpdate(
      { 'activeSessions.sessionId': sessionId },
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

// Save user data and avatar to session account
router.post('/save-user-avatar', async (req, res) => {
  try {
    const { sessionId, username, avatarUrl: sourceAvatarUrl, avatarData } = req.body;

    if (!sessionId || !username || !sourceAvatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, username, and avatar URL are required'
      });
    }

    // Find existing account by session ID
    const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Download and save the avatar image
    const response = await fetch(sourceAvatarUrl);
    if (!response.ok) {
      throw new Error('Failed to download avatar image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // Generate unique filename
    const filename = `avatar_${sessionId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.png`;
    const avatarDir = path.join(__dirname, '../../public/avatars');
    const avatarPath = path.join(avatarDir, filename);

    // Ensure avatars directory exists
    await fs.mkdir(avatarDir, { recursive: true });

    // Save image to file system
    await fs.writeFile(avatarPath, imageBuffer);

    // Construct full avatar URL (TODO: Replace with S3 URL when migrating)
    const backendUrl = getBackendUrl(req);
    const avatarUrl = `${backendUrl}/api/avatars/${filename}`;

    // Update account with user data and avatar
    account.userData = {
      username,
      avatar: avatarUrl,
      avatarData
    };
    account.updatedAt = new Date();
    await account.save();

    // Return user object for AuthStore
    const user = {
      id: account._id,
      sessionId: account.sessionId,
      username: username,
      avatar: avatarUrl,
      avatarData: avatarData
    };

    res.json({
      success: true,
      user: user,
      token: `session_${sessionId}`,
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