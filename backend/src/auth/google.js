const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};

const authenticateUser = async (googleToken) => {
  try {
    const payload = await verifyGoogleToken(googleToken);
    
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

    return { user, token: jwtToken };
  } catch (error) {
    throw error;
  }
};

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};

module.exports = {
  verifyGoogleToken,
  authenticateUser,
  verifyJWT
};