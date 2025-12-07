import React from 'react';
import ButtonBase, { Text } from './ButtonBase';

// Re-export Text - it automatically uses the right style based on texture context
export { Text };

/**
 * MinkyButton - Textured button with minky/soft background
 *
 * @example
 * // Text only
 * <MinkyButton onPress={fn} variant="purple">Help Others</MinkyButton>
 *
 * @example
 * // With image
 * <MinkyButton onPress={fn} variant="secondary">
 *   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
 *     <Image source={icon} />
 *     <Text>Help Others</Text>
 *   </View>
 * </MinkyButton>
 *
 * @example
 * // Square image button
 * <MinkyButton onPress={fn} aspectRatio={1} variant="purple">
 *   <Image source={willow} style={{ width: 100, height: 100 }} />
 * </MinkyButton>
 */
const MinkyButton = ({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  style = {},
  contentStyle = {},
  aspectRatio,
  accessibilityLabel,
  accessibilityHint,
}) => {
  return (
    <ButtonBase
      texture="minky"
      onPress={onPress}
      variant={variant}
      disabled={disabled}
      style={style}
      contentStyle={contentStyle}
      aspectRatio={aspectRatio}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </ButtonBase>
  );
};

export default MinkyButton;
