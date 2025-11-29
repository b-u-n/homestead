import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ImageBackground, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import StitchedBorder from './StitchedBorder';

const buttonBgImage = require('../assets/images/button-bg.png');

// WoolButton is an alias for VaporwaveButton - the "wool" style
// This is the standard textured button with stitched border
const VaporwaveButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style = {},
  textStyle = {},
  accessibilityLabel,
  accessibilityHint
}) => {
  const getOverlayColor = () => {
    if (disabled) return 'rgba(68, 71, 90, 0.21)';

    // Single color overlays (no gradient split)
    // 'wool' is an alias for 'primary' - the default wool style
    switch (variant) {
      case 'wool':
      case 'primary':
        return 'rgba(222, 134, 223, 0.25)'; // Mid pink/purple
      case 'secondary':
        return 'rgba(179, 230, 255, 0.25)'; // Sky blue
      case 'accent':
        return 'rgba(248, 217, 124, 0.15)'; // Mid yellow/orange
      case 'blue':
        return 'rgba(179, 230, 255, 0.25)'; // Sky blue
      case 'green':
        return 'rgba(110, 200, 130, 0.32)'; // Forest green (complementary to purple)
      case 'blurple':
      case 'discord':
        return 'rgba(130, 140, 255, 0.35)'; // Discord blurple (pastel)
      case 'coral':
        return 'rgba(255, 160, 130, 0.35)'; // Warm coral/peach
      case 'candy':
      case 'maxine':
        return 'rgba(200, 75, 95, 0.45)'; // Bright rosy pink (deeper)
      default:
        return 'rgba(222, 134, 223, 0.25)';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <View style={styles.backgroundImage}>
        {Platform.OS === 'web' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '28%',
              borderRadius: 8,
              pointerEvents: 'none',
              opacity: 0.8,
            }}
          />
        )}
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={buttonBgImage}
            style={styles.backgroundImageNative}
            imageStyle={styles.imageStyle}
            resizeMode="repeat"
          />
        )}
        <View
          style={[styles.overlay, { backgroundColor: getOverlayColor() }]}
        >
          <StitchedBorder paddingHorizontal={26} paddingVertical={11}>
            <Text
              style={[
                styles.text,
                textStyle,
                Platform.OS === 'web' && {
                  textShadow: '0 -1px 0 rgba(0, 0, 0, 0.36)',
                }
              ]}
            >
              {title}
            </Text>
          </StitchedBorder>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: Colors.vaporwave.pink,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backgroundImage: {
    position: 'relative',
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundImageNative: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  imageStyle: {
    borderRadius: 8,
  },
  overlay: {
    width: '100%',
    height: '100%',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Typography.fonts.needleworkGood,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(69, 67, 64, 0.55)',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.36)',
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 0,
  },
});

// WoolButton is an alias for VaporwaveButton
export const WoolButton = VaporwaveButton;
export default VaporwaveButton;