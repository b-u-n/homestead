const PixelBoard = require('../models/PixelBoard');
const PixelPalsPlayer = require('../models/PixelPalsPlayer');
const Account = require('../models/Account');
const ShopItem = require('../models/ShopItem');
const ModerationQueue = require('../models/ModerationQueue');
const { hasFeature } = require('../utils/featureAccess');
const { savePixelArtPNG } = require('../services/pixelImageService');
const { createNotification } = require('./notifications');

function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}

const BOARD_SIZES = {
  '16x16': { width: 16, height: 16, featureId: 'pixelPals:size:16x16' },
  '32x32': { width: 32, height: 32, featureId: 'pixelPals:size:32x32' },
  '48x48': { width: 48, height: 48, featureId: 'pixelPals:size:48x48' },
};

// Drop interval durations in milliseconds
const DROP_INTERVALS = {
  'hourly': 60 * 60 * 1000,
  'daily': 24 * 60 * 60 * 1000,
  'weekly': 7 * 24 * 60 * 60 * 1000,
};

/**
 * Complete a board: generate PNG, create ShopItem, notify contributors.
 * Called automatically when every pixel is filled.
 */
async function completeBoard(board, account, context) {
  let imageUrl = null;
  try {
    imageUrl = await savePixelArtPNG(
      board.pixels,
      board.width,
      board.height,
      account._id.toString()
    );
  } catch (err) {
    console.error('Failed to generate PNG for board:', err);
  }

  board.status = 'completed';
  board.imageUrl = imageUrl;
  await board.save();

  // Create ShopItem for the completed board
  const participantIds = board.contributorStats.map(s => s.userId);

  const shopItem = new ShopItem({
    title: board.title,
    description: `Collaborative pixel art (${board.width}x${board.height}) by ${participantIds.length} contributor${participantIds.length !== 1 ? 's' : ''}`,
    storeType: 'sketch',
    mediaType: 'image',
    user: buildUserObject(account),
    revisions: [{
      contentUrl: imageUrl,
      note: 'Completed game board',
      status: 'pending'
    }],
    shopStatus: 'not-listed',
    sourceBoard: board._id,
    participantIds,
    copyright: {
      ipConfirmed: true,
      confirmedAt: new Date()
    }
  });
  await shopItem.save();

  const queueEntry = new ModerationQueue({
    contentType: 'bazaar-revision',
    itemType: 'sketch',
    contentId: shopItem._id,
    revisionIndex: 0,
    status: 'pending'
  });
  await queueEntry.save();

  // Notify contributors
  for (const stat of board.contributorStats) {
    if (stat.userId.toString() !== account._id.toString()) {
      try {
        await createNotification({
          recipientId: stat.userId,
          type: 'boardCompleted',
          message: `"${board.title}" is complete and submitted to the shop!`,
          navigation: {
            flow: 'mapSpritesStall',
            dropId: 'mapSpritesStall:itemDetail',
            params: { itemId: shopItem._id.toString() }
          },
          actor: {
            accountId: account._id,
            name: account.userData?.username || 'Anonymous',
            avatar: account.userData?.avatar || null
          }
        }, context.io);
      } catch (err) {
        console.error('Failed to notify contributor:', err);
      }
    }
  }

  context.io.emit('pixelPals:board:completed', { boardId: board._id });
  context.io.emit('moderation:queueUpdated', { contentType: 'bazaar-revision' });

  return shopItem;
}

module.exports = {
  name: 'pixelPals',

  handlers: {
    /**
     * List active boards
     */
    'pixelPals:boards:list': {
      validate: () => ({ valid: true }),

      handler: async (data, context) => {
        const { filter, sessionId, limit: maxResults } = data;

        // Get current user's account ID for personal board filtering
        let currentAccountId = null;
        if (sessionId) {
          const account = await Account.findOne({
            'activeSessions.sessionId': sessionId
          });
          if (account) currentAccountId = account._id.toString();
        }

        let query = { status: 'active' };
        if (filter === 'personal') query.boardType = 'personal';
        if (filter === 'shared') query.boardType = 'shared';
        if (filter === 'chain') query.gameMode = 'chain';
        if (filter === 'daily-drop') query.gameMode = 'daily-drop';
        if (filter === 'live-canvas') query.gameMode = 'live-canvas';

        const boards = await PixelBoard.find(query)
          .sort({ updatedAt: -1 })
          .limit(maxResults || 50)
          .lean();

        // Filter out other people's personal boards
        const visibleBoards = boards.filter(board => {
          if (board.boardType === 'personal') {
            return currentAccountId && board.creator?.id?.toString() === currentAccountId;
          }
          return true;
        });

        const summaries = visibleBoards.map(board => {
          const totalPixels = board.width * board.height;
          const filledPixels = (board.pixels || []).filter(p => p !== null).length;
          return {
            _id: board._id,
            title: board.title,
            width: board.width,
            height: board.height,
            boardType: board.boardType,
            gameMode: board.gameMode,
            pixelsPerTurn: board.pixelsPerTurn,
            creator: board.creator,
            contributorCount: (board.contributorStats || []).length,
            fillPercent: Math.round((filledPixels / totalPixels) * 100),
            status: board.status,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            pixels: board.pixels
          };
        });

        return { success: true, data: summaries };
      }
    },

    /**
     * Get a single board with full pixel data
     */
    'pixelPals:board:get': {
      validate: (data) => {
        if (!data.boardId) return { valid: false, error: 'boardId is required' };
        return { valid: true };
      },

      handler: async (data, context) => {
        const board = await PixelBoard.findById(data.boardId).lean();
        if (!board) return { success: false, error: 'Board not found' };
        return { success: true, data: board };
      }
    },

    /**
     * Create a new board
     */
    'pixelPals:board:create': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'sessionId is required' };
        if (!data.title || !data.title.trim()) return { valid: false, error: 'title is required' };
        if (data.title.length > 60) return { valid: false, error: 'title too long (max 60)' };
        if (data.pixelsPerTurn !== undefined) {
          if (data.pixelsPerTurn < 1) {
            return { valid: false, error: 'pixelsPerTurn must be at least 1' };
          }
        }
        if (data.gameMode && !['chain', 'daily-drop', 'live-canvas', 'free'].includes(data.gameMode)) {
          return { valid: false, error: 'Invalid game mode' };
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, title, size, boardType, pixelsPerTurn, gameMode,
                dropInterval, liveCooldownSeconds, customWidth, customHeight } = data;

        const account = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!account) return { success: false, error: 'Account not found' };

        let width, height;
        if (size === 'custom') {
          if (!hasFeature(account, 'pixelPals:size:custom')) {
            return { success: false, error: 'Custom board sizes not available' };
          }
          width = Math.min(Math.max(customWidth || 32, 8), 64);
          height = Math.min(Math.max(customHeight || 32, 8), 64);
        } else {
          const sizeConfig = BOARD_SIZES[size || '32x32'];
          if (!sizeConfig) return { success: false, error: 'Invalid board size' };
          if (!hasFeature(account, sizeConfig.featureId)) {
            return { success: false, error: 'Board size not available' };
          }
          width = sizeConfig.width;
          height = sizeConfig.height;
        }

        const pixels = new Array(width * height).fill(null);

        const board = new PixelBoard({
          title: title.trim(),
          width,
          height,
          pixels,
          boardType: boardType || 'shared',
          pixelsPerTurn: pixelsPerTurn || 8,
          gameMode: gameMode || 'daily-drop',
          dropInterval: dropInterval || 'daily',
          liveCooldownSeconds: liveCooldownSeconds || 180,
          creator: buildUserObject(account)
        });

        await board.save();

        // Set initial budget for the creator
        let player = await PixelPalsPlayer.findOne({ accountId: account._id });
        if (!player) {
          player = new PixelPalsPlayer({ accountId: account._id });
        }
        const boardState = player.getBoardState(board._id);
        boardState.pixelsRemaining = board.gameMode === 'free' ? 99999999 : board.pixelsPerTurn;
        boardState.lastBudgetRefresh = new Date();
        await player.save();

        context.io.emit('pixelPals:board:created', {
          boardId: board._id,
          title: board.title,
          creator: board.creator,
          boardType: board.boardType,
          gameMode: board.gameMode,
          width: board.width,
          height: board.height
        });

        return { success: true, data: board };
      }
    },

    /**
     * Draw pixels on a board
     * Game mode determines eligibility rules.
     * Supports isUndo flag to revert without budget cost.
     */
    'pixelPals:board:draw': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'sessionId is required' };
        if (!data.boardId) return { valid: false, error: 'boardId is required' };
        if (!Array.isArray(data.pixels) || data.pixels.length === 0) {
          return { valid: false, error: 'pixels array is required and must not be empty' };
        }
        for (const p of data.pixels) {
          if (typeof p.x !== 'number' || typeof p.y !== 'number') {
            return { valid: false, error: 'Each pixel must have x and y' };
          }
          // color can be null for eraser/undo
        }
        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, boardId, pixels, isUndo } = data;

        const account = await Account.findOne({
          'activeSessions.sessionId': sessionId
        });
        if (!account) return { success: false, error: 'Account not found' };

        const board = await PixelBoard.findById(boardId);
        if (!board) return { success: false, error: 'Board not found' };
        if (board.status !== 'active') return { success: false, error: 'Board is no longer active' };

        const accountId = account._id.toString();
        const creatorId = board.creator.id.toString();
        const isOwnBoard = accountId === creatorId;

        // Personal boards: only creator can draw
        if (board.boardType === 'personal' && !isOwnBoard) {
          return { success: false, error: 'Only the creator can draw on personal boards' };
        }

        // Validate coordinates
        for (const p of pixels) {
          if (p.x < 0 || p.x >= board.width || p.y < 0 || p.y >= board.height) {
            return { success: false, error: `Pixel (${p.x}, ${p.y}) is out of bounds` };
          }
        }

        // Get or create player state
        let player = await PixelPalsPlayer.findOne({ accountId: account._id });
        if (!player) {
          player = new PixelPalsPlayer({ accountId: account._id });
        }

        const boardState = player.getBoardState(board._id);
        const now = new Date();

        const isFreeMode = board.gameMode === 'free';

        // Undo or free mode: skip all budget/eligibility checks
        if (!isUndo && !isFreeMode) {
          // === MODE-SPECIFIC ELIGIBILITY ===
          switch (board.gameMode) {
            case 'chain': {
              // Only the current player in the chain can draw
              if (board.chainOrder.length > 0) {
                const currentPlayer = board.chainOrder[board.currentChainIndex];
                if (currentPlayer && currentPlayer.userId.toString() !== accountId) {
                  const currentName = currentPlayer.name || 'someone';
                  return { success: false, error: `Waiting for ${currentName} to draw` };
                }
              }
              // New player joins chain
              if (!board.chainOrder.find(c => c.userId.toString() === accountId)) {
                board.chainOrder.push({
                  userId: account._id,
                  name: account.userData?.username || 'Anonymous'
                });
              }
              // Initialize budget for this turn
              if (boardState.pixelsRemaining <= 0) {
                boardState.pixelsRemaining = board.pixelsPerTurn;
                boardState.touchedPixels = [];
              }
              break;
            }

            case 'daily-drop': {
              const intervalMs = DROP_INTERVALS[board.dropInterval] || DROP_INTERVALS.daily;
              const elapsed = boardState.lastBudgetRefresh
                ? now.getTime() - new Date(boardState.lastBudgetRefresh).getTime()
                : Infinity;

              if (elapsed >= intervalMs || !boardState.lastBudgetRefresh) {
                boardState.pixelsRemaining = board.pixelsPerTurn;
                boardState.lastBudgetRefresh = now;
                boardState.touchedPixels = [];
              }

              if (boardState.pixelsRemaining <= 0) {
                const nextRefresh = new Date(new Date(boardState.lastBudgetRefresh).getTime() + intervalMs);
                return {
                  success: false,
                  error: `No pixels left. Refreshes at ${nextRefresh.toISOString()}`
                };
              }
              break;
            }

            case 'live-canvas': {
              // Only check cooldown when budget is exhausted
              if (boardState.pixelsRemaining <= 0) {
                const cooldownMs = (board.liveCooldownSeconds || 180) * 1000;
                const lastDraw = boardState.lastDrawTime
                  ? new Date(boardState.lastDrawTime).getTime()
                  : 0;
                const elapsed = now.getTime() - lastDraw;

                if (elapsed < cooldownMs) {
                  const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
                  return {
                    success: false,
                    error: `Cooldown: wait ${remaining} seconds`
                  };
                }
                // Cooldown passed — refill budget
                boardState.pixelsRemaining = board.pixelsPerTurn;
                boardState.touchedPixels = [];
              }
              break;
            }
          }

        }

        // Deduplicate within request — last color per position wins
        const pixelMap = new Map();
        for (const p of pixels) {
          pixelMap.set(`${p.x},${p.y}`, p);
        }
        const dedupedPixels = Array.from(pixelMap.values());

        // Apply all pixels to board (color changes are always applied)
        for (const p of dedupedPixels) {
          const index = p.y * board.width + p.x;
          board.pixels.set(index, p.color || null);
        }

        if (isUndo) {
          // Refund credits for the last contribution, but only for positions
          // that were FIRST touched in that contribution (not re-paints of
          // already-touched pixels, which didn't cost a credit).
          const playerContribs = board.contributions.filter(
            c => c.user.id.toString() === accountId
          );
          if (playerContribs.length > 0) {
            const lastContrib = playerContribs[playerContribs.length - 1];

            // creditsCost was stored on the contribution when it was created
            const creditsToRefund = lastContrib.creditsCost || 0;

            // Remove positions that were first-touched in this contribution
            const touchedSet = new Set(boardState.touchedPixels || []);
            if (lastContrib.newPositions) {
              for (const pos of lastContrib.newPositions) {
                touchedSet.delete(pos);
              }
            }
            boardState.touchedPixels = Array.from(touchedSet);
            boardState.pixelsRemaining = Math.min(
              board.pixelsPerTurn,
              boardState.pixelsRemaining + creditsToRefund
            );

            // Remove the contribution record
            board.contributions.splice(board.contributions.indexOf(lastContrib), 1);
          }
        }

        if (!isUndo) {
          // Only charge for positions not already touched this credit cycle
          const touchedSet = new Set(boardState.touchedPixels || []);
          const newPositions = dedupedPixels.filter(p => !touchedSet.has(`${p.x},${p.y}`));
          const creditCost = isFreeMode ? 0 : newPositions.length;

          if (!isFreeMode && creditCost > boardState.pixelsRemaining) {
            return {
              success: false,
              error: `Not enough pixels. You have ${boardState.pixelsRemaining} remaining.`
            };
          }

          // Track newly touched positions (skip in free mode)
          if (!isFreeMode) {
            for (const p of newPositions) {
              boardState.touchedPixels.push(`${p.x},${p.y}`);
            }
          }

          // Record contribution with cost metadata for accurate undo refunds
          board.contributions.push({
            user: buildUserObject(account),
            pixels: dedupedPixels.map(p => ({ x: p.x, y: p.y, color: p.color || null })),
            creditsCost: creditCost,
            newPositions: newPositions.map(p => `${p.x},${p.y}`)
          });

          // Update contributor stats
          let stat = board.contributorStats.find(
            s => s.userId.toString() === accountId
          );
          if (stat) {
            stat.totalPixels += creditCost;
            stat.lastContributedAt = now;
            stat.contributionCount += 1;
          } else {
            board.contributorStats.push({
              userId: account._id,
              totalPixels: creditCost,
              lastContributedAt: now,
              contributionCount: 1
            });
            // Re-fetch so nextCreditAt can be set below
            stat = board.contributorStats[board.contributorStats.length - 1];
          }

          // Only charge for new positions
          boardState.pixelsRemaining -= creditCost;
          boardState.lastDrawTime = now;

          // Chain mode: advance to next player after drawing
          if (board.gameMode === 'chain' && board.chainOrder.length > 0) {
            board.currentChainIndex = (board.currentChainIndex + 1) % board.chainOrder.length;
          }

          // Set nextCreditAt for notification scheduling
          if (stat) {
            stat.creditNotified = false;
            switch (board.gameMode) {
              case 'chain': {
                // Notify the NEXT player in chain that it's their turn
                stat.nextCreditAt = null; // current player is done
                if (board.chainOrder.length > 0) {
                  const nextPlayer = board.chainOrder[board.currentChainIndex];
                  if (nextPlayer) {
                    const nextStat = board.contributorStats.find(
                      s => s.userId.toString() === nextPlayer.userId.toString()
                    );
                    if (nextStat) {
                      nextStat.nextCreditAt = now;
                      nextStat.creditNotified = false;
                    }
                  }
                }
                break;
              }
              case 'daily-drop': {
                const intervalMs = DROP_INTERVALS[board.dropInterval] || DROP_INTERVALS.daily;
                stat.nextCreditAt = new Date(now.getTime() + intervalMs);
                break;
              }
              case 'live-canvas': {
                const cooldownMs = (board.liveCooldownSeconds || 180) * 1000;
                stat.nextCreditAt = new Date(now.getTime() + cooldownMs);
                break;
              }
            }
          }
        }

        await board.save();
        // Player save can race with concurrent draws — retry on version conflict
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await player.save();
            break;
          } catch (err) {
            if (err.name === 'VersionError' && attempt < 2) {
              // Reload and re-apply board state changes
              const fresh = await PixelPalsPlayer.findOne({ accountId: account._id });
              if (!fresh) throw err;
              const freshState = fresh.getBoardState(board._id);
              freshState.pixelsRemaining = boardState.pixelsRemaining;
              freshState.lastDrawTime = boardState.lastDrawTime;
              freshState.lastBudgetRefresh = boardState.lastBudgetRefresh;
              freshState.touchedPixels = boardState.touchedPixels;
              player = fresh;
              continue;
            }
            throw err;
          }
        }

        // Broadcast pixel update
        context.io.emit('pixelPals:board:pixelsUpdated', {
          boardId: board._id,
          pixels: dedupedPixels.map(p => ({ x: p.x, y: p.y, color: p.color || null })),
          user: buildUserObject(account),
          isUndo: !!isUndo
        });

        // Auto-complete: check if every pixel is now filled
        const allFilled = board.pixels.every(p => p !== null);
        let autoCompleted = false;

        if (allFilled && board.status === 'active') {
          autoCompleted = true;
          await completeBoard(board, account, context);
        }

        return {
          success: true,
          data: {
            pixelsRemaining: boardState.pixelsRemaining,
            boardId: board._id.toString(),
            gameMode: board.gameMode,
            currentChainIndex: board.currentChainIndex,
            chainOrder: board.chainOrder,
            autoCompleted
          }
        };
      }
    },

    /**
     * Get player status for a specific board
     */
    'pixelPals:player:status': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'sessionId is required' };
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({
          'activeSessions.sessionId': data.sessionId
        });
        if (!account) return { success: false, error: 'Account not found' };

        let player = await PixelPalsPlayer.findOne({ accountId: account._id });
        if (!player) {
          player = new PixelPalsPlayer({ accountId: account._id });
        }

        let boardStateData = null;

        if (data.boardId) {
          const board = await PixelBoard.findById(data.boardId).lean();
          const boardState = player.getBoardState(data.boardId);

          // Free mode: always unlimited
          if (board && board.gameMode === 'free') {
            boardState.pixelsRemaining = 99999999;
            await player.save();
          // Other modes: grant initial budget if never drawn
          } else if (board && boardState.pixelsRemaining <= 0 && !boardState.lastDrawTime) {
            const now = new Date();
            if (board.gameMode === 'daily-drop' || board.gameMode === 'chain') {
              boardState.pixelsRemaining = board.pixelsPerTurn;
              boardState.lastBudgetRefresh = now;
            } else if (board.gameMode === 'live-canvas') {
              boardState.pixelsRemaining = board.pixelsPerTurn;
            }
            await player.save();
          }

          boardStateData = {
            pixelsRemaining: boardState.pixelsRemaining,
            lastDrawTime: boardState.lastDrawTime,
            lastBudgetRefresh: boardState.lastBudgetRefresh
          };
        }

        return {
          success: true,
          data: {
            boardState: boardStateData,
            savedColors: player.savedColors || []
          }
        };
      }
    },

    /**
     * Save a color to personal palette
     */
    'pixelPals:player:colors:save': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'sessionId is required' };
        if (!data.color) return { valid: false, error: 'color is required' };
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({
          'activeSessions.sessionId': data.sessionId
        });
        if (!account) return { success: false, error: 'Account not found' };

        let player = await PixelPalsPlayer.findOneAndUpdate(
          { accountId: account._id },
          { $setOnInsert: { accountId: account._id } },
          { upsert: true, new: true }
        );

        if (player.savedColors.length >= 20) {
          return { success: false, error: 'Maximum 20 saved colors' };
        }

        if (!player.savedColors.includes(data.color)) {
          player.savedColors.push(data.color);
          await player.save();
        }

        return { success: true, data: player.savedColors };
      }
    },

    /**
     * Remove a saved color
     */
    'pixelPals:player:colors:remove': {
      validate: (data) => {
        if (!data.sessionId) return { valid: false, error: 'sessionId is required' };
        if (!data.color) return { valid: false, error: 'color is required' };
        return { valid: true };
      },

      handler: async (data, context) => {
        const account = await Account.findOne({
          'activeSessions.sessionId': data.sessionId
        });
        if (!account) return { success: false, error: 'Account not found' };

        await PixelPalsPlayer.findOneAndUpdate(
          { accountId: account._id },
          { $pull: { savedColors: data.color } }
        );

        const player = await PixelPalsPlayer.findOne({ accountId: account._id });
        return { success: true, data: player ? player.savedColors : [] };
      }
    }
  }
};
