const PlayerLogger = require('../services/PlayerLogger');

module.exports = (socket, io) => {
  // Create room
  socket.on('room:create', async (data, callback) => {
    try {
      // TODO: Implement room creation logic
      console.log('Creating room:', data);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'create',
        data,
        socket.user?.username,
        data.id || 'temp_room_id'
      );

      callback({ success: true, data: { id: 'temp_room_id', ...data } });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Get room
  socket.on('room:get', async (data, callback) => {
    try {
      // TODO: Implement room fetch logic
      console.log('Getting room:', data);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'get',
        data,
        socket.user?.username,
        data.id
      );

      callback({ success: true, data: { id: data.id, name: 'Test Room' } });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Get all rooms
  socket.on('room:list', async (data, callback) => {
    try {
      // TODO: Implement room listing logic
      console.log('Listing rooms:', data);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'list',
        data,
        socket.user?.username
      );

      callback({ success: true, data: [] });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Update room
  socket.on('room:update', async (data, callback) => {
    try {
      // TODO: Implement room update logic
      console.log('Updating room:', data);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'update',
        data,
        socket.user?.username,
        data.id
      );

      callback({ success: true, data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Delete room
  socket.on('room:delete', async (data, callback) => {
    try {
      // TODO: Implement room deletion logic
      console.log('Deleting room:', data);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'delete',
        data,
        socket.user?.username,
        data.id
      );

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Join room
  socket.on('room:join', async (data, callback) => {
    try {
      socket.join(data.roomId);
      console.log(`User ${socket.id} joined room ${data.roomId}`);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'join',
        data,
        socket.user?.username,
        data.roomId
      );

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Leave room
  socket.on('room:leave', async (data, callback) => {
    try {
      socket.leave(data.roomId);
      console.log(`User ${socket.id} left room ${data.roomId}`);

      // Log the action
      await PlayerLogger.logRoomAction(
        socket.id,
        'leave',
        data,
        socket.user?.username,
        data.roomId
      );

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
};