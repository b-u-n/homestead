import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import StitchedBorder from './StitchedBorder';

/**
 * Standard button component with stitched border
 * Used for primary actions throughout the app
 */
const Button = ({
  onPress,
  children,
  disabled,
  variant = 'primary', // 'primary', 'secondary', 'cancel'
  style,
  textStyle,
  ...props
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          borderColor: '#7044C7',
          backgroundColor: 'rgba(112, 68, 199, 0.1)',
          textColor: '#7044C7',
        };
      case 'secondary':
        return {
          borderColor: 'rgba(92, 90, 88, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          textColor: '#5C5A58',
        };
      case 'cancel':
        return {
          borderColor: 'rgba(92, 90, 88, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          textColor: '#5C5A58',
        };
      default:
        return {
          borderColor: '#7044C7',
          backgroundColor: 'rgba(112, 68, 199, 0.1)',
          textColor: '#7044C7',
        };
    }
  };

  const colors = getColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: colors.backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
      <StitchedBorder
        borderWidth={2}
        borderColor={colors.borderColor}
        borderRadius={8}
        paddingHorizontal={26}
        paddingVertical={11}
      >
        <Text
          style={[
            styles.text,
            { color: colors.textColor },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </StitchedBorder>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: 'SuperStitch',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});

export default Button;
