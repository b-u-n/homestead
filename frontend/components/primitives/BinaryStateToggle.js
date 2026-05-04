import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

const PRESENTATION_GLYPHS = {
  'heart-favorite-icon': { on: '♥', off: '♡' },
  'watering-can-star': { on: '★', off: '☆' },
  'flag-toggle': { on: '⚑', off: '⚐' },
  'mark-done button': { on: '✓', off: '○' },
  'mark-done': { on: '✓', off: '○' },
  'pin toggle': { on: '📌', off: '📍' },
  'pin': { on: '📌', off: '📍' },
  'criterion row toggle': { on: '✓', off: '○' },
  'icon-button': { on: '✓', off: '○' },
};

/**
 * binary-state-toggle — per-item boolean flag.
 * Spec: ../_meta-canonical/binary-state-toggle.json
 */
const BinaryStateToggle = observer(({
  currentState,
  value,
  label,
  targetRecordId,
  presentation = 'heart-favorite-icon',
  placement = 'per-card corner (heart, star, watering-can)',
  sideEffect = 'none',
  scope = 'local-per-item',
  interactable = true,
  onToggle,
  onDownstreamWrite,
  onValueChanged,
}) => {
  // Source of truth: explicit `currentState` wins, then v2 `value`, then false.
  const state = typeof currentState === 'boolean'
    ? currentState
    : (typeof value === 'boolean' ? value : false);
  const glyphs = PRESENTATION_GLYPHS[presentation] || PRESENTATION_GLYPHS['icon-button'];
  const glyph = state ? glyphs.on : glyphs.off;

  const isLargeButton = placement === 'large section-filling button';
  const isInlineRow = placement === 'inline in form (per-criterion row)' || placement === 'per-row inline icon';

  const handlePress = () => {
    if (!interactable) return;
    const next = !state;
    onToggle && onToggle(next, { targetRecordId });
    onValueChanged && onValueChanged(next);
    if (sideEffect !== 'none') {
      onDownstreamWrite && onDownstreamWrite({ sideEffect, value: next, targetRecordId, scope });
    }
  };

  if (isLargeButton) {
    return (
      <Pressable onPress={handlePress} style={styles.largeWrap}>
        <MinkyPanel
          borderRadius={14}
          padding={14}
          paddingTop={14}
          overlayColor={state ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
          borderColor={state ? 'rgba(92, 90, 88, 0.55)' : undefined}
        >
          <View style={styles.largeRow}>
            <Text style={[styles.largeGlyph, { fontSize: FontSettingsStore.getScaledFontSize(22) }]}>
              {glyph}
            </Text>
            {label ? (
              <Text style={[styles.largeLabel, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
                {label}
              </Text>
            ) : null}
          </View>
        </MinkyPanel>
      </Pressable>
    );
  }

  if (isInlineRow) {
    return (
      <Pressable onPress={handlePress} style={styles.inlineRow}>
        <Text
          style={[
            styles.inlineGlyph,
            state && styles.glyphActive,
            { fontSize: FontSettingsStore.getScaledFontSize(20) },
          ]}
        >
          {glyph}
        </Text>
        {label ? (
          <Text style={[styles.inlineLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {label}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  // Default: corner icon — full-component pressable with generous hit area + optional label
  return (
    <Pressable onPress={handlePress} style={styles.cornerWrap} hitSlop={8}>
      <View style={styles.cornerInner}>
        <Text
          style={[
            styles.cornerGlyph,
            state && styles.glyphActive,
            { fontSize: FontSettingsStore.getScaledFontSize(28) },
          ]}
        >
          {glyph}
        </Text>
        {label ? (
          <Text style={[styles.cornerLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cornerWrap: {
    minWidth: 48, minHeight: 48,
    paddingVertical: 8, paddingHorizontal: 10,
    alignSelf: 'flex-start',
    alignItems: 'center', justifyContent: 'center',
  },
  cornerInner: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  cornerGlyph: {
    color: 'rgba(69, 67, 66, 0.55)',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cornerLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  glyphActive: {
    color: '#C04A6F',
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8, minHeight: 48 },
  inlineGlyph: {
    color: 'rgba(69, 67, 66, 0.5)',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inlineLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  largeWrap: { alignSelf: 'stretch' },
  largeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  largeGlyph: {
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  largeLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default BinaryStateToggle;
