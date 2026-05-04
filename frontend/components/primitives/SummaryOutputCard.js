import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';

/**
 * summary-output-card — post-flow summary surface.
 * Spec: ../_meta-canonical/summary-output-card.json
 */
const SummaryOutputCard = observer(({
  kind = 'compiled-plan-artifact-card',
  title,
  computedScore,
  severityBand,
  interpretationCopy,
  sections,
  metrics,
  closingPromptText,
  emptyStateCopy,
  resumeAvailable = false,
  exportableOrShareable = false,
  tapToEditJumpback = false,
  ctaLabel,
  onResultsRevealed,
  onNextStepCtaTapped,
  onSectionEditRequested,
  onPlanSaved,
  onShuffleTapped,
  onReviewMissedTapped,
  onRetryNeedPracticeTapped,
  onResumeTapped,
  onRestartTapped,
  onQuickLogTapped,
}) => {
  React.useEffect(() => { onResultsRevealed && onResultsRevealed({ kind }); }, []);

  const severityColor = (() => {
    if (!severityBand) return 'rgba(112, 68, 199, 0.2)';
    const b = severityBand.toLowerCase();
    if (b.includes('minimal')) return 'rgba(160, 200, 140, 0.4)';
    if (b.includes('mild')) return 'rgba(180, 200, 130, 0.4)';
    if (b.includes('moderate')) return 'rgba(220, 165, 75, 0.4)';
    if (b.includes('severe')) return 'rgba(220, 130, 130, 0.4)';
    return 'rgba(112, 68, 199, 0.2)';
  })();

  // Empty state
  if (kind === 'empty-state-non-punitive') {
    return (
      <MinkyPanel borderRadius={14} padding={16} paddingTop={16} overlayColor="rgba(100, 130, 195, 0.25)">
        <Text style={[styles.emptyTitle, { fontSize: FontSettingsStore.getScaledFontSize(16) }]}>
          {title || 'Nothing yet — and that\'s okay.'}
        </Text>
        <Text style={[styles.emptyCopy, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {emptyStateCopy || 'Whenever you\'re ready, your first entry will land here.'}
        </Text>
        <View style={styles.actionRow}>
          {resumeAvailable ? (
            <WoolButton variant="purple" size="small" onPress={() => onResumeTapped && onResumeTapped()}>
              <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>Resume</Text>
            </WoolButton>
          ) : null}
          <WoolButton variant="secondary" size="small" onPress={() => onQuickLogTapped && onQuickLogTapped()}>
            <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>Quick log</Text>
          </WoolButton>
        </View>
      </MinkyPanel>
    );
  }

  // Assessment results
  if (kind === 'assessment-results-panel') {
    return (
      <MinkyPanel borderRadius={14} padding={16} paddingTop={16} overlayColor={severityColor}>
        <Text style={[styles.scoreLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>SCORE</Text>
        <Text style={[styles.scoreNumber, { fontSize: FontSettingsStore.getScaledFontSize(34) }]}>
          {computedScore}
        </Text>
        {severityBand ? (
          <Text style={[styles.severity, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {severityBand}
          </Text>
        ) : null}
        {interpretationCopy ? (
          <Text style={[styles.interpretation, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {interpretationCopy}
          </Text>
        ) : null}
        {ctaLabel ? (
          <View style={{ marginTop: 12, alignSelf: 'center' }}>
            <WoolButton variant="purple" size="medium" onPress={() => onNextStepCtaTapped && onNextStepCtaTapped()}>
              <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>{ctaLabel}</Text>
            </WoolButton>
          </View>
        ) : null}
      </MinkyPanel>
    );
  }

  // Toolkit row preview / end-of-deck — compact
  if (kind === 'toolkit-row-preview' || kind === 'end-of-deck-completion-screen') {
    return (
      <MinkyPanel borderRadius={12} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
        <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
          {title || 'Deck complete'}
        </Text>
        {metrics ? (
          <View style={styles.metricRow}>
            {Object.entries(metrics).map(([k, v]) => (
              <Text key={k} style={[styles.metricCell, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                <Text style={styles.metricLabel}>{k}: </Text>
                <Text style={styles.metricValue}>{v}</Text>
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.actionRow}>
          <WoolButton variant="secondary" size="small" onPress={() => onShuffleTapped && onShuffleTapped()}>
            <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>Shuffle</Text>
          </WoolButton>
          <WoolButton variant="secondary" size="small" onPress={() => onReviewMissedTapped && onReviewMissedTapped()}>
            <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>Review missed</Text>
          </WoolButton>
          <WoolButton variant="secondary" size="small" onPress={() => onRetryNeedPracticeTapped && onRetryNeedPracticeTapped()}>
            <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>Retry</Text>
          </WoolButton>
        </View>
      </MinkyPanel>
    );
  }

  // Default: compiled plan / synthesis / retrospective
  return (
    <MinkyPanel borderRadius={14} padding={14} paddingTop={14} overlayColor="rgba(112, 68, 199, 0.2)">
      <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(16) }]}>
        {title}
      </Text>
      {sections?.length ? (
        <View style={styles.sectionList}>
          {sections.map((sec, i) => (
            <Pressable
              key={i}
              onPress={() => tapToEditJumpback && onSectionEditRequested && onSectionEditRequested({ stepId: sec.stepId ?? i })}
              disabled={!tapToEditJumpback}
              style={styles.sectionRow}
            >
              <Text style={[styles.sectionLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                {sec.label}
              </Text>
              <Text style={[styles.sectionValue, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                {sec.value}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {closingPromptText ? (
        <Text style={[styles.closing, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {closingPromptText}
        </Text>
      ) : null}
      <View style={styles.actionRow}>
        {ctaLabel ? (
          <WoolButton variant="purple" size="medium" onPress={() => { onPlanSaved && onPlanSaved(); onNextStepCtaTapped && onNextStepCtaTapped(); }}>
            <Text style={[styles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{ctaLabel}</Text>
          </WoolButton>
        ) : null}
      </View>
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scoreLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textAlign: 'center',
    letterSpacing: 1.4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scoreNumber: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  severity: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  interpretation: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionList: { gap: 8, marginTop: 10 },
  sectionRow: { gap: 2 },
  sectionLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionValue: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  closing: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#454342',
    marginTop: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btnLabel: {
    fontFamily: 'NeedleworkGood',
    fontWeight: '700',
    color: '#403F3E',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyCopy: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  metricRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' },
  metricCell: {
    fontFamily: 'Comfortaa',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  metricLabel: { fontWeight: '600', color: '#454342' },
  metricValue: { fontWeight: '700', color: '#2D2C2B' },
});

export default SummaryOutputCard;
