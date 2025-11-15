const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile with full avatar data
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        googleId: user.googleId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        avatarData: user.avatarData, // Full avatar generation data
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Save user's avatar
router.post('/save-avatar', authenticateToken, async (req, res) => {
  try {
    const { userId, avatarUrl, avatarData } = req.body;

    if (!userId || !avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, avatarUrl'
      });
    }

    // Download the image from OpenAI
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      throw new Error('Failed to download avatar image');
    }

    const imageBuffer = await response.buffer();
    
    // Generate unique filename
    const filename = `avatar_${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.png`;
    const avatarDir = path.join(__dirname, '../../public/avatars');
    const avatarPath = path.join(avatarDir, filename);

    // Ensure avatars directory exists
    await fs.mkdir(avatarDir, { recursive: true });

    // Save image to file system
    await fs.writeFile(avatarPath, imageBuffer);

    // Update user in database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete old avatar file if it exists
    if (user.avatar && user.avatar.startsWith('/api/avatars/')) {
      const oldFilename = user.avatar.split('/').pop();
      const oldPath = path.join(avatarDir, oldFilename);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Could not delete old avatar file:', err.message);
      }
    }

    // Update user with new avatar info
    user.avatar = `/api/avatars/${filename}`;
    user.avatarData = avatarData;
    await user.save();

    res.json({
      success: true,
      avatarUrl: user.avatar,
      message: 'Avatar saved successfully'
    });

  } catch (error) {
    console.error('Error saving avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save avatar'
    });
  }
});

// Serve avatar images
router.get('/avatars/:filename', (req, res) => {
  const filename = req.params.filename;
  const avatarPath = path.join(__dirname, '../../public/avatars', filename);
  
  res.sendFile(avatarPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Avatar not found' });
    }
  });
});

module.exports = router;