import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * PrimitiveFrame
 * Showcase wrapper for a single primitive — header (meta_id),
 * one-line description, and a stack of variant demonstration rows
 * (each row in its own MinkyPanel for isolation).
 */
const PrimitiveFrame = observer(({ metaId, description, children }) => {
  const variants = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.frame}>
      <View style={styles.headerBlock}>
        <Text
          style={[
            styles.metaId,
            { fontSize: FontSettingsStore.getScaledFontSize(13) },
          ]}
        >
          {metaId}
        </Text>
        {description ? (
          <Text
            style={[
              styles.description,
              {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#454342'),
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.variantStack}>
        {variants.map((child, i) => (
          <MinkyPanel
            key={i}
            borderRadius={12}
            padding={14}
            paddingTop={14}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            <View style={styles.variantInner}>{child}</View>
          </MinkyPanel>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    gap: 10,
  },
  headerBlock: {
    gap: 2,
    paddingHorizontal: 4,
  },
  metaId: {
    fontFamily: Platform.select({ web: 'ui-monospace, SFMono-Regular, Menlo, monospace', default: 'Courier' }),
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  variantStack: {
    gap: 10,
  },
  variantInner: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default PrimitiveFrame;
