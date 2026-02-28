import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import WoolButton from '../WoolButton';

/**
 * RatingStep
 * Single numeric rating with labeled endpoints (0-10 or configurable range).
 * Uses WoolButton for each number with focused state for selection.
 */
const RatingStep = observer(({ step, value, onChange }) => {
  const min = step.min ?? 0;
  const max = step.max ?? 10;
  const labels = step.labels || {};

  const numbers = [];
  for (let i = min; i <= max; i++) {
    numbers.push(i);
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        {numbers.map((num) => {
          const isSelected = value === num;
          return (
            <View key={num} style={styles.buttonWrapper}>
              <WoolButton
                onPress={() => onChange(num)}
                variant="purple"
                size="small"
                focused={isSelected}
              >
                {String(num)}
              </WoolButton>
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {labels.min ? (
          <Text
            style={[
              styles.label,
              {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#454342'),
              },
            ]}
          >
            {labels.min}
          </Text>
        ) : <View />}
        {labels.max ? (
          <Text
            style={[
              styles.label,
              {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#454342'),
              },
            ]}
          >
            {labels.max}
          </Text>
        ) : <View />}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  buttonWrapper: {
    minWidth: 44,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 13,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default RatingStep;
