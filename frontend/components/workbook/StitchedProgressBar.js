import React from 'react';
import { View, StyleSheet, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useMinkyColor } from '../../hooks/useTheme';
import uxStore from '../../stores/UXStore';

const slotBgImage = require('../../assets/images/slot-bg-2.jpeg');

/**
 * StitchedProgressBar
 * Textured container with a row of stitched step segments inside.
 * Filled segments get a color overlay; unfilled are transparent.
 */
const StitchedProgressBar = observer(({ progress = 0, steps = 1, fillColor = 'rgba(135, 180, 210, 0.5)' }) => {
  const overlayColor = useMinkyColor('primary', 'rgba(112, 68, 199, 0.15)');
  const isMobile = uxStore.isMobile || uxStore.isPortrait;
  const filledSteps = Math.round(Math.min(Math.max(progress, 0), 1) * steps);

  return (
    <View style={styles.container}>
      {/* Background texture */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
            backgroundRepeat: 'repeat',
            backgroundSize: isMobile ? '80%' : '40%',
            borderRadius: 8,
            pointerEvents: 'none',
            opacity: 0.8,
            transform: 'translate3d(0,0,0)',
            WebkitBackfaceVisibility: 'hidden',
          }}
        />
      )}
      {Platform.OS !== 'web' && (
        <ImageBackground
          source={slotBgImage}
          style={styles.bgImage}
          imageStyle={[styles.bgImageStyle, { borderRadius: 8 }]}
          resizeMode="repeat"
        />
      )}

      {/* Color overlay */}
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />

      {/* Step segments */}
      <View style={styles.segmentRow}>
        {Array.from({ length: steps }).map((_, i) => {
          const isFilled = i < filledSteps;
          const isFirst = i === 0;
          const isLast = i === steps - 1;
          const endRadius = isFirst
            ? { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }
            : isLast
              ? { borderTopRightRadius: 4, borderBottomRightRadius: 4 }
              : null;
          return (
            <View key={i} style={[styles.segment, endRadius]}>
              {isFilled && (
                <View style={[styles.segmentFill, { backgroundColor: fillColor }]} />
              )}
              <View style={[styles.segmentStitch, endRadius]} pointerEvents="none" />
              <View style={[styles.segmentEmboss, endRadius]} pointerEvents="none" />
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#E8D4C8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  bgImageStyle: {
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 0,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 18,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(92, 90, 88, 0.08)',
  },
  segmentFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  segmentStitch: {
    position: 'absolute',
    top: -0.5,
    left: -0.5,
    right: -0.5,
    bottom: -0.5,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.55)',
    borderRadius: 0,
  },
  segmentEmboss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
});

export default StitchedProgressBar;
