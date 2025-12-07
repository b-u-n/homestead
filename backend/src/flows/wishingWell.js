const WishingWellPost = require('../models/WishingWellPost');
const Account = require('../models/Account');

/**
 * Build a user object from an Account document
 * See readme/ARCHITECTURE.md for the user object pattern
 */
function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}

/**
 * Wishing Well Flow
 * Handles post creation, viewing, and responses
 */
module.exports = {
  name: 'wishingWell',

  handlers: {
    /**
     * Get posts with filters and sorting
     */
    'wishingWell:posts:get': {
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
          sortObj = { totalTips: 1 };
        } else if (sort === 'value-desc') {
          sortObj = { totalTips: -1 };
        } else if (sort === 'date-asc') {
          sortObj = { createdAt: 1 };
        } else if (sort === 'date-desc') {
          sortObj = { createdAt: -1 };
        }

        const posts = await WishingWellPost.find(query)
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
     * Create a new post (FREE - no hearts required)
     */
    'wishingWell:posts:create': {
      validate: (data) => {
        const { sessionId, content } = data;

        if (!sessionId || !content) {
          return { valid: false, error: 'Missing required fields' };
        }

        if (content.length > 500) {
          return { valid: false, error: 'Content must be 500 characters or less' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, content } = data;

        // Get user account
        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });

        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Create post with user object (FREE - no hearts required)
        const post = new WishingWellPost({
          content: content.trim(),
          user: buildUserObject(account),
          responses: [],
          tips: [],
          totalTips: 0,
          createdAt: new Date()
        });

        await post.save();

        // Broadcast to all clients that a new post is available
        context.io.emit('wishingWell:newPost', {
          postId: post._id
        });

        return {
          success: true,
          message: 'Your wish has been posted!',
          data: post
        };
      }
    },

    /**
     * Add a response to a post
     */
    'wishingWell:posts:addResponse': {
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
        const post = await WishingWellPost.findById(postId);

        if (!post) {
          return { success: false, error: 'Post not found' };
        }

        // Get responder account
        const responder = await Account.findOne({ 'activeSessions.sessionId': sessionId });

        if (!responder) {
          return { success: false, error: 'Account not found' };
        }

        // Check if user is trying to respond to their own post
        if (post.user.id.equals(responder._id)) {
          return { success: false, error: 'You cannot respond to your own post' };
        }

        // Add response with user object
        const response = {
          content: content.trim(),
          user: buildUserObject(responder),
          createdAt: new Date()
        };

        post.responses.push(response);
        await post.save();

        // Broadcast update
        context.io.emit('wishingWell:postUpdated', {
          postId: post._id
        });

        return {
          success: true,
          message: 'Response added!',
          data: { post }
        };
      }
    },

    /**
     * Tip hearts to a post
     * Hearts go directly to the post author
     */
    'wishingWell:posts:tip': {
      validate: (data) => {
        const { sessionId, postId, amount, source } = data;

        if (!sessionId || !postId) {
          return { valid: false, error: 'Missing required fields' };
        }

        if (typeof amount !== 'number' || amount < 1) {
          return { valid: false, error: 'Amount must be at least 1' };
        }

        if (source !== 'active' && source !== 'bank') {
          return { valid: false, error: 'Source must be "active" or "bank"' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, postId, amount, source } = data;

        // Get post
        const post = await WishingWellPost.findById(postId);

        if (!post) {
          return { success: false, error: 'Post not found' };
        }

        // Get tipper account
        const tipper = await Account.findOne({ 'activeSessions.sessionId': sessionId });

        if (!tipper) {
          return { success: false, error: 'Account not found' };
        }

        // Check if user is trying to tip their own post
        if (post.user.id.equals(tipper._id)) {
          return { success: false, error: 'You cannot tip your own post' };
        }

        // Check if user has enough hearts in the selected source
        if (source === 'active') {
          if (tipper.hearts < amount) {
            return {
              success: false,
              error: `Not enough active hearts. You have ${tipper.hearts}, trying to tip ${amount}`
            };
          }
          tipper.hearts -= amount;
        } else { // source === 'bank'
          if (tipper.heartBank < amount) {
            return {
              success: false,
              error: `Not enough hearts in bank. Bank has ${tipper.heartBank}, trying to tip ${amount}`
            };
          }
          tipper.heartBank -= amount;
        }

        // Get author account by user.id
        const author = await Account.findById(post.user.id);

        if (!author) {
          return { success: false, error: 'Post author not found' };
        }

        // Award hearts to author
        // Calculate how many can go to active hearts (max 9)
        const heartsToActive = Math.min(amount, 9 - author.hearts);
        const heartsToBank = amount - heartsToActive;

        author.hearts += heartsToActive;
        author.heartBank += heartsToBank;

        // Save accounts
        await tipper.save();
        await author.save();

        // Add tip to post with user object
        const tip = {
          amount,
          user: buildUserObject(tipper),
          createdAt: new Date()
        };

        post.tips.push(tip);
        post.totalTips += amount;
        await post.save();

        // Broadcast update
        context.io.emit('wishingWell:postUpdated', {
          postId: post._id
        });

        return {
          success: true,
          message: `Tipped ${amount} hearts to ${post.user.name}!`,
          data: {
            post,
            tipperBalance: {
              hearts: tipper.hearts,
              heartBank: tipper.heartBank
            }
          }
        };
      }
    }
  }
};
