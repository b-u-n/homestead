const WeepingWillowPost = require('../models/WeepingWillowPost');
const Account = require('../models/Account');

/**
 * Weeping Willow "Help Wanted" Flow
 * Handles post creation, viewing, and responses
 */
module.exports = {
  name: 'weepingWillow',

  handlers: {
    /**
     * Get posts with filters and sorting
     */
    'weepingWillow:posts:get': {
      validate: (data) => {
        // Optional filters: 'new', 'unresponded', 'popular'
        // Optional sort: 'value-asc', 'value-desc', 'date-asc', 'date-desc'
        return { valid: true };
      },

      handler: async (data, context) => {
        const { filter, sort } = data;

        // Build query
        let query = {};

        if (filter === 'unresponded') {
          query['responses.0'] = { $exists: false }; // No responses
        } else if (filter === 'new') {
          // Posts created in last 7 days
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query.createdAt = { $gte: weekAgo };
        }
        // 'popular' doesn't need a query filter, just sort by hearts

        // Build sort
        let sortObj = { createdAt: -1 }; // Default: newest first

        if (sort === 'value-asc') {
          sortObj = { hearts: 1 };
        } else if (sort === 'value-desc') {
          sortObj = { hearts: -1 };
        } else if (sort === 'date-asc') {
          sortObj = { createdAt: 1 };
        } else if (sort === 'date-desc') {
          sortObj = { createdAt: -1 };
        }

        const posts = await WeepingWillowPost.find(query)
          .sort(sortObj)
          .limit(50)
          .lean();

        return {
          success: true,
          data: posts
        };
      }
    },

    /**
     * Create a new post with heart bounty
     */
    'weepingWillow:posts:create': {
      validate: (data) => {
        const { sessionId, content, hearts } = data;

        if (!sessionId || !content) {
          return { valid: false, error: 'Missing required fields' };
        }

        if (content.length > 500) {
          return { valid: false, error: 'Content must be 500 characters or less' };
        }

        if (typeof hearts !== 'number' || hearts < 1) {
          return { valid: false, error: 'Must offer at least 1 heart' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, content, hearts } = data;

        // Get user account
        const account = await Account.findOne({ sessionId });

        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Check if user has enough hearts
        if (account.hearts < hearts) {
          return {
            success: false,
            error: `Not enough hearts. You have ${account.hearts}, need ${hearts}`
          };
        }

        // Deduct hearts from account
        account.hearts -= hearts;
        await account.save();

        // Create post
        const post = new WeepingWillowPost({
          content: content.trim(),
          hearts,
          authorSessionId: sessionId,
          authorName: account.userData?.username || 'Anonymous',
          authorAvatar: account.userData?.avatar || null,
          responses: [],
          createdAt: new Date()
        });

        await post.save();

        // Broadcast to all clients that a new post is available
        context.io.emit('weepingWillow:newPost', {
          postId: post._id
        });

        return {
          success: true,
          message: 'Your request has been posted!',
          data: post
        };
      }
    },

    /**
     * Add a response to a post
     * First responder gets the hearts bounty
     */
    'weepingWillow:posts:addResponse': {
      validate: (data) => {
        const { sessionId, postId, content } = data;

        if (!sessionId || !postId || !content) {
          return { valid: false, error: 'Missing required fields' };
        }

        if (content.length > 500) {
          return { valid: false, error: 'Response must be 500 characters or less' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, postId, content } = data;

        // Get post
        const post = await WeepingWillowPost.findById(postId);

        if (!post) {
          return { success: false, error: 'Post not found' };
        }

        // Get responder account
        const responder = await Account.findOne({ sessionId });

        if (!responder) {
          return { success: false, error: 'Account not found' };
        }

        // Check if user is trying to respond to their own post
        if (post.authorSessionId === sessionId) {
          return { success: false, error: 'You cannot respond to your own post' };
        }

        // Add response
        const response = {
          content: content.trim(),
          responderSessionId: sessionId,
          responderName: responder.userData?.username || 'Anonymous',
          responderAvatar: responder.userData?.avatar || null,
          createdAt: new Date()
        };

        post.responses.push(response);

        // If this is the first response, award hearts
        let heartsAwarded = 0;
        if (!post.firstResponderSessionId) {
          post.firstResponderSessionId = sessionId;

          // Award hearts to responder
          heartsAwarded = post.hearts;

          // Calculate how many can go to active hearts (max 9)
          const heartsToActive = Math.min(heartsAwarded, 9 - responder.hearts);
          const heartsToBank = heartsAwarded - heartsToActive;

          responder.hearts += heartsToActive;
          responder.heartBank += heartsToBank;
          await responder.save();
        }

        await post.save();

        // Broadcast update
        context.io.emit('weepingWillow:postUpdated', {
          postId: post._id
        });

        return {
          success: true,
          message: heartsAwarded > 0
            ? `Response added! You earned ${heartsAwarded} hearts!`
            : 'Response added!',
          data: {
            post,
            heartsAwarded
          }
        };
      }
    }
  }
};
