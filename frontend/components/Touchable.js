import React from 'react';
import { Pressable, ImageBackground, View, StyleSheet, Platform } from 'react-native';
import StitchedBorder from './StitchedBorder';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

/**
 * Touchable component with minky purple background texture
 * Used for image-based buttons and interactive elements
 */
const Touchable = ({
  onPress,
  children,
  disabled,
  style,
  overlayColor = 'rgba(222, 134, 223, 0.25)',
  borderRadius = 8,
  borderWidth = 2,
  borderColor = 'rgba(92, 90, 88, 0.3)',
  ...props
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pressable,
        {
          borderRadius,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
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
            borderRadius,
            pointerEvents: 'none',
            opacity: 0.8,
          }}
        />
      )}
      {Platform.OS !== 'web' && (
        <ImageBackground
          source={slotBgImage}
          style={styles.bgImage}
          imageStyle={{ opacity: 0.8, borderRadius: borderRadius - 2 }}
          resizeMode="repeat"
        />
      )}

      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <StitchedBorder
          borderRadius={borderRadius}
          borderWidth={borderWidth}
          borderColor={borderColor}
        >
          {children}
        </StitchedBorder>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    position: 'relative',
    overflow: 'hidden',
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
  },
  overlay: {
    width: '100%',
    height: '100%',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Touchable;
