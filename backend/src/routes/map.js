const PlayerLogger = require('../services/PlayerLogger');

// Store active players by room
const roomPlayers = new Map(); // roomId -> Map(socketId -> playerData)

// Helper function to broadcast to all players in a room except sender
function broadcastToRoom(io, roomId, event, data, excludeSocketId = null) {
  if (!roomPlayers.has(roomId)) return;

  const players = roomPlayers.get(roomId);
  for (const [socketId, playerData] of players.entries()) {
    if (socketId !== excludeSocketId) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit(event, data);
      }
    }
  }
}

module.exports = (socket, io) => {
  // Handle character movement on map
  socket.on('map:move', async (data, callback) => {
    try {
      const { roomId, x, y, avatarUrl, username } = data;

      console.log(`[map:move] ${username} moved to (${x}, ${y}) in room ${roomId}`);

      // Update player position in room
      if (!roomPlayers.has(roomId)) {
        roomPlayers.set(roomId, new Map());
      }
      roomPlayers.get(roomId).set(socket.id, { x, y, avatarUrl, username });

      // Log the action
      await PlayerLogger.logMapAction(socket.id, 'move', { x, y, avatarUrl }, username, roomId);

      // Broadcast to all OTHER clients in the same room
      broadcastToRoom(io, roomId, 'map:move', {
        socketId: socket.id,
        roomId,
        x,
        y,
        avatarUrl,
        username
      }, socket.id);

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error handling map:move:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle character emote
  socket.on('map:emote', async (data, callback) => {
    try {
      const { roomId, emote, x, y, avatarUrl, username } = data;

      console.log(`[map:emote] ${username} emoted ${emote} at (${x}, ${y}) in room ${roomId}`);

      // Update player state with emote in room
      if (!roomPlayers.has(roomId)) {
        roomPlayers.set(roomId, new Map());
      }
      const player = roomPlayers.get(roomId).get(socket.id);
      if (player) {
        player.emote = emote;
        player.emoteTimestamp = Date.now();
      }

      // Log the action
      await PlayerLogger.logMapAction(socket.id, 'emote', { emote, x, y, avatarUrl }, username, roomId);

      // Broadcast to all OTHER clients in the same room
      broadcastToRoom(io, roomId, 'map:emote', {
        socketId: socket.id,
        roomId,
        emote,
        x,
        y,
        avatarUrl,
        username
      }, socket.id);

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error handling map:emote:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle player entering a room
  socket.on('map:enter', async (data, callback) => {
    try {
      const { roomId, x, y, avatarUrl, username } = data;

      console.log(`[map:enter] ${username} entered room ${roomId}`);

      // First, remove player from ALL other rooms and broadcast leave events
      for (const [otherRoomId, players] of roomPlayers.entries()) {
        if (otherRoomId !== roomId && players.has(socket.id)) {
          // Broadcast to other players in the old room BEFORE removing
          broadcastToRoom(io, otherRoomId, 'map:leave', {
            socketId: socket.id,
            roomId: otherRoomId
          }, socket.id);

          players.delete(socket.id);
          console.log(`[map:enter] Removed ${socket.id} from old room ${otherRoomId}`);

          // Clean up empty rooms
          if (players.size === 0) {
            roomPlayers.delete(otherRoomId);
          }
        }
      }

      // Get existing players in this room
      if (!roomPlayers.has(roomId)) {
        roomPlayers.set(roomId, new Map());
      }
      const existingPlayers = roomPlayers.get(roomId);

      // Add this player to the room
      existingPlayers.set(socket.id, { x, y, avatarUrl, username });

      // Log the action
      await PlayerLogger.logMapAction(socket.id, 'enter', { x, y, avatarUrl }, username, roomId);

      // Send existing players to the newly joined player
      const existingPlayersArray = [];
      for (const [socketId, playerData] of existingPlayers.entries()) {
        if (socketId !== socket.id) { // Don't send their own data back
          const playerInfo = {
            socketId,
            roomId,
            x: playerData.x,
            y: playerData.y,
            avatarUrl: playerData.avatarUrl,
            username: playerData.username
          };
          // Include emote if it exists and is recent (within 4.2 seconds)
          if (playerData.emote && playerData.emoteTimestamp) {
            const age = Date.now() - playerData.emoteTimestamp;
            if (age < 4200) { // 3s display + 1.2s fade
              playerInfo.emote = playerData.emote;
            }
          }
          existingPlayersArray.push(playerInfo);
        }
      }

      // Broadcast to all OTHER clients in the same room that a new player entered
      broadcastToRoom(io, roomId, 'map:enter', {
        socketId: socket.id,
        roomId,
        x,
        y,
        avatarUrl,
        username
      }, socket.id);

      callback({ success: true, data: { existingPlayers: existingPlayersArray } });
    } catch (error) {
      console.error('Error handling map:enter:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle player explicitly leaving a room (e.g., navigating to another location)
  socket.on('map:leave', async (data, callback) => {
    try {
      const { roomId } = data;

      console.log(`[map:leave] Socket ${socket.id} leaving room ${roomId}`);

      // Broadcast to other clients in that room that this player left BEFORE removing
      broadcastToRoom(io, roomId, 'map:leave', {
        socketId: socket.id,
        roomId
      }, socket.id);

      // Remove player from the specified room
      if (roomPlayers.has(roomId)) {
        const players = roomPlayers.get(roomId);
        if (players.has(socket.id)) {
          players.delete(socket.id);
          console.log(`[map:leave] Removed ${socket.id} from room ${roomId}`);

          // Clean up empty rooms
          if (players.size === 0) {
            roomPlayers.delete(roomId);
          }
        }
      }

      // Log the action
      await PlayerLogger.logMapAction(socket.id, 'leave', { roomId });

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error handling map:leave:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle player disconnecting (leaving all rooms)
  socket.on('disconnect', async () => {
    console.log(`[map:disconnect] Socket ${socket.id} disconnected`);

    // Remove player from all rooms and broadcast to each room
    for (const [roomId, players] of roomPlayers.entries()) {
      if (players.has(socket.id)) {
        // Broadcast to other players in this room BEFORE removing
        broadcastToRoom(io, roomId, 'map:leave', {
          socketId: socket.id,
          roomId
        }, socket.id);

        players.delete(socket.id);
        console.log(`[map:disconnect] Removed ${socket.id} from room ${roomId}`);

        // Clean up empty rooms
        if (players.size === 0) {
          roomPlayers.delete(roomId);
        }
      }
    }

    // Log the action
    await PlayerLogger.logMapAction(socket.id, 'disconnect', {});
  });
};
