const express = require('express');
const router = express.Router();
const PlayerLogger = require('../services/PlayerLogger');
const PlayerLog = require('../models/PlayerLog');

// Get recent logs
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await PlayerLogger.getRecentLogs(limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get logs by player/username
router.get('/player/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await PlayerLogger.getPlayerLogs(username, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      username
    });
  } catch (error) {
    console.error('Error fetching player logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get logs by action type
router.get('/action/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await PlayerLogger.getActionLogs(action, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      action
    });
  } catch (error) {
    console.error('Error fetching action logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get logs by room
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await PlayerLogger.getRoomLogs(roomId, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      roomId
    });
  } catch (error) {
    console.error('Error fetching room logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get logs by time range
router.get('/timerange', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const limit = parseInt(req.query.limit) || 1000;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)'
      });
    }

    const logs = await PlayerLogger.getLogsByTimeRange(start, end, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
  } catch (error) {
    console.error('Error fetching logs by time range:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get log statistics
router.get('/stats', async (req, res) => {
  try {
    // Get counts by action type
    const actionStats = await PlayerLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get counts by user
    const userStats = await PlayerLog.aggregate([
      {
        $match: { username: { $ne: null } }
      },
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get total log count
    const totalLogs = await PlayerLog.countDocuments();

    // Get logs from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logsLast24Hours = await PlayerLog.countDocuments({
      timestamp: { $gte: last24Hours }
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        logsLast24Hours,
        actionStats,
        topUsers: userStats
      }
    });
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Advanced search with multiple filters
router.post('/search', async (req, res) => {
  try {
    const {
      username,
      action,
      roomId,
      socketId,
      startDate,
      endDate,
      limit = 100
    } = req.body;

    const query = {};

    if (username) query.username = username;
    if (action) query.action = action;
    if (roomId) query.roomId = roomId;
    if (socketId) query.socketId = socketId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await PlayerLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      query
    });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
