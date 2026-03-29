import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import PixelPalsStore from '../../stores/PixelPalsStore';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import { PixelThumbnail } from '../PixelEditor';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'shared', label: 'Shared' },
  { key: 'personal', label: 'Mine' },
  { key: 'pixel-art', label: 'Pixel Art' },
];

const SIZE_FILTERS = [
  { key: 'any', label: 'Any' },
  { key: '16', label: '16' },
  { key: '32', label: '32' },
  { key: '48', label: '48' },
];

const MODE_FILTERS = [
  { key: 'any', label: 'Any' },
  { key: 'free', label: 'Free' },
  { key: 'chain', label: 'Chain' },
  { key: 'daily-drop', label: 'Daily' },
  { key: 'live-canvas', label: 'Live' },
];

const PixelPalsLanding = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('pixel-art');
  const [sizeFilter, setSizeFilter] = useState('any');
  const [modeFilter, setModeFilter] = useState('any');
  const isMobile = uxStore.isMobile || uxStore.isPortrait;
  const myAccountId = SessionStore.accountId;
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    // Clear boardId from URL when landing is shown
    if (context?.onBoardChange) context.onBoardChange(null);
    loadData();

    if (WebSocketService.socket) {
      WebSocketService.socket.on('pixelPals:board:created', handleBoardUpdate);
      WebSocketService.socket.on('pixelPals:board:pixelsUpdated', handleBoardUpdate);
      WebSocketService.socket.on('pixelPals:board:completed', handleBoardUpdate);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off('pixelPals:board:created', handleBoardUpdate);
        WebSocketService.socket.off('pixelPals:board:pixelsUpdated', handleBoardUpdate);
        WebSocketService.socket.off('pixelPals:board:completed', handleBoardUpdate);
      }
    };
  }, []);

  const handleBoardUpdate = () => {
    PixelPalsStore.loadBoards();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await PixelPalsStore.loadBoards();
    } catch (err) {
      ErrorStore.addError('Failed to load boards');
    }
    setLoading(false);
  };

  // Filter boards
  const allBoards = PixelPalsStore.boards;
  const filteredBoards = allBoards.filter(board => {
    // Hide other people's personal boards
    if (board.boardType === 'personal' && board.creator?.id?.toString() !== myAccountId) {
      return false;
    }
    // Type filter
    if (typeFilter === 'shared' && board.boardType !== 'shared') return false;
    if (typeFilter === 'personal' && board.boardType !== 'personal') return false;
    // Size filter
    if (sizeFilter !== 'any' && board.width !== parseInt(sizeFilter)) return false;
    // Mode filter
    if (modeFilter !== 'any' && board.gameMode !== modeFilter) return false;
    return true;
  });

  const gridGap = 6;
  const thumbSize = Math.floor((containerWidth - gridGap * 3) / 4);

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, typeFilter === f.key && styles.filterChipActive]}
              onPress={() => setTypeFilter(f.key)}
            >
              <Text style={[styles.filterText, typeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.filterRow}>
          {SIZE_FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, sizeFilter === f.key && styles.filterChipActive]}
              onPress={() => setSizeFilter(f.key)}
            >
              <Text style={[styles.filterText, sizeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.filterRow}>
          {MODE_FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, modeFilter === f.key && styles.filterChipActive]}
              onPress={() => setModeFilter(f.key)}
            >
              <Text style={[styles.filterText, modeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Board grid */}
      <ScrollBarView style={styles.boardList} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
        {loading ? (
          <Text style={styles.loadingText}>Loading boards...</Text>
        ) : filteredBoards.length === 0 ? (
          <Text style={styles.emptyText}>No boards match your filters</Text>
        ) : (
          <View style={[styles.boardGrid, { gap: gridGap }]}>
            {filteredBoards.map((board) => (
              <Pressable
                key={board._id}
                onPress={() => {
                  if (context?.onBoardChange) context.onBoardChange(board._id);
                  onComplete({ action: 'viewBoard', boardId: board._id });
                }}
                style={{ width: thumbSize }}
              >
                <PixelThumbnail
                  pixels={board.pixels || []}
                  width={board.width}
                  height={board.height}
                  size={thumbSize}
                />
                <Text style={styles.thumbTitle} numberOfLines={1}>
                  {board.title}
                </Text>
                {board.boardType === 'personal' && (
                  <View style={styles.soloBadge}>
                    <Text style={styles.soloBadgeText}>Solo</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollBarView>

      {/* New board button */}
      <View style={styles.buttonRow}>
        <WoolButton
          variant="purple"
          onPress={() => onComplete({ action: 'createBoard' })}
          size="small"
        >
          New Board
        </WoolButton>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 6,
    padding: 8,
    alignItems: 'center',
  },
  filterBar: {
    gap: 4,
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(112, 68, 199, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(112, 68, 199, 0.25)',
  },
  filterText: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#5C5A58',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  filterTextActive: {
    color: '#7044C7',
  },
  boardList: {
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#5C5A58',
    textAlign: 'center',
    padding: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#5C5A58',
    textAlign: 'center',
    padding: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  thumbTitle: {
    fontFamily: 'Comfortaa',
    fontSize: 8,
    color: '#454342',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  soloBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(222, 134, 223, 0.5)',
  },
  soloBadgeText: {
    fontFamily: 'Comfortaa',
    fontSize: 7,
    color: '#fff',
    fontWeight: '700',
  },
  buttonRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});

export default PixelPalsLanding;
