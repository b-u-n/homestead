/**
 * Layers WebSocket handlers
 * Manages layer listing, joining, and player counts
 */

const Layer = require('../models/Layer');
const Account = require('../models/Account');
const { isAdmin } = require('../middleware/permissions');

// Track players per layer (layerId -> Set of socketIds)
const layerPlayers = new Map();

/**
 * Get player count for a layer
 */
function getLayerPlayerCount(layerId) {
  const players = layerPlayers.get(layerId.toString());
  return players ? players.size : 0;
}

/**
 * Add player to layer tracking
 */
function addPlayerToLayer(layerId, socketId) {
  const layerIdStr = layerId.toString();
  if (!layerPlayers.has(layerIdStr)) {
    layerPlayers.set(layerIdStr, new Set());
  }
  layerPlayers.get(layerIdStr).add(socketId);
}

/**
 * Remove player from layer tracking
 */
function removePlayerFromLayer(layerId, socketId) {
  const layerIdStr = layerId.toString();
  const players = layerPlayers.get(layerIdStr);
  if (players) {
    players.delete(socketId);
    if (players.size === 0) {
      layerPlayers.delete(layerIdStr);
    }
  }
}

/**
 * Remove player from all layers (on disconnect)
 */
function removePlayerFromAllLayers(socketId) {
  for (const [layerId, players] of layerPlayers.entries()) {
    players.delete(socketId);
    if (players.size === 0) {
      layerPlayers.delete(layerId);
    }
  }
}

/**
 * Get current layer for a socket
 */
function getSocketLayer(socketId) {
  for (const [layerId, players] of layerPlayers.entries()) {
    if (players.has(socketId)) {
      return layerId;
    }
  }
  return null;
}

module.exports = (socket, io) => {
  /**
   * List all active layers with player counts
   */
  socket.on('layers:list', async (data, callback) => {
    try {
      const layers = await Layer.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .lean();

      // Add player counts to each layer
      const layersWithCounts = layers.map(layer => ({
        ...layer,
        playerCount: getLayerPlayerCount(layer._id)
      }));

      callback({ success: true, layers: layersWithCounts });
    } catch (error) {
      console.error('Error listing layers:', error);
      callback({ success: false, error: 'Failed to list layers' });
    }
  });

  /**
   * Create a new layer (admin only)
   */
  socket.on('layers:create', async (data, callback) => {
    try {
      const account = socket.user;
      if (!account) {
        return callback({ success: false, error: 'Not authenticated' });
      }

      if (!isAdmin(account)) {
        return callback({ success: false, error: 'Permission denied: requires admin' });
      }

      const { name, description, order, isDefault, maxPlayers } = data;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return callback({ success: false, error: 'Layer name is required' });
      }

      // Check for duplicate name
      const existing = await Layer.findOne({ name: name.trim() });
      if (existing) {
        return callback({ success: false, error: 'A layer with this name already exists' });
      }

      const layer = new Layer({
        name: name.trim(),
        description: description || '',
        order: order || 0,
        isDefault: isDefault || false,
        maxPlayers: maxPlayers || 0,
        createdBy: account._id
      });

      await layer.save();

      callback({ success: true, layer: layer.toObject() });
    } catch (error) {
      console.error('Error creating layer:', error);
      callback({ success: false, error: 'Failed to create layer' });
    }
  });

  /**
   * Join a layer (no auth required - guests can explore)
   */
  socket.on('layers:join', async (data, callback) => {
    try {
      const account = socket.user; // May be null for guests

      const { layerId } = data;
      if (!layerId) {
        return callback({ success: false, error: 'Layer ID is required' });
      }

      const layer = await Layer.findById(layerId);
      if (!layer) {
        return callback({ success: false, error: 'Layer not found' });
      }

      if (!layer.isActive) {
        return callback({ success: false, error: 'Layer is not active' });
      }

      // Check max players
      if (layer.maxPlayers > 0) {
        const currentCount = getLayerPlayerCount(layer._id);
        if (currentCount >= layer.maxPlayers) {
          return callback({ success: false, error: 'Layer is full' });
        }
      }

      // Remove from previous layer if any
      const previousLayerId = getSocketLayer(socket.id);
      if (previousLayerId) {
        removePlayerFromLayer(previousLayerId, socket.id);
      }

      // Add to new layer
      addPlayerToLayer(layer._id, socket.id);

      // Update socket with layer info
      socket.layerId = layer._id.toString();

      // Update account's current layer (only if authenticated)
      if (account?._id) {
        await Account.findByIdAndUpdate(account._id, { currentLayer: layer._id });
      }

      callback({
        success: true,
        layer: {
          ...layer.toObject(),
          playerCount: getLayerPlayerCount(layer._id)
        }
      });
    } catch (error) {
      console.error('Error joining layer:', error);
      callback({ success: false, error: 'Failed to join layer' });
    }
  });

  /**
   * Leave current layer
   */
  socket.on('layers:leave', async (data, callback) => {
    try {
      const currentLayerId = getSocketLayer(socket.id);
      if (currentLayerId) {
        removePlayerFromLayer(currentLayerId, socket.id);
      }
      socket.layerId = null;

      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error leaving layer:', error);
      if (callback) {
        callback({ success: false, error: 'Failed to leave layer' });
      }
    }
  });

  /**
   * Get current layer info (no auth required)
   */
  socket.on('layers:current', async (data, callback) => {
    try {
      const account = socket.user; // May be null for guests

      // Check if already in a layer via socket
      const currentLayerId = socket.layerId || getSocketLayer(socket.id);

      if (currentLayerId) {
        const layer = await Layer.findById(currentLayerId).lean();
        if (layer) {
          return callback({
            success: true,
            layer: {
              ...layer,
              playerCount: getLayerPlayerCount(layer._id)
            }
          });
        }
      }

      // Check account's saved layer (only if authenticated)
      if (account?.currentLayer) {
        const layer = await Layer.findById(account.currentLayer).lean();
        if (layer && layer.isActive) {
          return callback({
            success: true,
            layer: {
              ...layer,
              playerCount: getLayerPlayerCount(layer._id)
            }
          });
        }
      }

      // No current layer
      callback({ success: true, layer: null });
    } catch (error) {
      console.error('Error getting current layer:', error);
      callback({ success: false, error: 'Failed to get current layer' });
    }
  });

  /**
   * Handle disconnect - clean up layer tracking
   */
  socket.on('disconnect', () => {
    removePlayerFromAllLayers(socket.id);
  });
};

// Export helper functions for use in map.js
module.exports.getSocketLayer = getSocketLayer;
module.exports.layerPlayers = layerPlayers;
module.exports.removePlayerFromAllLayers = removePlayerFromAllLayers;
