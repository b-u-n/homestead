import { makeAutoObservable } from 'mobx';
import WebSocketService from '../services/websocket';
import SessionStore from './SessionStore';

class PixelPalsStore {
  boards = [];
  currentBoard = null;
  playerStatus = null;
  loading = false;
  boardLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadBoards(filter = null) {
    this.loading = true;
    try {
      const data = await WebSocketService.emit('pixelPals:boards:list', { filter, sessionId: SessionStore.sessionId });
      this.boards = data || [];
    } catch (err) {
      console.error('Failed to load boards:', err);
    }
    this.loading = false;
  }

  async loadBoard(boardId) {
    this.boardLoading = true;
    try {
      const data = await WebSocketService.emit('pixelPals:board:get', { boardId });
      this.currentBoard = data;
    } catch (err) {
      console.error('Failed to load board:', err);
    }
    this.boardLoading = false;
  }

  async createBoard({ title, size, boardType, pixelsPerTurn, gameMode, dropInterval, liveCooldownSeconds, customWidth, customHeight }) {
    try {
      const data = await WebSocketService.emit('pixelPals:board:create', {
        sessionId: SessionStore.sessionId,
        title,
        size,
        boardType,
        pixelsPerTurn,
        gameMode,
        dropInterval,
        liveCooldownSeconds,
        customWidth,
        customHeight,
      });
      this.currentBoard = data;
      return data;
    } catch (err) {
      console.error('Failed to create board:', err);
      throw err;
    }
  }

  async drawPixels(boardId, pixels, isUndo = false) {
    try {
      const data = await WebSocketService.emit('pixelPals:board:draw', {
        sessionId: SessionStore.sessionId,
        boardId,
        pixels,
        isUndo,
      });
      // Update player status from response
      if (data) {
        this.playerStatus = {
          ...this.playerStatus,
          pixelsRemaining: data.pixelsRemaining,
          boardId: data.boardId,
          gameMode: data.gameMode,
          currentChainIndex: data.currentChainIndex,
          chainOrder: data.chainOrder,
        };
      }
      return data;
    } catch (err) {
      console.error('Failed to draw pixels:', err);
      throw err;
    }
  }

  async loadPlayerStatus(boardId = null) {
    try {
      const data = await WebSocketService.emit('pixelPals:player:status', {
        sessionId: SessionStore.sessionId,
        boardId,
      });
      // Flatten boardState into top-level for consistent access
      this.playerStatus = {
        pixelsRemaining: data?.boardState?.pixelsRemaining ?? 0,
        lastDrawTime: data?.boardState?.lastDrawTime ?? null,
        lastBudgetRefresh: data?.boardState?.lastBudgetRefresh ?? null,
        savedColors: data?.savedColors ?? [],
      };
    } catch (err) {
      console.error('Failed to load player status:', err);
    }
  }

  async saveColor(color) {
    try {
      const data = await WebSocketService.emit('pixelPals:player:colors:save', {
        sessionId: SessionStore.sessionId,
        color,
      });
      if (this.playerStatus) {
        this.playerStatus.savedColors = data;
      }
    } catch (err) {
      console.error('Failed to save color:', err);
      throw err;
    }
  }

  async removeColor(color) {
    try {
      const data = await WebSocketService.emit('pixelPals:player:colors:remove', {
        sessionId: SessionStore.sessionId,
        color,
      });
      if (this.playerStatus) {
        this.playerStatus.savedColors = data;
      }
    } catch (err) {
      console.error('Failed to remove color:', err);
      throw err;
    }
  }

  // Apply incoming pixel broadcast to current board
  applyPixelUpdate(boardId, pixels) {
    if (this.currentBoard && this.currentBoard._id === boardId) {
      for (const p of pixels) {
        const index = p.y * this.currentBoard.width + p.x;
        this.currentBoard.pixels[index] = p.color;
      }
    }
  }

  reset() {
    this.boards = [];
    this.currentBoard = null;
    this.playerStatus = null;
    this.loading = false;
    this.boardLoading = false;
  }
}

export default new PixelPalsStore();
