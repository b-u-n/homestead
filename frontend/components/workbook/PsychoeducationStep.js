import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

/**
 * PsychoeducationStep
 * Read-only educational content — no user input, just "Next" to continue.
 * Used by 13 of 20 activities (most common step type).
 *
 * Props from step definition:
 *   step.content: [
 *     { type: 'heading', text: '...' },
 *     { type: 'paragraph', text: '...' },
 *     { type: 'bullets', items: ['...', '...'] },
 *     { type: 'callout', text: '...' }
 *   ]
 */
const PsychoeducationStep = observer(({ step, value, onChange }) => {
  const content = step.content || [];

  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'heading':
        return (
          <Text
            key={index}
            style={[
              styles.heading,
              {
                fontSize: FontSettingsStore.getScaledFontSize(18),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            {block.text}
          </Text>
        );

      case 'paragraph':
        return (
          <Text
            key={index}
            style={[
              styles.paragraph,
              {
                fontSize: FontSettingsStore.getScaledFontSize(16),
                color: FontSettingsStore.getFontColor('#454342'),
              },
            ]}
          >
            {block.text}
          </Text>
        );

      case 'bullets':
        return (
          <View key={index} style={styles.bulletList}>
            {(block.items || []).map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text
                  style={[
                    styles.bulletDot,
                    { color: FontSettingsStore.getFontColor('#7044C7') },
                  ]}
                >
                  {'\u2022'}
                </Text>
                <Text
                  style={[
                    styles.bulletText,
                    {
                      fontSize: FontSettingsStore.getScaledFontSize(16),
                      color: FontSettingsStore.getFontColor('#454342'),
                    },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        );

      case 'callout':
        return (
          <MinkyPanel
            key={index}
            borderRadius={8}
            padding={12}
            paddingTop={12}
            overlayColor="rgba(112, 68, 199, 0.12)"
          >
            <Text
              style={[
                styles.calloutText,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(16),
                  color: FontSettingsStore.getFontColor('#2D2C2B'),
                },
              ]}
            >
              {block.text}
            </Text>
          </MinkyPanel>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.contentWrapper}>
        {content.map(renderBlock)}
      </View>
    </ScrollBarView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    gap: 12,
  },
  heading: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 18,
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    marginTop: 4,
  },
  paragraph: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#454342',
    lineHeight: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bulletList: {
    gap: 6,
    paddingLeft: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    color: '#7044C7',
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#454342',
    lineHeight: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  calloutText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    lineHeight: 24,
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PsychoeducationStep;
