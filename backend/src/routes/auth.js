const { authenticateUser, verifyJWT } = require('../auth/google');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlayerLogger = require('../services/PlayerLogger');

module.exports = (socket, io) => {
  // Google OAuth login
  socket.on('auth:google', async (data, callback) => {
    try {
      const { googleToken } = data;
      const result = await authenticateUser(googleToken);

      socket.userId = result.user._id;
      socket.user = result.user;

      // Log the action
      await PlayerLogger.logAuthAction(
        socket.id,
        'google',
        { email: result.user.email },
        result.user.username,
        result.user._id
      );

      callback({
        success: true,
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      console.error('Google auth error:', error);

      // Log failed auth attempt
      await PlayerLogger.logAuthAction(
        socket.id,
        'google_failed',
        { error: error.message }
      );

      callback({ success: false, error: error.message });
    }
  });

  // Logout
  socket.on('auth:logout', async (data, callback) => {
    try {
      const username = socket.user?.username;
      const userId = socket.userId;

      // Log the action
      await PlayerLogger.logAuthAction(
        socket.id,
        'logout',
        {},
        username,
        userId
      );

      socket.userId = null;
      socket.user = null;
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Verify session
  socket.on('auth:verify', async (data, callback) => {
    try {
      const { token } = data;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      socket.userId = user._id;
      socket.user = user;

      // Log the action
      await PlayerLogger.logAuthAction(
        socket.id,
        'verify',
        { email: user.email },
        user.username,
        user._id
      );

      callback({ success: true, data: { user } });
    } catch (error) {
      // Log failed verification
      await PlayerLogger.logAuthAction(
        socket.id,
        'verify_failed',
        { error: error.message }
      );

      callback({ success: false, error: error.message });
    }
  });
};