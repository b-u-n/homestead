import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { resolveAvatarUrl } from '../utils/domain';

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

  const borderColor = getBorderColor(avatarColor, 0.6);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
        },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: resolveAvatarUrl(avatarUrl) }}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: borderRadius,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: borderRadius,
            },
          ]}
        >
          <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>?</Text>
        </View>
      )}
      {/* Embossed highlight border */}
      <View
        style={[
          styles.highlightBorder,
          {
            borderRadius: borderRadius,
          },
        ]}
        pointerEvents="none"
      />
      {/* Inner stitched border overlay */}
      <View
        style={[
          styles.innerBorder,
          {
            borderRadius: borderRadius - 2,
            borderColor: borderColor,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
  innerBorder: {
    position: 'absolute',
    top: -0.5,
    left: -0.5,
    right: -0.5,
    bottom: -0.5,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  // Top-left highlight for embossed effect
  highlightBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

export default AvatarStamp;
