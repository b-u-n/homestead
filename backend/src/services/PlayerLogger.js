const PlayerLog = require('../models/PlayerLog');

/**
 * PlayerLogger - Centralized logging service for all player actions
 * Logs every action with timestamps and player context
 */
class PlayerLogger {
  /**
   * Log a player action
   * @param {Object} params - Log parameters
   * @param {string} params.socketId - Socket ID of the player
   * @param {string} params.action - Action type (e.g., 'map:move', 'auth:login')
   * @param {Object} params.data - Action data
   * @param {string} params.username - Optional username
   * @param {string} params.userId - Optional user ID
   * @param {string} params.roomId - Optional room ID
   */
  async log({ socketId, action, data = {}, username = null, userId = null, roomId = null }) {
    try {
      const logEntry = new PlayerLog({
        socketId,
        action,
        data,
        username,
        userId,
        roomId,
        timestamp: new Date()
      });

      await logEntry.save();

      // Also log to console for real-time monitoring
      const timestamp = new Date().toISOString();
      const userInfo = username ? `[${username}]` : '';
      const roomInfo = roomId ? `(room: ${roomId})` : '';
      console.log(`[PLAYER_ACTION] ${timestamp} ${userInfo}${roomInfo} ${action}:`, JSON.stringify(data));

      return logEntry;
    } catch (error) {
      console.error('Error logging player action:', error);
      // Don't throw - logging failures shouldn't break the app
      return null;
    }
  }

  /**
   * Log a map action (movement, emote, etc.)
   */
  async logMapAction(socketId, action, data, username = null, roomId = null) {
    return this.log({
      socketId,
      action: `map:${action}`,
      data,
      username,
      roomId
    });
  }

  /**
   * Log an authentication action
   */
  async logAuthAction(socketId, action, data, username = null, userId = null) {
    return this.log({
      socketId,
      action: `auth:${action}`,
      data,
      username,
      userId
    });
  }

  /**
   * Log a room action
   */
  async logRoomAction(socketId, action, data, username = null, roomId = null) {
    return this.log({
      socketId,
      action: `room:${action}`,
      data,
      username,
      roomId
    });
  }

  /**
   * Log a user action
   */
  async logUserAction(socketId, action, data, username = null, userId = null) {
    return this.log({
      socketId,
      action: `user:${action}`,
      data,
      username,
      userId
    });
  }

  /**
   * Get logs for a specific player
   */
  async getPlayerLogs(username, limit = 100) {
    try {
      return await PlayerLog.find({ username })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching player logs:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific action type
   */
  async getActionLogs(action, limit = 100) {
    try {
      return await PlayerLog.find({ action })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching action logs:', error);
      return [];
    }
  }

  /**
   * Get logs within a time range
   */
  async getLogsByTimeRange(startDate, endDate, limit = 1000) {
    try {
      return await PlayerLog.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching logs by time range:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific room
   */
  async getRoomLogs(roomId, limit = 100) {
    try {
      return await PlayerLog.find({ roomId })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching room logs:', error);
      return [];
    }
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit = 100) {
    try {
      return await PlayerLog.find({})
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }
  }
}

module.exports = new PlayerLogger();
