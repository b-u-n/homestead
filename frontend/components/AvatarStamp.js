import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

/**
 * AvatarStamp - Styled avatar component matching the map canvas style
 *
 * Features a rounded rectangle with:
 * - White background
 * - Outer dashed border (user's color or default)
 * - Inner dashed border
 * - Avatar image clipped to rounded corners
 *
 * @param {string} avatarUrl - URL of the avatar image
 * @param {string} avatarColor - Hex color for the border (optional)
 * @param {number} size - Size of the avatar (default 64)
 * @param {number} borderRadius - Border radius (default 8)
 * @param {object} style - Additional styles for the container
 */
const AvatarStamp = ({
  avatarUrl,
  avatarColor,
  size = 64,
  borderRadius = 8,
  style,
}) => {
  // Convert hex color to rgba
  const getBorderColor = (hexColor, opacity = 0.7) => {
    if (!hexColor) return `rgba(92, 90, 88, ${opacity})`;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const borderColor = getBorderColor(avatarColor, 0.7);
  const innerBorderRadius = Math.max(borderRadius - 2, 2);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          width: size + 4,
          height: size + 4,
          borderRadius: borderRadius + 2,
          borderColor: borderColor,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            width: size,
            height: size,
            borderRadius: borderRadius,
            borderColor: borderColor,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatar,
              {
                width: size - 4,
                height: size - 4,
                borderRadius: innerBorderRadius,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: size - 4,
                height: size - 4,
                borderRadius: innerBorderRadius,
              },
            ]}
          >
            <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>?</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: 'rgba(92, 90, 88, 0.4)',
  },
});

export default AvatarStamp;
