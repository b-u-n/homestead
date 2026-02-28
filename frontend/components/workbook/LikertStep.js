import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

/**
 * LikertStep
 * Multiple items each rated on the same scale.
 * Each item in a MinkyPanel card, scale options as MinkyPanel pills.
 */
const LikertStep = observer(({ step, value, onChange }) => {
  const items = step.items || [];
  const scale = step.scale || [];
  const responses = value || {};

  const handleItemRate = (itemId, scaleValue) => {
    onChange({ ...responses, [itemId]: scaleValue });
  };

  const total = Object.values(responses).reduce((sum, v) => sum + (v || 0), 0);
  const answeredCount = Object.keys(responses).length;

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text
              style={[
                styles.itemText,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(16),
                  color: FontSettingsStore.getFontColor('#2D2C2B'),
                },
              ]}
            >
              {item.text}
            </Text>
            <View style={styles.scaleRow}>
              {scale.map((option) => {
                const isSelected = responses[item.id] === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={styles.scaleOption}
                    onPress={() => handleItemRate(item.id, option.value)}
                  >
                    <MinkyPanel
                      borderRadius={6}
                      padding={6}
                      paddingTop={6}
                      overlayColor={isSelected
                        ? 'rgba(135, 180, 210, 0.55)'
                        : 'rgba(100, 130, 195, 0.25)'
                      }
                      borderColor={isSelected
                        ? 'rgba(92, 90, 88, 0.55)'
                        : undefined
                      }
                    >
                      <Text
                        style={[
                          styles.scaleValue,
                          isSelected && styles.scaleValueSelected,
                          { fontSize: FontSettingsStore.getScaledFontSize(15) },
                        ]}
                      >
                        {option.value}
                      </Text>
                      <Text
                        style={[
                          styles.scaleLabel,
                          isSelected && styles.scaleLabelSelected,
                          { fontSize: FontSettingsStore.getScaledFontSize(9) },
                        ]}
                        numberOfLines={2}
                      >
                        {option.label}
                      </Text>
                    </MinkyPanel>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text
            style={[
              styles.totalText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(16),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            Total: {total} ({answeredCount}/{items.length} answered)
          </Text>
        </View>
      </View>
    </ScrollBarView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
  },
  itemBlock: {
    gap: 0,
    paddingBottom: 14,
  },
  itemText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 16,
    color: '#2D2C2B',
    marginBottom: 10,
    lineHeight: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scaleOption: {
    flex: 1,
  },
  scaleValue: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 15,
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scaleValueSelected: {
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
  },
  scaleLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 9,
    color: '#454342',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scaleLabelSelected: {
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
  },
  totalText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 16,
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default LikertStep;
