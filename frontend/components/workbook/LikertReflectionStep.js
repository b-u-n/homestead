import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import ScrollBarView from '../ScrollBarView';

/**
 * LikertReflectionStep
 * Generates personalized reflection text based on a previous likert step's responses.
 * Each reflection can be a string or an array of strings (picks one randomly).
 *
 * Props from step definition:
 *   step.sourceStepId: 'assessment'
 *   step.items: same items array as the likert step
 *   step.reflections: {
 *     [itemId]: {
 *       1: ['variation 1', 'variation 2', ...] or 'single string',
 *       2: [...],
 *       3: [...]
 *     }
 *   }
 *
 * allResponses: full stepResponses object from WorkbookActivity
 */
const LikertReflectionStep = observer(({ step, allResponses }) => {
  const items = step.items || [];
  const reflections = step.reflections || {};
  const sourceData = allResponses?.[step.sourceStepId] || {};

  // Pick random variations once per render (stable via useMemo keyed on sourceData)
  const sentences = useMemo(() => {
    const result = [];
    for (const item of items) {
      const score = sourceData[item.id];
      const entry = reflections[item.id]?.[score];
      if (score > 0 && entry) {
        if (Array.isArray(entry)) {
          result.push(entry[Math.floor(Math.random() * entry.length)]);
        } else {
          result.push(entry);
        }
      }
    }
    return result;
  }, [JSON.stringify(sourceData)]);

  const total = Object.values(sourceData).reduce((sum, v) => sum + (v || 0), 0);

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        {sentences.length > 0 ? (
          <Text
            style={[
              styles.reflectionText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(15),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            {sentences.join(' ')}
          </Text>
        ) : (
          <Text
            style={[
              styles.reflectionText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(15),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            You rated everything at zero — that's a really good sign. Even on days that feel fine, it takes something to pause and check in with yourself like this.
          </Text>
        )}

        <Text
          style={[
            styles.scoreNote,
            {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#454342'),
            },
          ]}
        >
          Your anxiety level: {total} / 21
        </Text>
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
  reflectionText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 15,
    color: '#2D2C2B',
    lineHeight: 26,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scoreNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 13,
    color: '#454342',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default LikertReflectionStep;
