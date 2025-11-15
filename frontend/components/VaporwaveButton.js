import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

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
  const getGradientColors = () => {
    if (disabled) return [Colors.text.muted, Colors.text.muted];
    
    switch (variant) {
      case 'primary':
        return [Colors.vaporwave.pink, Colors.vaporwave.purple];
      case 'secondary':
        return [Colors.vaporwave.cyan, Colors.vaporwave.green];
      case 'accent':
        return [Colors.vaporwave.yellow, Colors.vaporwave.orange];
      default:
        return [Colors.vaporwave.pink, Colors.vaporwave.purple];
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
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
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
  gradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.background.primary,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default VaporwaveButton;