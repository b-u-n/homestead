const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL || 'http://192.168.0.143:9001'}/auth/callback`
);

// Start Google OAuth flow
router.get('/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    redirect_uri: `${req.protocol}://${req.get('host')}/auth/google/callback`
  });
  
  res.redirect(authUrl);
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    const { tokens } = await client.getToken({
      code,
      redirect_uri: `${req.protocol}://${req.get('host')}/auth/google/callback`
    });
    
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify(user))}`);
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

module.exports = router;