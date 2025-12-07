import React, { createContext, useContext } from 'react';
import { Pressable, Text as RNText, View, StyleSheet, ImageBackground, Platform } from 'react-native';
import StitchedBorder from './StitchedBorder';
import { Typography } from '../constants/typography';
import { useWoolColors } from '../hooks/useTheme';

const woolBgImage = require('../assets/images/button-bg.png');
const minkyBgImage = require('../assets/images/slot-bg-2.jpeg');

// Text styles per texture
const textStyles = {
  wool: {
    fontFamily: Typography.fonts.needleworkGood,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#403F3E',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  minky: {
    fontFamily: Typography.fonts.body,
    fontSize: 18,
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
};

// Size presets for text fontSize adjustment
const sizeTextScale = {
  small: 0.6,    // 12px for wool, 11px for minky
  medium: 0.8,   // 16px for wool, 14px for minky
  large: 1,      // default
};

// Size presets for padding
const sizePadding = {
  small: { horizontal: 10, vertical: 6 },
  medium: { horizontal: 14, vertical: 8 },
  large: { horizontal: 20, vertical: 12 },
};

// Context to pass texture and size down to Text components
const ButtonTextureContext = createContext({ texture: 'wool', size: 'large' });

/**
 * Text component for use inside buttons - automatically styled based on button texture and size
 */
export const Text = ({ style, children, ...props }) => {
  const { texture, size } = useContext(ButtonTextureContext);
  const baseStyle = textStyles[texture] || textStyles.wool;
  const scale = sizeTextScale[size] || 1;
  const scaledFontSize = Math.round(baseStyle.fontSize * scale);
  const webShadow = Platform.OS === 'web'
    ? { textShadow: '0 1px 1px rgba(255, 255, 255, 0.62)' }
    : null;

  return (
    <RNText style={[baseStyle, { fontSize: scaledFontSize }, webShadow, style]} {...props}>
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
  size = 'large', // 'small', 'medium', 'large'
  disabled = false,
  focused = false, // Selected/active state
  overlayColor = null, // Override theme color for preview purposes
  style = {},
  contentStyle = {},
  aspectRatio,
  accessibilityLabel,
  accessibilityHint,
}) => {
  // Get theme colors for this variant (uses flow context automatically)
  const themeColors = useWoolColors(variant);

  const bgImage = texture === 'minky' ? minkyBgImage : woolBgImage;
  const bgSize = texture === 'minky' ? '80px' : '60px';

  const getOverlayColor = () => {
    // Allow explicit override for previews
    if (overlayColor) return overlayColor;
    if (disabled) return themeColors.inactive;
    // Focused state only changes stitching, not overlay color
    return themeColors.default;
  };

  const getBorderColor = () => {
    // Use white stitching when focused/selected
    if (focused) {
      return 'rgba(255, 255, 255, 0.55)';
    }
    // Default stitching color (matches MinkyPanel)
    return 'rgba(92, 90, 88, 0.55)';
  };

  // Check if children is a string to apply default text styling
  const isTextContent = typeof children === 'string';

  // Get padding based on size
  const padding = sizePadding[size] || sizePadding.large;

  // Determine if button should be auto-width (not full width)
  const isAutoWidth = size === 'small' || size === 'medium';

  // Web hover props
  const webProps = Platform.OS === 'web' ? {
    className: 'map-canvas-button',
    style: [
      styles.container,
      isAutoWidth && styles.containerAutoWidth,
      aspectRatio && { aspectRatio },
      { transition: 'transform 0.1s ease' },
      style,
    ],
  } : {
    style: [
      styles.container,
      isAutoWidth && styles.containerAutoWidth,
      aspectRatio && { aspectRatio },
      style,
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...webProps}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isTextContent ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <View style={{ opacity: disabled ? 0.5 : 1, position: 'relative' }}>
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
            paddingHorizontal={isTextContent ? padding.horizontal : 12}
            paddingVertical={isTextContent ? padding.vertical : 12}
            style={contentStyle}
          >
            <ButtonTextureContext.Provider value={{ texture, size }}>
              {isTextContent ? (
                <Text>{children}</Text>
              ) : (
                children
              )}
            </ButtonTextureContext.Provider>
          </StitchedBorder>
        </View>
        {/* Emboss highlight/shadow border */}
        <View style={styles.embossBorder} pointerEvents="none" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  containerAutoWidth: {
    width: 'auto',
    alignSelf: 'flex-start',
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
  embossBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
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

export default ButtonBase;
