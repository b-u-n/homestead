import React from 'react';
import { View, StyleSheet, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useMinkyColor } from '../hooks/useTheme';
import uxStore from '../stores/UXStore';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

/**
 * StitchedFillBar — continuous-fill version of StitchedProgressBar.
 * Same texture+overlay+stitched layering, single fill from 0 to `progress * 100%`.
 *
 * Props:
 *  - progress: 0..1
 *  - height: bar height (default 18)
 *  - fillColor: color of the filled portion
 *  - borderRadius: outer corner radius (default 9, ~ height/2 for pill ends)
 */
const StitchedFillBar = observer(({
  progress = 0,
  height = 18,
  fillColor = 'rgba(135, 180, 210, 0.65)',
  borderRadius = 9,
}) => {
  const overlayColor = useMinkyColor('primary', 'rgba(112, 68, 199, 0.15)');
  const isMobile = uxStore.isMobile || uxStore.isPortrait;
  const pct = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.container, { height, borderRadius }]}>
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
            borderRadius,
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
          imageStyle={[styles.bgImageStyle, { borderRadius }]}
          resizeMode="repeat"
        />
      )}

      {/* Color overlay */}
      <View style={[styles.overlay, { backgroundColor: overlayColor, borderRadius }]} />

      {/* Continuous fill */}
      {pct > 0 && (
        <View
          style={[
            styles.fill,
            {
              width: `${pct * 100}%`,
              backgroundColor: fillColor,
              borderTopLeftRadius: borderRadius,
              borderBottomLeftRadius: borderRadius,
              borderTopRightRadius: pct >= 1 ? borderRadius : 0,
              borderBottomRightRadius: pct >= 1 ? borderRadius : 0,
            },
          ]}
        />
      )}

      {/* Stitched dashed border */}
      <View style={[styles.stitch, { borderRadius }]} pointerEvents="none" />

      {/* Emboss highlight/shadow */}
      <View style={[styles.emboss, { borderRadius }]} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8D4C8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    opacity: 0.8,
  },
  bgImageStyle: { opacity: 0.8 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  fill: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
  },
  stitch: {
    position: 'absolute',
    top: -0.5, left: -0.5, right: -0.5, bottom: -0.5,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.55)',
  },
  emboss: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, borderLeftWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightWidth: 1, borderBottomWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
});

export default StitchedFillBar;
