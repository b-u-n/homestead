const WishingWellPost = require('../models/WishingWellPost');

// Staff members (for now, hardcoded - can be moved to a database later)
const STAFF_SESSION_IDS = [
  'session_staff_1', // Add actual staff session IDs here
];

const REQUIRED_APPROVALS = 1;

module.exports = (socket, io) => {
  // Get all approved posts
  socket.on('wishingWell:getPosts', async (data, callback) => {
    try {
      const posts = await WishingWellPost.find({
        reviewed: true,
        approved: true
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('content type createdAt')
        .lean();

      callback({
        success: true,
        data: posts
      });
    } catch (error) {
      console.error('Error getting wishing well posts:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Submit a new post
  socket.on('wishingWell:submit', async (data, callback) => {
    try {
      const { sessionId, content, type } = data;

      if (!sessionId || !content || !type) {
        return callback({
          success: false,
          error: 'Missing required fields'
        });
      }

      if (!['positive', 'negative'].includes(type)) {
        return callback({
          success: false,
          error: 'Invalid post type'
        });
      }

      if (content.length > 500) {
        return callback({
          success: false,
          error: 'Content must be 500 characters or less'
        });
      }

      const post = new WishingWellPost({
        content: content.trim(),
        type,
        sessionId,
        reviewed: false,
        reviewedBy: [],
        createdAt: new Date()
      });

      await post.save();

      // Notify staff that there's a new post to review
      io.emit('wishingWell:newPostToReview', {
        postId: post._id,
        type: post.type
      });

      callback({
        success: true,
        message: 'Your post has been submitted for review!'
      });
    } catch (error) {
      console.error('Error submitting wishing well post:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Get unreviewed posts (staff only)
  socket.on('wishingWell:getUnreviewed', async (data, callback) => {
    try {
      const { sessionId } = data;

      // Check if user is staff
      if (!STAFF_SESSION_IDS.includes(sessionId)) {
        return callback({
          success: false,
          error: 'Unauthorized'
        });
      }

      const posts = await WishingWellPost.find({
        reviewed: false
      })
        .sort({ createdAt: 1 }) // Oldest first
        .select('content type createdAt sessionId reviewedBy')
        .lean();

      callback({
        success: true,
        data: posts
      });
    } catch (error) {
      console.error('Error getting unreviewed posts:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Review a post (staff only)
  socket.on('wishingWell:review', async (data, callback) => {
    try {
      const { sessionId, postId, approved } = data;

      // Check if user is staff
      if (!STAFF_SESSION_IDS.includes(sessionId)) {
        return callback({
          success: false,
          error: 'Unauthorized'
        });
      }

      const post = await WishingWellPost.findById(postId);

      if (!post) {
        return callback({
          success: false,
          error: 'Post not found'
        });
      }

      if (post.reviewed) {
        return callback({
          success: false,
          error: 'Post already reviewed'
        });
      }

      // Add reviewer to the list
      if (!post.reviewedBy.includes(sessionId)) {
        post.reviewedBy.push(sessionId);
      }

      // Check if we have enough approvals
      if (post.reviewedBy.length >= REQUIRED_APPROVALS) {
        post.reviewed = true;
        post.approved = approved;
        post.reviewedAt = new Date();

        await post.save();

        // If approved, broadcast to all clients that posts have been updated
        if (approved) {
          io.emit('wishingWell:postsUpdated');
        }

        callback({
          success: true,
          message: `Post ${approved ? 'approved' : 'rejected'}`
        });
      } else {
        await post.save();

        callback({
          success: true,
          message: `Review recorded. Need ${REQUIRED_APPROVALS - post.reviewedBy.length} more approval(s).`
        });
      }
    } catch (error) {
      console.error('Error reviewing post:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });
};
