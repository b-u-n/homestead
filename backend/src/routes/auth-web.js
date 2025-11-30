const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');

const router = express.Router();
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL || 'http://192.168.0.143:9001'}/auth/callback`
);

// Helper to get the correct base URL
const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  return `${req.protocol}://${req.get('host')}`;
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

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let account = await Account.findOne({ googleId: payload.sub });

    if (!account) {
      account = new Account({
        activeSessions: [{
          sessionId,
          createdAt: new Date(),
          lastActiveAt: new Date()
        }],
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        googleData: payload
      });
      await account.save();
    } else {
      // Add new session to existing account and update google data
      account.activeSessions.push({
        sessionId,
        createdAt: new Date(),
        lastActiveAt: new Date()
      });
      account.googleData = payload;
      await account.save();
    }

    const jwtToken = jwt.sign(
      { accountId: account._id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token only
    res.redirect(`${process.env.FRONTEND_URL}?token=${jwtToken}`);

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

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let account = await Account.findOne({ discordId: discordUser.id });

    if (!account) {
      account = new Account({
        activeSessions: [{
          sessionId,
          createdAt: new Date(),
          lastActiveAt: new Date()
        }],
        discordId: discordUser.id,
        name: discordUser.global_name || discordUser.username,
        discordData: discordUser
      });
      await account.save();
    } else {
      // Add new session to existing account and update discord data
      account.activeSessions.push({
        sessionId,
        createdAt: new Date(),
        lastActiveAt: new Date()
      });
      account.discordData = discordUser;
      await account.save();
    }

    const jwtToken = jwt.sign(
      { accountId: account._id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token only
    res.redirect(`${process.env.FRONTEND_URL}?token=${jwtToken}`);

  } catch (error) {
    console.error('Discord auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

module.exports = router;