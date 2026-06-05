import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import StitchedProgressBar from '../workbook/StitchedProgressBar';
import StitchedFillBar from '../StitchedFillBar';

/**
 * progress-counter-or-bar — counter, streak, tally, progress bar, dots, rail.
 */
const ProgressCounterOrBar = observer(({
  kind = 'x-of-n-completion',
  shape = 'numeric-readout',
  currentValue = 0,
  totalOrTarget,
  unitLabel,
  scopeLabel,
  segmentCount,
  currentStepLabel,
  itemList,
  groupHeaders,
  completionMarks = [],
  categoryCounters,
  remainingCount,
  tappable = false,
  onStepTapped,
}) => {
  // Wizard step bar — uses StitchedProgressBar
  if (kind === 'wizard-step-bar' || (shape === 'segmented-bar' && totalOrTarget)) {
    const segs = segmentCount || totalOrTarget || 4;
    const progress = currentValue / segs;
    return (
      <View style={styles.wrap}>
        <StitchedProgressBar progress={progress} steps={segs} />
        {currentStepLabel ? (
          <Text style={[styles.scopeLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            {currentStepLabel}
          </Text>
        ) : null}
      </View>
    );
  }

  // Cumulative-toward-target — continuous textured fill bar (sibling to StitchedProgressBar)
  if (kind === 'cumulative-toward-target-bar' || shape === 'linear-bar' || shape === 'linear-gauge') {
    const pct = totalOrTarget ? Math.min(1, currentValue / totalOrTarget) : 0;
    return (
      <View style={styles.wrap}>
        <StitchedFillBar progress={pct} height={20} borderRadius={10} />
        <Text style={[styles.readout, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          {currentValue}{totalOrTarget ? ` / ${totalOrTarget}` : ''}{unitLabel ? ` ${unitLabel}` : ''}
        </Text>
      </View>
    );
  }

  // Inline step dots
  if (kind === 'inline-step-dots' || shape === 'dots-row') {
    const total = totalOrTarget || segmentCount || 5;
    return (
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < currentValue;
          return (
            <Pressable key={i} onPress={() => tappable && onStepTapped && onStepTapped(i)} disabled={!tappable}>
              <View style={[styles.dot, filled && styles.dotFilled]} />
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Streak (non-punitive)
  if (kind === 'streak-non-punitive') {
    return (
      <View style={styles.streakRow}>
        <Text style={[styles.streakNum, { fontSize: FontSettingsStore.getScaledFontSize(20) }]}>
          {currentValue}
        </Text>
        <Text style={[styles.streakLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          {currentValue === 1 ? 'day' : 'days'}{unitLabel ? ` ${unitLabel}` : ''}
        </Text>
      </View>
    );
  }

  // Running tally strip
  if (kind === 'running-tally-strip' && categoryCounters) {
    return (
      <View style={styles.tallyRow}>
        {Object.entries(categoryCounters).map(([key, val]) => (
          <View key={key} style={styles.tallyCell}>
            <Text style={[styles.tallyLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>{key}</Text>
            <Text style={[styles.tallyVal, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>{val}</Text>
          </View>
        ))}
        {remainingCount != null ? (
          <View style={styles.tallyCell}>
            <Text style={[styles.tallyLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>left</Text>
            <Text style={[styles.tallyVal, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>{remainingCount}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Checklist rail / sidebar
  if (kind === 'checklist-rail-sidebar' && itemList?.length) {
    return (
      <View style={styles.rail}>
        {itemList.map((item, i) => {
          const done = completionMarks?.includes(item.id ?? i);
          return (
            <Pressable key={i} onPress={() => tappable && onStepTapped && onStepTapped(i)} style={styles.railRow}>
              <Text style={[styles.railCheck, done && styles.railCheckDone, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
                {done ? '☑' : '☐'}
              </Text>
              <Text
                style={[styles.railLabel, done && styles.railLabelDone, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}
                numberOfLines={1}
              >
                {item.label || item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Default: x-of-N or aggregate readout
  return (
    <View style={styles.readoutWrap}>
      {scopeLabel ? (
        <Text style={[styles.scopeLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {scopeLabel}
        </Text>
      ) : null}
      <Text style={[styles.readout, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
        {currentValue}{totalOrTarget != null ? ` / ${totalOrTarget}` : ''}{unitLabel ? ` ${unitLabel}` : ''}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  readoutWrap: { flexDirection: 'row', gap: 8, alignItems: 'baseline' },
  scopeLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  readout: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  linearTrack: { height: 12, borderRadius: 6, backgroundColor: 'rgba(100, 130, 195, 0.25)', overflow: 'hidden' },
  linearFill: { height: '100%', backgroundColor: 'rgba(135, 180, 210, 0.65)' },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: 'rgba(100, 130, 195, 0.25)',
    borderWidth: 1, borderColor: 'rgba(92, 90, 88, 0.4)', borderStyle: 'dashed',
  },
  dotFilled: { backgroundColor: 'rgba(135, 180, 210, 0.85)' },
  streakRow: { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
  streakNum: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  streakLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  tallyRow: { flexDirection: 'row', gap: 10 },
  tallyCell: { alignItems: 'center', gap: 0 },
  tallyLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tallyVal: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
  },
  rail: { gap: 4 },
  railRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 4 },
  railCheck: {
    width: 18,
    color: 'rgba(69, 67, 66, 0.5)',
  },
  railCheckDone: { color: '#7044C7' },
  railLabel: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
  },
  railLabelDone: { fontWeight: '700', color: '#2D2C2B' },
});

export default ProgressCounterOrBar;
