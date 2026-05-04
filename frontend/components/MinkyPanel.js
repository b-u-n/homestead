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
  shape = 'rect', // 'rect' | 'circular'
  size, // explicit width=height for circular shapes — otherwise aspectRatio:1 enforces square
  transparent = false, // true = invisible background, keeps stitched border only
}) => {
  // Circular mode: override borderRadius to 9999 for perfect circle
  if (shape === 'circular') {
    borderRadius = 9999;
    paddingTop = padding; // equal padding all around for circles
  }
  // Get theme color (uses flow context automatically)
  const effectiveColor = useMinkyColor(variant, overlayColor);
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  // Circular containers must be square — either via explicit size or aspectRatio fallback.
  const circularContainerStyle = shape === 'circular'
    ? (size != null
        ? { width: size, height: size }
        : { aspectRatio: 1 })
    : null;

  // When the panel is forced to a height (flex stretch from a split layout),
  // the overlay+stitched border should fill the container too — otherwise the
  // bare minky base color shows around the inner panel content.
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style || {});
  const fillToContainer = shape === 'circular' || flatStyle.flex > 0 || flatStyle.height != null;

  return (
    <View style={[styles.container, { borderRadius, backgroundColor: transparent ? 'transparent' : '#E8D4C8' }, circularContainerStyle, style]}>
      {/* Background texture */}
      {!transparent && Platform.OS === 'web' && (
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
            opacity: 0.39,
            transform: 'translate3d(0,0,0)', // Force GPU layer for mobile rendering
            WebkitBackfaceVisibility: 'hidden',
          }}
        />
      )}
      {!transparent && Platform.OS !== 'web' && (
        <ImageBackground
          source={slotBgImage}
          style={styles.bgImage}
          imageStyle={[styles.bgImageStyle, { borderRadius }]}
          resizeMode="repeat"
        />
      )}
      <View style={[
        styles.overlay,
        fillToContainer && styles.overlayFill,
        { backgroundColor: transparent ? 'transparent' : effectiveColor, padding: 4 + borderInset },
      ]}>
        <StitchedBorder
          borderRadius={borderRadius}
          borderColor={borderColor}
          style={[
            styles.border,
            fillToContainer && styles.borderFill,
            { padding, paddingTop },
          ]}
        >
          {children}
        </StitchedBorder>
      </View>
      {/* Emboss highlight/shadow border — skip when transparent */}
      {!transparent && (
        <View
          style={[
            styles.embossBorder,
            { borderRadius },
          ]}
          pointerEvents="none"
        />
      )}
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
    opacity: 0.39,
  },
  bgImageStyle: {
    opacity: 0.39,
  },
  overlay: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayFill: {
    flex: 1,
    alignSelf: 'stretch',
  },
  border: {
    width: '100%',
    overflow: 'visible',
  },
  borderFill: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
