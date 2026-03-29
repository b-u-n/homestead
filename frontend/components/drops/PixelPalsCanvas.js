import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import PixelPalsStore from '../../stores/PixelPalsStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import PixelEditor from '../PixelEditor';

const PixelPalsCanvas = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const boardId = accumulatedData?.['pixelPals:landing']?.boardId ||
                  accumulatedData?.['pixelPals:create']?.boardId ||
                  input?.boardId;

  const [loading, setLoading] = useState(true);
  const [currentColor, setCurrentColor] = useState('#000000');
  const remotePixelsRef = useRef(null);

  useEffect(() => {
    if (boardId) {
      if (context?.onBoardChange) context.onBoardChange(boardId);
      loadBoard();
      PixelPalsStore.loadPlayerStatus(boardId);
    }

    // Listen for real-time pixel updates
    if (WebSocketService.socket) {
      WebSocketService.socket.on('pixelPals:board:pixelsUpdated', handlePixelUpdate);
      WebSocketService.socket.on('pixelPals:board:completed', handleBoardCompleted);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off('pixelPals:board:pixelsUpdated', handlePixelUpdate);
        WebSocketService.socket.off('pixelPals:board:completed', handleBoardCompleted);
      }
    };
  }, [boardId]);

  const loadBoard = async () => {
    setLoading(true);
    try {
      await PixelPalsStore.loadBoard(boardId);
    } catch (err) {
      ErrorStore.addError('Failed to load board');
    }
    setLoading(false);
  };

  const handlePixelUpdate = useCallback(({ boardId: updatedBoardId, pixels, user }) => {
    if (updatedBoardId === boardId) {
      PixelPalsStore.applyPixelUpdate(updatedBoardId, pixels);
      // Push directly into PixelEditor's local state (no prop change needed)
      if (remotePixelsRef.current) {
        remotePixelsRef.current(pixels);
      }
    }
  }, [boardId]);

  const handleBoardCompleted = useCallback(({ boardId: completedBoardId }) => {
    if (completedBoardId === boardId && PixelPalsStore.currentBoard) {
      PixelPalsStore.currentBoard.status = 'completed';
    }
  }, [boardId]);

  const handlePixelsChanged = async (changedPixels, isUndo = false) => {
    if (!boardId || changedPixels.length === 0) return;
    try {
      const result = await PixelPalsStore.drawPixels(boardId, changedPixels, isUndo);
      if (result?.autoCompleted) {
        // Board auto-completed! Reload to show completed state.
        loadBoard();
      }
    } catch (err) {
      console.warn('Draw failed:', err.message);
    }
  };

  const handleSaveColor = async (color) => {
    try {
      await PixelPalsStore.saveColor(color);
    } catch (err) {
      ErrorStore.addError('Failed to save color');
    }
  };

  const handleRemoveColor = async (color) => {
    try {
      await PixelPalsStore.removeColor(color);
    } catch (err) {
      ErrorStore.addError('Failed to remove color');
    }
  };

  const board = PixelPalsStore.currentBoard;
  const playerStatus = PixelPalsStore.playerStatus;
  const isCompleted = board?.status === 'completed';
  const isFreeMode = board?.gameMode === 'free';
  const pixelsRemaining = playerStatus?.pixelsRemaining ?? 0;

  if (loading || !board) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading board...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PixelEditor
        pixels={board.pixels || []}
        width={board.width}
        height={board.height}
        readOnly={isCompleted}
        maxPixels={isCompleted ? 0 : isFreeMode ? null : pixelsRemaining}
        pixelsRemaining={isCompleted || isFreeMode ? null : pixelsRemaining}
        onPixelsChanged={handlePixelsChanged}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        savedColors={playerStatus?.savedColors || []}
        onSaveColor={handleSaveColor}
        onRemoveColor={handleRemoveColor}
        showSaveButton={false}
        onRemotePixelsRef={remotePixelsRef}
        style={styles.editor}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#5C5A58',
    textAlign: 'center',
    padding: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontWeight: '700',
  },
  editor: {
    flex: 1,
  },
});

export default PixelPalsCanvas;
