const PlayerLogger = require('../services/PlayerLogger');

// Store active players by room
const roomPlayers = new Map(); // roomId -> Map(socketId -> playerData)

// Helper function to broadcast to all players in a room AND same layer except sender
function broadcastToRoom(io, roomId, event, data, excludeSocketId = null, senderLayerId = null) {
  if (!roomPlayers.has(roomId)) return;

  const players = roomPlayers.get(roomId);
  for (const [socketId, playerData] of players.entries()) {
    if (socketId !== excludeSocketId) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        // Only send to players on the same layer (or if no layer filtering)
        const targetLayerId = targetSocket.layerId || null;
        if (senderLayerId === null || targetLayerId === null || senderLayerId === targetLayerId) {
          targetSocket.emit(event, data);
        }
      }
    }
  }
}

module.exports = (socket, io) => {
  // Handle character movement on map
  socket.on('map:move', async (data, callback) => {
    try {
      const { roomId, x, y, avatarUrl, avatarColor, username } = data;
      const layerId = socket.layerId || null;

      console.log(`[map:move] ${username} moved to (${x}, ${y}) in room ${roomId} layer ${layerId}`);

      // Update player position in room
      if (!roomPlayers.has(roomId)) {
        roomPlayers.set(roomId, new Map());
      }
      roomPlayers.get(roomId).set(socket.id, { x, y, avatarUrl, avatarColor, username, layerId });

      // Log the action
      await PlayerLogger.logMapAction(socket.id, 'move', { x, y, avatarUrl }, username, roomId);

      // Broadcast to all OTHER clients in the same room AND layer
      broadcastToRoom(io, roomId, 'map:move', {
        socketId: socket.id,
        roomId,
        x,
        y,
        avatarUrl,
        avatarColor,
        username
      }, socket.id, layerId);

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error handling map:move:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle character emote
  socket.on('map:emote', async (data, callback) => {
    try {
      const { roomId, emote, x, y, avatarUrl, avatarColor, username } = data;
      const layerId = socket.layerId || null;

      console.log(`[map:emote] ${username} emoted ${emote} at (${x}, ${y}) in room ${roomId} layer ${layerId}`);

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

      // Broadcast to all OTHER clients in the same room AND layer
      broadcastToRoom(io, roomId, 'map:emote', {
        socketId: socket.id,
        roomId,
        emote,
        x,
        y,
        avatarUrl,
        avatarColor,
        username
      }, socket.id, layerId);

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error handling map:emote:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle player entering a room
  socket.on('map:enter', async (data, callback) => {
    try {
      const { roomId, x, y, avatarUrl, avatarColor, username } = data;
      const layerId = socket.layerId || null;

      console.log(`[map:enter] ${username} entered room ${roomId} layer ${layerId}`);

      // First, remove player from ALL other rooms and broadcast leave events
      for (const [otherRoomId, players] of roomPlayers.entries()) {
        if (otherRoomId !== roomId && players.has(socket.id)) {
          const oldPlayerData = players.get(socket.id);
          const oldLayerId = oldPlayerData?.layerId || null;

          // Broadcast to other players in the old room BEFORE removing
          broadcastToRoom(io, otherRoomId, 'map:leave', {
            socketId: socket.id,
            roomId: otherRoomId
          }, socket.id, oldLayerId);

          // Also emit to ourselves so we can stop sounds etc.
          console.log(`[map:enter] Emitting map:leave to self for old room ${otherRoomId}`);
          socket.emit('map:leave', {
            socketId: socket.id,
            roomId: otherRoomId
          });

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

      // Add this player to the room with layer info
      existingPlayers.set(socket.id, { x, y, avatarUrl, avatarColor, username, layerId });

      // Log the action
      await PlayerLogger.logMapAction(socket.id, 'enter', { x, y, avatarUrl }, username, roomId);

      // Send existing players to the newly joined player (only those on same layer)
      const existingPlayersArray = [];
      for (const [socketId, playerData] of existingPlayers.entries()) {
        if (socketId !== socket.id) { // Don't send their own data back
          // Only include players on the same layer
          const playerLayerId = playerData.layerId || null;
          if (layerId === null || playerLayerId === null || layerId === playerLayerId) {
            const playerInfo = {
              socketId,
              roomId,
              x: playerData.x,
              y: playerData.y,
              avatarUrl: playerData.avatarUrl,
              avatarColor: playerData.avatarColor,
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
      }

      // Broadcast to all OTHER clients in the same room AND layer that a new player entered
      broadcastToRoom(io, roomId, 'map:enter', {
        socketId: socket.id,
        roomId,
        x,
        y,
        avatarUrl,
        avatarColor,
        username
      }, socket.id, layerId);

      callback({ success: true, socketId: socket.id, roomId, data: { existingPlayers: existingPlayersArray } });
    } catch (error) {
      console.error('Error handling map:enter:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle player explicitly leaving a room (e.g., navigating to another location)
  socket.on('map:leave', async (data, callback) => {
    try {
      const { roomId } = data;
      const layerId = socket.layerId || null;

      console.log(`[map:leave] Socket ${socket.id} leaving room ${roomId} layer ${layerId}`);

      // Broadcast to other clients in that room AND layer that this player left BEFORE removing
      broadcastToRoom(io, roomId, 'map:leave', {
        socketId: socket.id,
        roomId
      }, socket.id, layerId);

      // Emit to ourselves so we can stop sounds etc.
      socket.emit('map:leave', {
        socketId: socket.id,
        roomId
      });

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

      if (callback) callback({ success: true, socketId: socket.id, roomId });
    } catch (error) {
      console.error('Error handling map:leave:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle player disconnecting (leaving all rooms)
  socket.on('disconnect', async () => {
    console.log(`[map:disconnect] Socket ${socket.id} disconnected`);
    const layerId = socket.layerId || null;

    // Remove player from all rooms and broadcast to each room
    for (const [roomId, players] of roomPlayers.entries()) {
      if (players.has(socket.id)) {
        const playerData = players.get(socket.id);
        const playerLayerId = playerData?.layerId || layerId;

        // Broadcast to other players in this room AND layer BEFORE removing
        broadcastToRoom(io, roomId, 'map:leave', {
          socketId: socket.id,
          roomId
        }, socket.id, playerLayerId);

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
