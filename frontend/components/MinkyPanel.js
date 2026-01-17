import React from 'react';
import { View, StyleSheet, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import StitchedBorder from './StitchedBorder';
import { useMinkyColor } from '../hooks/useTheme';
import uxStore from '../stores/UXStore';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const MinkyPanel = observer(({
  children,
  style = {},
  borderRadius = 20,
  overlayColor,
  variant = 'primary',
  borderColor,
  padding = 20,
  paddingTop = 25,
  borderInset = 0,
}) => {
  // Get theme color (uses flow context automatically)
  const effectiveColor = useMinkyColor(variant, overlayColor);
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  return (
    <View style={[styles.container, { borderRadius }, style]}>
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
            borderRadius: borderRadius,
            pointerEvents: 'none',
            opacity: 0.8,
            transform: 'translate3d(0,0,0)', // Force GPU layer for mobile rendering
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
      <View style={[styles.overlay, { backgroundColor: effectiveColor, padding: 4 + borderInset }]}>
        <StitchedBorder borderRadius={borderRadius} borderColor={borderColor} style={[styles.border, { padding, paddingTop }]}>
          {children}
        </StitchedBorder>
      </View>
      {/* Emboss highlight/shadow border */}
      <View
        style={[
          styles.embossBorder,
          { borderRadius },
        ]}
        pointerEvents="none"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#E8D4C8', // Solid minky base color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    width: '100%',
    overflow: 'visible',
  },
  embossBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

export default MinkyPanel;
