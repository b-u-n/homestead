import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

/**
 * AssessmentResultsStep
 * Read-only score panel that reads from a previous checklist-assessment step
 * (`step.sourceStepId`) and displays the score + interpretation in a polished
 * results card. Designed to close out an assessment activity.
 *
 * Source step is expected to have shape: { checked: string[], score: number,
 * interpretation: string }.
 */
const AssessmentResultsStep = observer(({ step, allResponses }) => {
  const sourceData = (step.sourceStepId && allResponses) ? allResponses[step.sourceStepId] : null;
  const checked = sourceData?.checked || [];
  const score = typeof sourceData?.score === 'number' ? sourceData.score : checked.length;
  const interpretation = sourceData?.interpretation || null;

  // Optionally find the items list from the source step config so we can show titles back.
  // The renderer doesn't pass the source step config, so we surface only what's in stepData.

  const total = step.total || step.outOf || null;
  const outOfLabel = step.outOfLabel
    ? step.outOfLabel.replace('{total}', total != null ? String(total) : '')
    : null;
  const scoreLabel = step.scoreLabel || 'Your score';

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        <MinkyPanel
          borderRadius={12}
          padding={20}
          paddingTop={20}
          overlayColor="rgba(135, 180, 210, 0.45)"
        >
          <Text
            style={[
              styles.label,
              {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#5C5A58'),
              },
            ]}
          >
            {scoreLabel}
          </Text>
          <Text
            style={[
              styles.scoreNumber,
              {
                fontSize: FontSettingsStore.getScaledFontSize(48),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            {score}
          </Text>
          {outOfLabel ? (
            <Text
              style={[
                styles.outOf,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(13),
                  color: FontSettingsStore.getFontColor('#5C5A58'),
                },
              ]}
            >
              {outOfLabel}
            </Text>
          ) : null}
        </MinkyPanel>

        {interpretation ? (
          <View style={styles.interpretationWrap}>
            <MinkyPanel
              borderRadius={10}
              padding={14}
              paddingTop={14}
              overlayColor="rgba(112, 68, 199, 0.2)"
            >
              <Text
                style={[
                  styles.interpretationText,
                  {
                    fontSize: FontSettingsStore.getScaledFontSize(15),
                    color: FontSettingsStore.getFontColor('#2D2C2B'),
                  },
                ]}
              >
                {interpretation}
              </Text>
            </MinkyPanel>
          </View>
        ) : null}
      </View>
    </ScrollBarView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scoreNumber: {
    fontFamily: 'ChubbyTrail',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  outOf: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  interpretationWrap: {
    alignSelf: 'stretch',
  },
  interpretationText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default AssessmentResultsStep;
