const { authenticateUser, verifyJWT } = require('../auth/google');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (socket, io) => {
  // Google OAuth login
  socket.on('auth:google', async (data, callback) => {
    try {
      const { googleToken } = data;
      const result = await authenticateUser(googleToken);
      
      socket.userId = result.user._id;
      socket.user = result.user;
      
      callback({ 
        success: true, 
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      console.error('Google auth error:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Logout
  socket.on('auth:logout', async (data, callback) => {
    try {
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
      
      callback({ success: true, data: { user } });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
};