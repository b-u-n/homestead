import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import StitchedBorder from '../StitchedBorder';

/**
 * history-saved-entry-card — atomic per-entry card consumed by pageable-history-carousel.
 */
const ActionButton = ({ glyph, label, onPress }) => (
  <Pressable onPress={() => onPress && onPress()} hitSlop={8} style={styles.actionBtn}>
    <StitchedBorder
      borderRadius={10}
      borderWidth={2}
      borderColor="rgba(92, 90, 88, 0.55)"
      style={styles.actionBtnInner}
    >
      <Text style={styles.actionGlyph}>{glyph}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </StitchedBorder>
  </Pressable>
);

const formatTimestamp = (ts) => {
  if (!ts) return '';
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

const HistorySavedEntryCard = observer(({
  artifactDomain = 'thought-reframe',
  artifactSnapshot,
  savedAtTimestamp,
  referentDate,
  optionalMoodRating,
  optionalTitleOrTheme,
  optionalSummaryFields,
  hasMoodRating = true,
  supportsShareExport = false,
  supportsEditOrBackfill = false,
  supportsRestoreOrBranch = false,
  onCardTap,
  onShare,
  onExport,
  onEditOrBackfill,
  onRestoreOrBranch,
}) => {
  const summary = optionalSummaryFields || (artifactSnapshot && typeof artifactSnapshot === 'object'
    ? Object.entries(artifactSnapshot).slice(0, 3).map(([k, v]) => ({ label: k, value: String(v) }))
    : []);

  return (
    <Pressable onPress={() => onCardTap && onCardTap({ artifactDomain, artifactSnapshot })}>
      <MinkyPanel borderRadius={14} padding={18} paddingTop={18} overlayColor="rgba(112, 68, 199, 0.2)">
        <View style={styles.headerRow}>
          <Text style={[styles.domain, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
            {artifactDomain.replace(/-/g, ' ').toUpperCase()}
          </Text>
          <Text style={[styles.date, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            {formatTimestamp(referentDate || savedAtTimestamp)}
          </Text>
        </View>
        {optionalTitleOrTheme ? (
          <Text style={[styles.theme, { fontSize: FontSettingsStore.getScaledFontSize(17) }]} numberOfLines={2}>
            {optionalTitleOrTheme}
          </Text>
        ) : null}
        {summary.length ? (
          <View style={styles.summaryList}>
            {summary.map((s, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                  {s.label}
                </Text>
                <Text style={[styles.summaryValue, { fontSize: FontSettingsStore.getScaledFontSize(14) }]} numberOfLines={3}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.footerRow}>
          {hasMoodRating && optionalMoodRating != null ? (
            <Text style={[styles.mood, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              mood {optionalMoodRating}/10
            </Text>
          ) : null}
          <View style={styles.actionsRow}>
            {supportsEditOrBackfill ? (
              <ActionButton glyph="✎" label="edit" onPress={onEditOrBackfill} />
            ) : null}
            {supportsShareExport ? (
              <>
                <ActionButton glyph="↗" label="share" onPress={onShare} />
                <ActionButton glyph="📄" label="export" onPress={onExport} />
              </>
            ) : null}
            {supportsRestoreOrBranch ? (
              <ActionButton glyph="↺" label="restore" onPress={onRestoreOrBranch} />
            ) : null}
          </View>
        </View>
      </MinkyPanel>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  domain: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  date: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  theme: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  summaryList: { gap: 6, marginTop: 8 },
  summaryRow: { gap: 1 },
  summaryLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  summaryValue: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 8, flexWrap: 'wrap' },
  mood: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flexShrink: 1 },
  actionBtn: {
    minWidth: 56, minHeight: 52,
    flexShrink: 0,
  },
  actionBtnInner: {
    flex: 0,
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 8, paddingVertical: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    gap: 2,
  },
  actionGlyph: {
    fontSize: 20,
    color: 'rgba(69, 67, 66, 0.85)',
  },
  actionLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 10,
    color: 'rgba(69, 67, 66, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default HistorySavedEntryCard;
