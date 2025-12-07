import React, { createContext, useContext } from 'react';
import { TouchableOpacity, Text as RNText, View, StyleSheet, ImageBackground, Platform } from 'react-native';
import StitchedBorder from './StitchedBorder';
import { Typography } from '../constants/typography';

const woolBgImage = require('../assets/images/button-bg.png');
const minkyBgImage = require('../assets/images/slot-bg-2.jpeg');

// Text styles per texture
const textStyles = {
  wool: {
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
  minky: {
    fontFamily: Typography.fonts.body,
    fontSize: 18,
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
  },
};

// Context to pass texture down to Text components
const ButtonTextureContext = createContext('wool');

/**
 * Text component for use inside buttons - automatically styled based on button texture
 */
export const Text = ({ style, children, ...props }) => {
  const texture = useContext(ButtonTextureContext);
  const baseStyle = textStyles[texture] || textStyles.wool;
  const webShadow = texture === 'wool' && Platform.OS === 'web'
    ? { textShadow: '0 -1px 0 rgba(0, 0, 0, 0.36)' }
    : null;

  return (
    <RNText style={[baseStyle, webShadow, style]} {...props}>
      {children}
    </RNText>
  );
};

/**
 * ButtonBase - Unified button component with textured background
 *
 * Supports two textures:
 * - 'wool': Fuzzy wool texture (default)
 * - 'minky': Soft minky/slot texture
 *
 * Children can be:
 * - String: Rendered as text with default styling
 * - React elements: Rendered as-is (images, icons, custom layouts)
 *
 * @example
 * // Text only
 * <ButtonBase onPress={fn}>Submit</ButtonBase>
 *
 * @example
 * // Image and text
 * <ButtonBase onPress={fn}>
 *   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
 *     <Image source={icon} style={{ width: 24, height: 24 }} />
 *     <Text>Submit</Text>
 *   </View>
 * </ButtonBase>
 *
 * @example
 * // Image only (square button)
 * <ButtonBase onPress={fn} aspectRatio={1}>
 *   <Image source={icon} style={{ width: 100, height: 100 }} />
 * </ButtonBase>
 */
const ButtonBase = ({
  children,
  onPress,
  texture = 'wool',
  variant = 'primary',
  disabled = false,
  style = {},
  contentStyle = {},
  aspectRatio,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const bgImage = texture === 'minky' ? minkyBgImage : woolBgImage;
  const bgSize = texture === 'minky' ? '80px' : '60px';

  const getOverlayColor = () => {
    if (disabled) return 'rgba(68, 71, 90, 0.21)';

    switch (variant) {
      case 'primary':
        return 'rgba(222, 134, 223, 0.25)';
      case 'secondary':
        return 'rgba(179, 230, 255, 0.25)';
      case 'purple':
        return 'rgba(112, 68, 199, 0.2)';
      case 'blue':
        return 'rgba(179, 230, 255, 0.25)';
      case 'green':
        return 'rgba(110, 200, 130, 0.32)';
      case 'coral':
        return 'rgba(255, 160, 130, 0.35)';
      case 'discord':
      case 'blurple':
        return 'rgba(130, 140, 255, 0.35)';
      default:
        return 'rgba(222, 134, 223, 0.25)';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'primary':
        return 'rgba(92, 90, 88, 0.3)';
      case 'secondary':
        return 'rgba(179, 230, 255, 0.5)';
      case 'purple':
        return 'rgba(112, 68, 199, 0.4)';
      case 'blue':
        return 'rgba(179, 230, 255, 0.5)';
      default:
        return 'rgba(92, 90, 88, 0.3)';
    }
  };

  // Check if children is a string to apply default text styling
  const isTextContent = typeof children === 'string';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        aspectRatio && { aspectRatio },
        style,
      ]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isTextContent ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <View style={[styles.backgroundWrapper, { opacity: disabled ? 0.5 : 1 }]}>
        {/* Background texture */}
        {Platform.OS === 'web' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${typeof bgImage === 'string' ? bgImage : bgImage.default || bgImage.uri || bgImage})`,
              backgroundRepeat: 'repeat',
              backgroundSize: bgSize,
              borderRadius: 8,
              pointerEvents: 'none',
              opacity: 0.8,
            }}
          />
        )}
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={bgImage}
            style={styles.bgImageNative}
            imageStyle={styles.bgImageStyle}
            resizeMode="repeat"
          />
        )}

        {/* Color overlay */}
        <View style={[styles.overlay, { backgroundColor: getOverlayColor() }]}>
          <StitchedBorder
            borderRadius={8}
            borderWidth={2}
            borderColor={getBorderColor()}
            paddingHorizontal={isTextContent ? 20 : 12}
            paddingVertical={isTextContent ? 12 : 12}
            style={contentStyle}
          >
            <ButtonTextureContext.Provider value={texture}>
              {isTextContent ? (
                <Text>{children}</Text>
              ) : (
                children
              )}
            </ButtonTextureContext.Provider>
          </StitchedBorder>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  backgroundWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bgImageNative: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  bgImageStyle: {
    borderRadius: 8,
  },
  overlay: {
    width: '100%',
    height: '100%',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ButtonBase;
