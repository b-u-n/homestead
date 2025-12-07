const weepingWillowFlow = require('./weepingWillow');
const WeepingWillowPost = require('../models/WeepingWillowPost');
const Account = require('../models/Account');
const { createAccount } = require('../tests/fixtures/accounts');
const { createMockContext } = require('../tests/utils/context');

describe('Weeping Willow Flow', () => {
  let context;

  beforeEach(() => {
    context = createMockContext();
  });

  describe('weepingWillow:posts:create', () => {
    const handler = weepingWillowFlow.handlers['weepingWillow:posts:create'];

    it('should validate required fields', () => {
      expect(handler.validate({})).toEqual({
        valid: false,
        error: 'Missing required fields'
      });

      expect(handler.validate({ sessionId: '123' })).toEqual({
        valid: false,
        error: 'Missing required fields'
      });

      expect(handler.validate({ sessionId: '123', content: 'test' })).toEqual({
        valid: false,
        error: 'Must offer at least 1 heart'
      });
    });

    it('should reject content over 500 characters', () => {
      const result = handler.validate({
        sessionId: '123',
        content: 'x'.repeat(501),
        hearts: 1
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('500 characters');
    });

    it('should accept valid input', () => {
      const result = handler.validate({
        sessionId: '123',
        content: 'I need help with something',
        hearts: 3
      });
      expect(result.valid).toBe(true);
    });

    it('should create a post and deduct hearts', async () => {
      const { account, sessionId } = await createAccount({ hearts: 5 });

      const result = await handler.handler({
        sessionId,
        content: 'Need help with testing',
        hearts: 3
      }, context);

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Need help with testing');
      expect(result.data.hearts).toBe(3);
      expect(result.data.authorId.toString()).toBe(account._id.toString());

      // Verify hearts were deducted
      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.hearts).toBe(2); // 5 - 3 = 2
    });

    it('should fail if insufficient hearts', async () => {
      const { sessionId } = await createAccount({ hearts: 2 });

      const result = await handler.handler({
        sessionId,
        content: 'Test',
        hearts: 5
      }, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not enough hearts');
    });

    it('should broadcast newPost event', async () => {
      const { sessionId } = await createAccount({ hearts: 5 });

      await handler.handler({
        sessionId,
        content: 'Test post',
        hearts: 1
      }, context);

      expect(context.io.emit).toHaveBeenCalledWith(
        'weepingWillow:newPost',
        expect.objectContaining({ postId: expect.anything() })
      );
    });

    it('should return error for non-existent account', async () => {
      const result = await handler.handler({
        sessionId: 'non-existent-session',
        content: 'Test',
        hearts: 1
      }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account not found');
    });
  });

  describe('weepingWillow:posts:get', () => {
    const handler = weepingWillowFlow.handlers['weepingWillow:posts:get'];

    it('should return empty array when no posts', async () => {
      const result = await handler.handler({}, context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return posts sorted by newest first by default', async () => {
      const { sessionId } = await createAccount({ hearts: 9 });
      const createHandler = weepingWillowFlow.handlers['weepingWillow:posts:create'];

      // Create posts with slight delay
      await createHandler.handler({ sessionId, content: 'First post', hearts: 1 }, context);
      await new Promise(r => setTimeout(r, 10));
      await createHandler.handler({ sessionId, content: 'Second post', hearts: 2 }, context);

      const result = await handler.handler({}, context);

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].content).toBe('Second post'); // Newest first
      expect(result.data[1].content).toBe('First post');
    });

    it('should filter unresponded posts', async () => {
      const { sessionId: authorId } = await createAccount({ hearts: 9 });
      const { sessionId: responderId } = await createAccount({ hearts: 5 });
      const createHandler = weepingWillowFlow.handlers['weepingWillow:posts:create'];
      const responseHandler = weepingWillowFlow.handlers['weepingWillow:posts:addResponse'];

      // Create two posts
      const post1 = await createHandler.handler({ sessionId: authorId, content: 'Post 1', hearts: 1 }, context);
      await createHandler.handler({ sessionId: authorId, content: 'Post 2', hearts: 1 }, context);

      // Add response to first post
      await responseHandler.handler({
        sessionId: responderId,
        postId: post1.data._id.toString(),
        content: 'Response'
      }, context);

      // Filter for unresponded
      const result = await handler.handler({ filter: 'unresponded' }, context);

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].content).toBe('Post 2');
    });

    it('should sort by hearts descending', async () => {
      const { sessionId } = await createAccount({ hearts: 9 });
      const createHandler = weepingWillowFlow.handlers['weepingWillow:posts:create'];

      await createHandler.handler({ sessionId, content: 'Low bounty', hearts: 1 }, context);
      await createHandler.handler({ sessionId, content: 'High bounty', hearts: 5 }, context);

      const result = await handler.handler({ sort: 'value-desc' }, context);

      expect(result.success).toBe(true);
      expect(result.data[0].content).toBe('High bounty');
      expect(result.data[1].content).toBe('Low bounty');
    });
  });

  describe('weepingWillow:posts:addResponse', () => {
    const handler = weepingWillowFlow.handlers['weepingWillow:posts:addResponse'];
    const createHandler = weepingWillowFlow.handlers['weepingWillow:posts:create'];

    it('should validate required fields', () => {
      expect(handler.validate({})).toEqual({
        valid: false,
        error: 'Missing required fields'
      });
    });

    it('should add response and award hearts to first responder', async () => {
      const { account: authorAccount, sessionId: authorId } = await createAccount({ hearts: 5 });
      const { account: responderAccount, sessionId: responderId } = await createAccount({ hearts: 2 });

      // Author creates a post with 3 heart bounty
      const post = await createHandler.handler({
        sessionId: authorId,
        content: 'Need help',
        hearts: 3
      }, context);

      // Responder responds
      const result = await handler.handler({
        sessionId: responderId,
        postId: post.data._id.toString(),
        content: 'Here is my help'
      }, context);

      expect(result.success).toBe(true);
      expect(result.data.heartsAwarded).toBe(3);

      // Check responder got hearts
      const updatedResponder = await Account.findById(responderAccount._id);
      expect(updatedResponder.hearts).toBe(5); // 2 + 3 = 5
    });

    it('should overflow hearts to bank when exceeding 9', async () => {
      const { sessionId: authorId } = await createAccount({ hearts: 9 });
      const { account: responderAccount, sessionId: responderId } = await createAccount({ hearts: 7 });

      // Author creates a post with 5 heart bounty
      const post = await createHandler.handler({
        sessionId: authorId,
        content: 'Big bounty post',
        hearts: 5
      }, context);

      // Responder (who has 7 hearts) responds
      await handler.handler({
        sessionId: responderId,
        postId: post.data._id.toString(),
        content: 'Response'
      }, context);

      // Responder should have max 9 active, rest in bank
      const updatedResponder = await Account.findById(responderAccount._id);
      expect(updatedResponder.hearts).toBe(9); // Capped at 9
      expect(updatedResponder.heartBank).toBe(3); // 7 + 5 = 12, overflow: 12 - 9 = 3
    });

    it('should not award hearts to second responder', async () => {
      const { sessionId: authorId } = await createAccount({ hearts: 5 });
      const { account: firstResponder, sessionId: firstResponderId } = await createAccount({ hearts: 2 });
      const { account: secondResponder, sessionId: secondResponderId } = await createAccount({ hearts: 2 });

      const post = await createHandler.handler({
        sessionId: authorId,
        content: 'Help wanted',
        hearts: 3
      }, context);

      // First response
      await handler.handler({
        sessionId: firstResponderId,
        postId: post.data._id.toString(),
        content: 'First!'
      }, context);

      // Second response
      const result = await handler.handler({
        sessionId: secondResponderId,
        postId: post.data._id.toString(),
        content: 'Second!'
      }, context);

      expect(result.success).toBe(true);
      expect(result.data.heartsAwarded).toBe(0);

      // Second responder should not have gained hearts
      const updatedSecond = await Account.findById(secondResponder._id);
      expect(updatedSecond.hearts).toBe(2);
    });

    it('should prevent responding to own post', async () => {
      const { sessionId: authorId } = await createAccount({ hearts: 5 });

      const post = await createHandler.handler({
        sessionId: authorId,
        content: 'My post',
        hearts: 1
      }, context);

      const result = await handler.handler({
        sessionId: authorId,
        postId: post.data._id.toString(),
        content: 'Trying to respond to myself'
      }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot respond to your own post');
    });

    it('should broadcast postUpdated event', async () => {
      const { sessionId: authorId } = await createAccount({ hearts: 5 });
      const { sessionId: responderId } = await createAccount({ hearts: 2 });

      const post = await createHandler.handler({
        sessionId: authorId,
        content: 'Post',
        hearts: 1
      }, context);

      jest.clearAllMocks();

      await handler.handler({
        sessionId: responderId,
        postId: post.data._id.toString(),
        content: 'Response'
      }, context);

      expect(context.io.emit).toHaveBeenCalledWith(
        'weepingWillow:postUpdated',
        expect.objectContaining({ postId: expect.anything() })
      );
    });
  });
});
