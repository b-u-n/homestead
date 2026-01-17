const express = require('express');
const router = express.Router();
const ReportIssue = require('../models/ReportIssue');
const Account = require('../models/Account');
const { isSupport } = require('../middleware/permissions');
const { createNotification } = require('../flows/notifications');

// Store io instance for notifications
let ioInstance = null;
router.setIo = (io) => { ioInstance = io; };

// Status display names for notifications
const STATUS_DISPLAY = {
  reported: 'Reported',
  under_investigation: 'Under Investigation',
  assigned: 'Assigned',
  resolved: 'Resolved'
};

// Middleware to authenticate by session ID (from header or body)
const authenticateSession = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.body?.sessionId;

  if (!sessionId) {
    return res.status(401).json({ success: false, error: 'Session ID required' });
  }

  const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });
  if (!account) {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }

  req.account = account;
  req.sessionId = sessionId;
  next();
};

// Middleware to require support permission
const requireSupport = (req, res, next) => {
  if (!isSupport(req.account)) {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  next();
};

// POST /api/report-issues - Create a new issue report (authenticated users)
router.post('/', authenticateSession, async (req, res) => {
  try {
    const { text, metadata } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Issue description is required'
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Issue description must be 2000 characters or less'
      });
    }

    const reportIssue = new ReportIssue({
      text: text.trim(),
      metadata: {
        accountId: req.account._id,
        sessionId: req.sessionId,
        username: req.account.userData?.username,
        email: req.account.email,
        userAgent: metadata?.consentGiven ? metadata.userAgent : undefined,
        platform: metadata?.consentGiven ? metadata.platform : undefined,
        screenSize: metadata?.consentGiven ? metadata.screenSize : undefined,
        currentRoute: metadata?.consentGiven ? metadata.currentRoute : undefined,
        appVersion: metadata?.consentGiven ? metadata.appVersion : undefined,
        consentGiven: metadata?.consentGiven || false
      }
    });

    await reportIssue.save();

    res.status(201).json({
      success: true,
      data: {
        id: reportIssue._id,
        text: reportIssue.text,
        status: reportIssue.status,
        createdAt: reportIssue.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating issue report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create issue report'
    });
  }
});

// GET /api/report-issues/mine - Get user's own reports
router.get('/mine', authenticateSession, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const reports = await ReportIssue.find({ 'metadata.accountId': req.account._id })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-internalNotes') // Hide internal notes from user
      .populate('comments.author', 'userData.username')
      .lean();

    const total = await ReportIssue.countDocuments({ 'metadata.accountId': req.account._id });

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// GET /api/report-issues - List all issue reports (support+ only)
router.get('/', authenticateSession, requireSupport, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const reportIssues = await ReportIssue.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('assignedTo', 'userData.username')
      .populate('comments.author', 'userData.username')
      .populate('internalNotes.author', 'userData.username')
      .lean();

    const total = await ReportIssue.countDocuments(query);

    res.json({
      success: true,
      data: reportIssues,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching issue reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issue reports'
    });
  }
});

// GET /api/report-issues/:id - Get single issue report (owner or support+)
router.get('/:id', authenticateSession, async (req, res) => {
  try {
    const reportIssue = await ReportIssue.findById(req.params.id)
      .populate('assignedTo', 'userData.username')
      .populate('comments.author', 'userData.username')
      .populate('internalNotes.author', 'userData.username')
      .lean();

    if (!reportIssue) {
      return res.status(404).json({
        success: false,
        error: 'Issue report not found'
      });
    }

    // Check access: owner or support+
    const isOwner = reportIssue.metadata.accountId.toString() === req.account._id.toString();
    const hasStaffAccess = isSupport(req.account);

    if (!isOwner && !hasStaffAccess) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    // Hide internal notes from non-staff
    if (!hasStaffAccess) {
      delete reportIssue.internalNotes;
    }

    res.json({
      success: true,
      data: reportIssue
    });

  } catch (error) {
    console.error('Error fetching issue report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issue report'
    });
  }
});

// POST /api/report-issues/:id/comments - Add comment (owner or support+)
router.post('/:id/comments', authenticateSession, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be 2000 characters or less'
      });
    }

    const reportIssue = await ReportIssue.findById(req.params.id);
    if (!reportIssue) {
      return res.status(404).json({
        success: false,
        error: 'Issue report not found'
      });
    }

    // Check access: owner or support+
    const isOwner = reportIssue.metadata.accountId.toString() === req.account._id.toString();
    const hasStaffAccess = isSupport(req.account);

    if (!isOwner && !hasStaffAccess) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    const authorType = hasStaffAccess && !isOwner ? 'staff' : 'user';

    // Add comment
    reportIssue.comments.push({
      content: content.trim(),
      author: req.account._id,
      authorType,
      createdAt: new Date()
    });

    await reportIssue.save();

    // Send notification to the other party
    if (ioInstance) {
      const authorName = req.account.userData?.username || 'Someone';

      if (authorType === 'staff') {
        // Staff commented, notify user
        await createNotification(ioInstance, {
          recipientId: reportIssue.metadata.accountId,
          type: 'reportIssue:comment',
          message: `New reply on your issue report`,
          navigation: {
            flow: 'reportIssue',
            dropId: 'reportIssue:view',
            params: { reportId: reportIssue._id.toString() }
          },
          actor: {
            accountId: req.account._id,
            name: authorName,
            avatar: req.account.userData?.avatar
          }
        });
      }
      // Note: If user comments, we could notify assigned staff here if needed
    }

    // Fetch updated document
    const updated = await ReportIssue.findById(req.params.id)
      .populate('comments.author', 'userData.username')
      .select(hasStaffAccess ? '' : '-internalNotes')
      .lean();

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// PATCH /api/report-issues/:id - Update issue report (support+ only)
router.patch('/:id', authenticateSession, requireSupport, async (req, res) => {
  try {
    const { status, assignedTo, internalNote } = req.body;

    const reportIssue = await ReportIssue.findById(req.params.id);
    if (!reportIssue) {
      return res.status(404).json({
        success: false,
        error: 'Issue report not found'
      });
    }

    const previousStatus = reportIssue.status;

    // Update status if provided
    if (status) {
      const validStatuses = ['reported', 'under_investigation', 'assigned', 'resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }
      reportIssue.status = status;
    }

    // Update assigned staff if provided
    if (assignedTo !== undefined) {
      reportIssue.assignedTo = assignedTo || null;
    }

    // Add internal note if provided
    if (internalNote && internalNote.trim().length > 0) {
      reportIssue.internalNotes.push({
        content: internalNote.trim(),
        author: req.account._id,
        createdAt: new Date()
      });
    }

    await reportIssue.save();

    // Send notification if status changed
    if (status && status !== previousStatus && ioInstance) {
      const statusDisplay = STATUS_DISPLAY[status] || status;
      await createNotification(ioInstance, {
        recipientId: reportIssue.metadata.accountId,
        type: 'reportIssue:statusChanged',
        message: `Your issue report status: ${statusDisplay}`,
        navigation: {
          flow: 'reportIssue',
          dropId: 'reportIssue:view',
          params: { reportId: reportIssue._id.toString() }
        },
        actor: {
          accountId: req.account._id,
          name: req.account.userData?.username || 'Support',
          avatar: req.account.userData?.avatar
        }
      });
    }

    // Fetch updated document with populated fields
    const updated = await ReportIssue.findById(req.params.id)
      .populate('assignedTo', 'userData.username')
      .populate('comments.author', 'userData.username')
      .populate('internalNotes.author', 'userData.username')
      .lean();

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error updating issue report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update issue report'
    });
  }
});

module.exports = router;
