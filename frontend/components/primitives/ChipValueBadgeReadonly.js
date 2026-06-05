import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * chip-value-badge-readonly — read-only display chip.
 */
const ChipValueBadgeReadonly = observer(({
  value,
  role = 'category-metadata',
  palette = 'neutral',
  sourceRef,
  sizeWeight = 1,
  completionState,
  postRating,
  durationLabel,
  isRecurringRitual = false,
  tapBehavior = 'none',
  onChipTapped,
  onTooltipOpened,
  onSourceReveal,
  onOpenFullCard,
}) => {
  // Palette → overlay color
  const paletteColor = (() => {
    if (palette === 'category-color') return 'rgba(112, 68, 199, 0.2)';
    if (palette === 'over-budget-amber') return 'rgba(220, 165, 75, 0.4)';
    if (palette?.startsWith('delta-sign')) {
      if (typeof value === 'number' && value > 0) return 'rgba(160, 200, 140, 0.5)';
      if (typeof value === 'number' && value < 0) return 'rgba(220, 130, 130, 0.4)';
      return 'rgba(150, 150, 150, 0.25)';
    }
    return 'rgba(100, 130, 195, 0.25)';
  })();

  const handlePress = () => {
    if (tapBehavior === 'none') return;
    onChipTapped && onChipTapped({ role, value, sourceRef });
    if (tapBehavior === 'tooltip') onTooltipOpened && onTooltipOpened({ value, sourceRef });
    if (tapBehavior === 'open-source') onSourceReveal && onSourceReveal({ sourceRef });
    if (tapBehavior === 'open-full-card') onOpenFullCard && onOpenFullCard({ sourceRef });
  };

  // Placed-card mini-surrogate variant — taller, multi-line
  if (role === 'placed-card-mini-surrogate') {
    return (
      <Pressable onPress={handlePress} disabled={tapBehavior === 'none'}>
        <MinkyPanel borderRadius={8} padding={8} paddingTop={8} overlayColor={paletteColor}>
          <View style={styles.placedRow}>
            <Text style={[styles.placedLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]} numberOfLines={1}>
              {isRecurringRitual ? '↻ ' : ''}{value}
            </Text>
            {durationLabel ? (
              <Text style={[styles.placedSub, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>{durationLabel}</Text>
            ) : null}
            {(completionState || postRating != null) ? (
              <View style={styles.placedFooter}>
                {completionState ? (
                  <Text style={[styles.placedSub, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
                    {completionState === 'completed' ? '✓' : completionState === 'skipped' ? '○' : '·'}
                  </Text>
                ) : null}
                {postRating != null ? (
                  <Text style={[styles.placedSub, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>{postRating}/10</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </MinkyPanel>
      </Pressable>
    );
  }

  // Default: small inline badge
  const formatted = role === 'derived-numeric-delta' && typeof value === 'number'
    ? (value > 0 ? `+${value}` : `${value}`)
    : value;

  const padding = sizeWeight > 1 ? 8 : 5;

  return (
    <Pressable onPress={handlePress} disabled={tapBehavior === 'none'} style={styles.inlineWrap}>
      <MinkyPanel borderRadius={12} padding={padding} paddingTop={padding} overlayColor={paletteColor}>
        <Text
          style={[
            styles.badgeText,
            { fontSize: FontSettingsStore.getScaledFontSize(11 + (sizeWeight > 1 ? 2 : 0)) },
          ]}
          numberOfLines={1}
        >
          {formatted}
        </Text>
      </MinkyPanel>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  inlineWrap: { alignSelf: 'flex-start' },
  badgeText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  placedRow: { gap: 2, alignSelf: 'stretch', minWidth: 80 },
  placedLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  placedSub: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  placedFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
});

export default ChipValueBadgeReadonly;
