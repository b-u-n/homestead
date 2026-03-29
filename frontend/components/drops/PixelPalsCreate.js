import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import PixelPalsStore from '../../stores/PixelPalsStore';
import FeatureStore from '../../stores/FeatureStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';

const SIZE_OPTIONS = [
  { label: '16x16', value: '16x16', featureId: 'pixelPals:size:16x16' },
  { label: '32x32', value: '32x32', featureId: 'pixelPals:size:32x32' },
  { label: '48x48', value: '48x48', featureId: 'pixelPals:size:48x48' },
];

const GAME_MODES = [
  { value: 'chain', label: 'Chain', desc: 'Take turns! One player draws, then the next.' },
  { value: 'daily-drop', label: 'Daily Drop', desc: 'Everyone gets pixels on a timer. Use them wisely!' },
  { value: 'live-canvas', label: 'Live Canvas', desc: 'Free-for-all with a cooldown between draws.' },
];

const DROP_INTERVALS = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
];

const PixelPalsCreate = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState('32x32');
  const [boardType, setBoardType] = useState('shared');
  const [pixelsPerTurn, setPixelsPerTurn] = useState(null);
  const [gameMode, setGameMode] = useState('daily-drop');
  const [dropInterval, setDropInterval] = useState('daily');
  const [liveCooldownSeconds, setLiveCooldownSeconds] = useState(180);
  const [customWidth, setCustomWidth] = useState(32);
  const [customHeight, setCustomHeight] = useState(32);
  const [creating, setCreating] = useState(false);

  // Filter size options by feature level - if features haven't loaded, show level-0 sizes
  const availableSizes = FeatureStore.loaded
    ? SIZE_OPTIONS.filter(opt => FeatureStore.has(opt.featureId))
    : SIZE_OPTIONS.filter(opt => opt.featureId === 'pixelPals:size:16x16' || opt.featureId === 'pixelPals:size:32x32');
  const hasCustom = FeatureStore.loaded && FeatureStore.has('pixelPals:size:custom');

  const handleCreate = async () => {
    if (!title.trim()) {
      ErrorStore.addError('Please give your board a title');
      return;
    }

    setCreating(true);
    try {
      const w = size === 'custom' ? customWidth : parseInt((size || '32x32').split('x')[0]);
      const effectivePpt = pixelsPerTurn ?? Math.round((w * w) / 8);
      const board = await PixelPalsStore.createBoard({
        title: title.trim(),
        size: size === 'custom' ? 'custom' : size,
        boardType,
        pixelsPerTurn: effectivePpt,
        gameMode,
        dropInterval: gameMode === 'daily-drop' ? dropInterval : undefined,
        liveCooldownSeconds: gameMode === 'live-canvas' ? liveCooldownSeconds : undefined,
        customWidth: size === 'custom' ? customWidth : undefined,
        customHeight: size === 'custom' ? customHeight : undefined,
      });
      onComplete({ action: 'created', boardId: board._id });
    } catch (err) {
      ErrorStore.addError(err.message || 'Failed to create board');
    }
    setCreating(false);
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { fontSize: FontSettingsStore.getScaledFontSize(16) }]}>
        Create a Board
      </Text>

      {/* Title input */}
      <MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)" padding={10} borderRadius={8}>
        <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>Title</Text>
        {isWeb ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder="Name your board..."
            style={{
              fontFamily: 'Comfortaa',
              fontSize: FontSettingsStore.getScaledFontSize(13),
              padding: 8,
              borderRadius: 6,
              border: '1px dashed rgba(112, 68, 199, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        ) : null}
      </MinkyPanel>

      {/* Size picker */}
      <MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)" padding={10} borderRadius={8}>
        <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>Board Size</Text>
        <View style={styles.optionRow}>
          {availableSizes.map((opt) => (
            <WoolButton
              key={opt.value}
              variant="purple"
              size="small"
              focused={size === opt.value}
              onPress={() => setSize(opt.value)}
            >
              {opt.label}
            </WoolButton>
          ))}
          {hasCustom && (
            <WoolButton
              variant="purple"
              size="small"
              focused={size === 'custom'}
              onPress={() => setSize('custom')}
            >
              Custom
            </WoolButton>
          )}
        </View>
        {size === 'custom' && isWeb && (
          <View style={styles.customSizeRow}>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(Math.min(64, Math.max(8, parseInt(e.target.value) || 8)))}
              min={8}
              max={64}
              style={{ width: 50, fontFamily: 'Comfortaa', padding: 4, borderRadius: 4, border: '1px solid #ccc', textAlign: 'center' }}
            />
            <Text style={styles.customX}>x</Text>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(Math.min(64, Math.max(8, parseInt(e.target.value) || 8)))}
              min={8}
              max={64}
              style={{ width: 50, fontFamily: 'Comfortaa', padding: 4, borderRadius: 4, border: '1px solid #ccc', textAlign: 'center' }}
            />
          </View>
        )}
      </MinkyPanel>

      {/* Board type */}
      <MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)" padding={10} borderRadius={8}>
        <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>Board Type</Text>
        <View style={styles.optionRow}>
          <WoolButton
            variant="purple"
            size="small"
            focused={boardType === 'shared'}
            onPress={() => setBoardType('shared')}
          >
            Shared
          </WoolButton>
          <WoolButton
            variant="purple"
            size="small"
            focused={boardType === 'personal'}
            onPress={() => setBoardType('personal')}
          >
            Personal
          </WoolButton>
        </View>
        <Text style={[styles.hint, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
          {boardType === 'shared'
            ? 'Anyone can contribute pixels to this board'
            : 'Only you can draw, but others can see your art'}
        </Text>
      </MinkyPanel>

      {/* Game mode */}
      <MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)" padding={10} borderRadius={8}>
        <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>Game Mode</Text>
        <View style={styles.optionRow}>
          {boardType === 'personal' && (
            <WoolButton
              variant="purple"
              size="small"
              focused={gameMode === 'free'}
              onPress={() => setGameMode('free')}
            >
              Free
            </WoolButton>
          )}
          {GAME_MODES.map((mode) => (
            <WoolButton
              key={mode.value}
              variant="purple"
              size="small"
              focused={gameMode === mode.value}
              onPress={() => setGameMode(mode.value)}
            >
              {mode.label}
            </WoolButton>
          ))}
        </View>
        <Text style={[styles.hint, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
          {gameMode === 'free'
            ? 'Draw as much as you want with no limits'
            : GAME_MODES.find(m => m.value === gameMode)?.desc}
        </Text>

        {/* Mode-specific options */}
        {gameMode === 'daily-drop' && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>Refresh Interval</Text>
            <View style={styles.optionRow}>
              {DROP_INTERVALS.map((opt) => (
                <WoolButton
                  key={opt.value}
                  variant="blue"
                  size="small"
                  focused={dropInterval === opt.value}
                  onPress={() => setDropInterval(opt.value)}
                >
                  {opt.label}
                </WoolButton>
              ))}
            </View>
          </View>
        )}

        {gameMode === 'live-canvas' && isWeb && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
              Cooldown: {liveCooldownSeconds}s ({Math.floor(liveCooldownSeconds / 60)}m {liveCooldownSeconds % 60}s)
            </Text>
            <input
              type="range"
              min={30}
              max={600}
              step={30}
              value={liveCooldownSeconds}
              onChange={(e) => setLiveCooldownSeconds(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#7044C7' }}
            />
          </View>
        )}
      </MinkyPanel>

      {/* Pixels per turn — hidden in free mode */}
      {gameMode !== 'free' && (() => {
        const w = size === 'custom' ? customWidth : parseInt((size || '32x32').split('x')[0]);
        const total = w * w;
        const eighth = Math.round(total / 8);
        const quarter = Math.round(total / 4);
        const half = Math.round(total / 2);
        const options = [eighth, quarter, half];
        const effectivePixelsPerTurn = pixelsPerTurn ?? eighth;
        return (
          <MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)" padding={10} borderRadius={8}>
            <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              Pixels Per Turn: {effectivePixelsPerTurn}
            </Text>
            <View style={styles.optionRow}>
              {options.map((n) => (
                <WoolButton
                  key={n}
                  variant="purple"
                  size="small"
                  focused={effectivePixelsPerTurn === n}
                  onPress={() => setPixelsPerTurn(n)}
                >
                  {n}
                </WoolButton>
              ))}
            </View>
          </MinkyPanel>
        );
      })()}

      {/* Actions */}
      <View style={styles.actions}>
        <WoolButton
          variant="purple"
          onPress={handleCreate}
          disabled={creating || !title.trim()}
        >
          {creating ? 'Creating...' : 'Create Board'}
        </WoolButton>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
    padding: 12,
  },
  heading: {
    fontFamily: 'ChubbyTrail',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontFamily: 'Comfortaa',
    color: '#454342',
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  customSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customX: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#454342',
  },
  hint: {
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#5C5A58',
  },
  actions: {
    alignItems: 'center',
    marginTop: 4,
  },
});

export default PixelPalsCreate;
