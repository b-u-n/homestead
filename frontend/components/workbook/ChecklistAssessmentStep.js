import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';
import Checkbox from '../primitives/Checkbox';

/**
 * ChecklistAssessmentStep
 * Checkbox list with scoring and interpretation. Each item supports:
 *   - text (legacy) OR title (preferred)
 *   - description (optional secondary line)
 *   - examples (optional array of short concrete examples)
 *
 * Scoring counts checked items, matched against `step.scoring.thresholds`.
 */
const ChecklistAssessmentStep = observer(({ step, value, onChange }) => {
  const items = step.items || [];
  const scoring = step.scoring || {};
  const thresholds = scoring.thresholds || [];

  const checked = value?.checked || [];
  const score = checked.length;

  const findInterpretation = (s) => {
    for (const t of thresholds) {
      if (s >= t.min && s <= t.max) return t.interpretation;
    }
    return null;
  };

  const handleToggle = (itemId) => {
    const newChecked = checked.includes(itemId)
      ? checked.filter(id => id !== itemId)
      : [...checked, itemId];

    const newScore = newChecked.length;
    onChange({
      checked: newChecked,
      score: newScore,
      interpretation: findInterpretation(newScore),
    });
  };

  const interpretation = findInterpretation(score);

  // Allow either `title` (preferred) or `text` (legacy) for the main label.
  const itemTitle = (it) => it.title || it.text || '';

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        {items.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <Checkbox
              key={item.id}
              checked={isChecked}
              onToggle={() => handleToggle(item.id)}
              title={itemTitle(item)}
              description={item.description}
              examples={item.examples}
            />
          );
        })}

        {score > 0 ? (
          <View style={styles.scorePanelWrap}>
            <MinkyPanel
              borderRadius={10}
              padding={14}
              paddingTop={14}
              overlayColor="rgba(135, 180, 210, 0.35)"
            >
              <Text
                style={[
                  styles.scoreLabel,
                  {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#5C5A58'),
                  },
                ]}
              >
                You identified
              </Text>
              <Text
                style={[
                  styles.scoreNumber,
                  {
                    fontSize: FontSettingsStore.getScaledFontSize(28),
                    color: FontSettingsStore.getFontColor('#2D2C2B'),
                  },
                ]}
              >
                {score} of {items.length}
              </Text>
              {interpretation ? (
                <Text
                  style={[
                    styles.interpretationText,
                    {
                      fontSize: FontSettingsStore.getScaledFontSize(14),
                      color: FontSettingsStore.getFontColor('#2D2C2B'),
                    },
                  ]}
                >
                  {interpretation}
                </Text>
              ) : null}
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
    gap: 6,
  },
  scorePanelWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  scoreLabel: {
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
    marginTop: 2,
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
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

export default ChecklistAssessmentStep;
