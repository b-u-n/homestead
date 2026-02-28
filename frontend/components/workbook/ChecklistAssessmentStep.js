import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import { Text as WoolText } from '../ButtonBase';
import ScrollBarView from '../ScrollBarView';

/**
 * ChecklistAssessmentStep
 * Checkbox list with scoring and interpretation.
 * Each item is a WoolButton (focused when checked), interpretation in MinkyPanel.
 */
const ChecklistAssessmentStep = observer(({ step, value, onChange }) => {
  const items = step.items || [];
  const scoring = step.scoring || {};
  const thresholds = scoring.thresholds || [];

  const checked = value?.checked || [];
  const score = checked.length;

  const getInterpretation = () => {
    for (const t of thresholds) {
      if (score >= t.min && score <= t.max) {
        return t.interpretation;
      }
    }
    return null;
  };

  const handleToggle = (itemId) => {
    const newChecked = checked.includes(itemId)
      ? checked.filter(id => id !== itemId)
      : [...checked, itemId];

    const newScore = newChecked.length;
    let interpretation = null;
    for (const t of thresholds) {
      if (newScore >= t.min && newScore <= t.max) {
        interpretation = t.interpretation;
        break;
      }
    }

    onChange({ checked: newChecked, score: newScore, interpretation });
  };

  const interpretation = getInterpretation();

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        {items.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <WoolButton
              key={item.id}
              onPress={() => handleToggle(item.id)}
              variant="purple"
              size="small"
              focused={isChecked}
              contentStyle={styles.itemContent}
            >
              <View style={styles.itemRow}>
                <View style={[styles.checkIndicator, isChecked && styles.checkIndicatorChecked]}>
                  {isChecked && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                </View>
                <WoolText style={styles.itemText}>{item.text}</WoolText>
              </View>
            </WoolButton>
          );
        })}

        {/* Score counter */}
        <Text
          style={[
            styles.scoreText,
            {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342'),
            },
          ]}
        >
          {score} of {items.length} checked
        </Text>

        {/* Interpretation */}
        {interpretation && score > 0 && (
          <MinkyPanel
            borderRadius={8}
            padding={12}
            paddingTop={12}
            overlayColor="rgba(112, 68, 199, 0.15)"
          >
            <Text
              style={[
                styles.interpretationText,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(16),
                  color: FontSettingsStore.getFontColor('#2D2C2B'),
                },
              ]}
            >
              {interpretation}
            </Text>
          </MinkyPanel>
        )}
      </View>
    </ScrollBarView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  checkIndicator: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.55)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndicatorChecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  checkmark: {
    color: '#2D2C2B',
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    textAlign: 'left',
  },
  scoreText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 14,
    color: '#454342',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  interpretationText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ChecklistAssessmentStep;
