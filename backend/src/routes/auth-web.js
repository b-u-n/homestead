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

// Helper to get the correct protocol (respects X-Forwarded-Proto from nginx)
const getBaseUrl = (req) => {
  const protocol = req.get('X-Forwarded-Proto') || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

// Discord OAuth configuration
const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_SCOPES = ['identify'].join(' ');

// Start Google OAuth flow
router.get('/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    redirect_uri: `${getBaseUrl(req)}/auth/google/callback`
  });
  
  res.redirect(authUrl);
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    const { tokens } = await client.getToken({
      code,
      redirect_uri: `${getBaseUrl(req)}/auth/google/callback`
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

// Start Discord OAuth flow
router.get('/discord', (req, res) => {
  const redirectUri = `${getBaseUrl(req)}/auth/discord/callback`;
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(DISCORD_SCOPES)}`;

  res.redirect(authUrl);
});

// Handle Discord OAuth callback
router.get('/discord/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = `${getBaseUrl(req)}/auth/discord/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Get user info from Discord
    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (discordUser.error) {
      throw new Error(discordUser.error);
    }

    // Find or create user
    let user = await User.findOne({ discordId: discordUser.id });

    if (!user) {
      // Check if user exists with same email
      if (discordUser.email) {
        user = await User.findOne({ email: discordUser.email });
        if (user) {
          // Link Discord to existing account
          user.discordId = discordUser.id;
          await user.save();
        }
      }

      if (!user) {
        user = new User({
          discordId: discordUser.id,
          email: discordUser.email || `${discordUser.id}@discord.user`,
          name: discordUser.global_name || discordUser.username,
          avatar: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null
        });
        await user.save();
      }
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
    console.error('Discord auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

module.exports = router;