import React from 'react';
import ButtonBase, { Text } from './ButtonBase';

// Re-export Text for convenience
export { Text };

/**
 * WoolButton - Textured button with wool/fuzzy background
 *
 * @example
 * // Text only
 * <WoolButton onPress={fn} variant="primary">Submit</WoolButton>
 *
 * @example
 * // With image
 * <WoolButton onPress={fn}>
 *   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
 *     <Image source={icon} />
 *     <Text>Submit</Text>
 *   </View>
 * </WoolButton>
 */
const WoolButton = ({
  children,
  title, // Deprecated: use children instead
  onPress,
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
  return (
    <ButtonBase
      texture="wool"
      onPress={onPress}
      variant={variant}
      size={size}
      disabled={disabled}
      focused={focused}
      overlayColor={overlayColor}
      style={style}
      contentStyle={contentStyle}
      aspectRatio={aspectRatio}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children || title}
    </ButtonBase>
  );
};

// VaporwaveButton is a deprecated alias for WoolButton
export const VaporwaveButton = WoolButton;
export default WoolButton;
