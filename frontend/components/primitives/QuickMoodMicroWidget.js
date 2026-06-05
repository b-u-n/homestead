import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MoodStore from '../../stores/MoodStore';
import MinkyPanel from '../MinkyPanel';
import NumericRatingSlider from './NumericRatingSlider';

const EMOJI_LOW_HIGH = { low: '😔', high: '😊' };
const EMOJI_SCALE = ['😣','😟','😔','😐','🙂','😌','😊','😄','🤩','✨'];

/**
 * quick-mood-micro-widget — platform #8 mood capture.
 *
 * Writes to MoodStore on commit (which fires 'mood:write' over WebSocket).
 */
const QuickMoodMicroWidget = observer(({
  uiSubform = 'horizontal-slider',
  timingHook = 'on-save',
  scaleMin = 1,
  scaleMax = 10,
  currentValue,
  promptText = 'How are you feeling right now?',
  lowAnchorEmoji = EMOJI_LOW_HIGH.low,
  highAnchorEmoji = EMOJI_LOW_HIGH.high,
  label,
  sourceActivityId,
  sourceSaveEvent,
  autoCommit = false,
  interactable = true,
  onValueChanged,
  onCommitted,
  onSharedStoreWrite,
}) => {
  const [local, setLocal] = useState(currentValue ?? Math.ceil((scaleMin + scaleMax) / 2));
  const [committed, setCommitted] = useState(false);

  const setValue = (v) => {
    if (!interactable) return;
    setLocal(v);
    onValueChanged && onValueChanged(v);
    if (autoCommit) commit(v);
  };

  const commit = async (val) => {
    if (!interactable) return;
    const v = val ?? local;
    onCommitted && onCommitted(v);
    try {
      const entry = await MoodStore.write({
        moodValue: v,
        sourceActivityId,
        sourceSaveEvent: sourceSaveEvent || timingHook
      });
      setCommitted(true);
      onSharedStoreWrite && onSharedStoreWrite({
        moodValue: v,
        timestamp: entry?.createdAt || new Date().toISOString(),
        sourceActivity: sourceActivityId,
        sourceSaveEvent: sourceSaveEvent || timingHook
      });
    } catch (err) {
      // Non-blocking: even if write fails, the local state still reflects the user's pick
      console.error('Mood write failed:', err);
    }
  };

  if (uiSubform === 'emoji-scale' || uiSubform === 'chip-scale') {
    const total = scaleMax - scaleMin + 1;
    const emojis = uiSubform === 'emoji-scale'
      ? Array.from({ length: total }).map((_, i) => EMOJI_SCALE[Math.floor(i * (EMOJI_SCALE.length - 1) / Math.max(1, total - 1))])
      : null;

    return (
      <MinkyPanel borderRadius={16} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
        <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(17) }]}>
          {promptText}
        </Text>
        <View style={styles.chipRow}>
          {Array.from({ length: total }).map((_, i) => {
            const v = scaleMin + i;
            const sel = local === v;
            return (
              <Pressable key={v} onPress={() => { setValue(v); commit(v); }} style={styles.chipCell}>
                <MinkyPanel
                  borderRadius={28}
                  padding={12}
                  paddingTop={12}
                  overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                  borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
                >
                  <Text style={[styles.chipLabel, { fontSize: FontSettingsStore.getScaledFontSize(20) }]}>
                    {emojis ? emojis[i] : v}
                  </Text>
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>
        {committed ? (
          <Text style={[styles.confirmText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            ✓ logged
          </Text>
        ) : null}
      </MinkyPanel>
    );
  }

  // Default: horizontal-slider / vertical-slider / emoji-anchored-slider
  return (
    <MinkyPanel borderRadius={16} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
      <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(17) }]}>
        {promptText}
      </Text>
      <NumericRatingSlider
        scaleMin={scaleMin}
        scaleMax={scaleMax}
        currentValue={local}
        emojiAnchors={uiSubform === 'emoji-anchored-slider' || lowAnchorEmoji ? { low: lowAnchorEmoji, high: highAnchorEmoji } : null}
        labelCopy={label}
        onValueChanged={setValue}
        onValueCommitted={commit}
      />
      {committed ? (
        <Text style={[styles.confirmText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          ✓ logged
        </Text>
      ) : null}
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  prompt: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginBottom: 14,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chipCell: { minWidth: 48 },
  chipLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confirmText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default QuickMoodMicroWidget;
