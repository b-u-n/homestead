const Account = require('../models/Account');
const PlayerLogger = require('../services/PlayerLogger');

module.exports = (socket, io) => {
  // Create user
  socket.on('user:create', async (data, callback) => {
    try {
      // TODO: Implement user creation logic
      console.log('Creating user:', data);

      // Log the action
      await PlayerLogger.logUserAction(
        socket.id,
        'create',
        data,
        data.username
      );

      callback({ success: true, data: { id: 'temp_id', ...data } });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Get user by session ID
  socket.on('user:get', async (data, callback) => {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        return callback({ success: false, error: 'Session ID is required' });
      }

      const account = await Account.findOne({ sessionId });

      if (!account) {
        return callback({ success: false, error: 'User not found' });
      }

      // Return user profile data
      const userProfile = {
        id: account._id,
        sessionId: account.sessionId,
        username: account.userData?.username,
        avatar: account.userData?.avatar,
        avatarData: account.userData?.avatarData,
        energy: 100, // TODO: Get from account or default
        maxEnergy: 100,
        hearts: 9,
        maxHearts: 9,
        currentStatus: account.currentStatus || ''
      };

      // Log the action
      await PlayerLogger.logUserAction(
        socket.id,
        'get',
        { sessionId },
        account.userData?.username,
        account._id
      );

      callback({ success: true, data: userProfile });
    } catch (error) {
      console.error('Error getting user:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Update user
  socket.on('user:update', async (data, callback) => {
    try {
      // TODO: Implement user update logic
      console.log('Updating user:', data);

      // Log the action
      await PlayerLogger.logUserAction(
        socket.id,
        'update',
        data,
        socket.user?.username,
        socket.userId
      );

      callback({ success: true, data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Delete user
  socket.on('user:delete', async (data, callback) => {
    try {
      // TODO: Implement user deletion logic
      console.log('Deleting user:', data);

      // Log the action
      await PlayerLogger.logUserAction(
        socket.id,
        'delete',
        data,
        socket.user?.username,
        socket.userId
      );

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
};