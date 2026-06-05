import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * WeekTracker — two-week (this + last) tri-state day grid.
 *
 * Each day cycles through three states on tap: 'normal' → 'light' → 'dark' →
 * 'normal'. Used by symptom severity tracker and any other "track how the
 * last fourteen days went" surface.
 *
 * Value shape (bound):
 *   {
 *     "previous": { "mon": "normal", "tue": "light", ... },
 *     "this":     { "mon": "dark",   "tue": "normal", ... }
 *   }
 *
 * Authors pass `dayLabels` if they want non-default day-of-week strings; the
 * default is short two-letter labels (Mo / Tu / We / Th / Fr / Sa / Su).
 */
const STATES = ['normal', 'light', 'dark'];
const DEFAULT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DEFAULT_LABELS = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };

const STATE_OVERLAY = {
  normal: 'rgba(100, 130, 195, 0.18)',
  light:  'rgba(135, 180, 210, 0.55)',
  dark:   'rgba(112, 68, 199, 0.55)',
};

const WeekTracker = observer(({
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
  days = DEFAULT_DAYS,
  dayLabels = DEFAULT_LABELS,
  previousWeekLabel = 'Last week',
  thisWeekLabel = 'This week',
}) => {
  const value = currentValue && typeof currentValue === 'object' ? currentValue : { previous: {}, this: {} };
  const previous = value.previous && typeof value.previous === 'object' ? value.previous : {};
  const thisWeek = value.this && typeof value.this === 'object' ? value.this : {};

  const cycle = (which, day) => {
    if (!interactable || disabled) return;
    const current = (which === 'previous' ? previous : thisWeek)[day] || 'normal';
    const idx = STATES.indexOf(current);
    const next = STATES[(idx + 1) % STATES.length];
    const updated = {
      ...value,
      [which]: {
        ...(which === 'previous' ? previous : thisWeek),
        [day]: next,
      },
    };
    onValueChanged && onValueChanged(updated);
    onValueCommitted && onValueCommitted(updated);
  };

  const renderWeek = (which, label) => {
    const weekValue = which === 'previous' ? previous : thisWeek;
    return (
      <View style={styles.weekBlock}>
        <Text style={[styles.weekLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {label}
        </Text>
        <View style={styles.dayRow}>
          {days.map(day => {
            const state = weekValue[day] || 'normal';
            return (
              <Pressable
                key={`${which}-${day}`}
                onPress={() => cycle(which, day)}
                disabled={disabled || !interactable}
                style={styles.dayCell}
              >
                <MinkyPanel
                  borderRadius={8}
                  padding={6}
                  paddingTop={6}
                  overlayColor={STATE_OVERLAY[state]}
                >
                  <Text
                    style={[styles.dayLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}
                  >
                    {dayLabels[day] || day}
                  </Text>
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {renderWeek('previous', previousWeekLabel)}
      {renderWeek('this', thisWeekLabel)}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: STATE_OVERLAY.normal }]} />
          <Text style={[styles.legendText, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>normal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: STATE_OVERLAY.light }]} />
          <Text style={[styles.legendText, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>lighter</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: STATE_OVERLAY.dark }]} />
          <Text style={[styles.legendText, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>heavier</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  weekBlock: { gap: 4 },
  weekLabel: {
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dayRow: { flexDirection: 'row', gap: 4 },
  dayCell: { flexBasis: 0, flexGrow: 1, minWidth: 36 },
  dayLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
});

export default WeekTracker;
