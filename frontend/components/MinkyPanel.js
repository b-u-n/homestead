import React from 'react';
import { View, StyleSheet, Platform, ImageBackground } from 'react-native';
import StitchedBorder from './StitchedBorder';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const MinkyPanel = ({
  children,
  style = {},
  borderRadius = 20,
  overlayColor = 'rgba(222, 134, 223, 0.25)',
  borderColor,
  padding = 20,
  paddingTop = 25,
}) => {
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
            backgroundSize: '40%',
            borderRadius: borderRadius,
            pointerEvents: 'none',
            opacity: 0.8,
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
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <StitchedBorder borderRadius={borderRadius} borderColor={borderColor} style={[styles.border, { padding, paddingTop }]}>
          {children}
        </StitchedBorder>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
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
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    width: '100%',
    overflow: 'visible',
  },
});

export default MinkyPanel;
