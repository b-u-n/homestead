import React from 'react';
import { Image, StyleSheet, Platform, View } from 'react-native';

const heartImage = require('../assets/images/heart.png');

/**
 * Heart component - displays the heart.png image
 * Use this instead of the ❤️ emoji throughout the app
 *
 * The heart is tinted slightly pink (cottagecore style) and sized 30% larger internally
 */
const Heart = ({ size = 16, style }) => {
  // Make the actual image 30% larger
  const actualSize = size * 1.3;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {Platform.OS === 'web' ? (
        <img
          src={typeof heartImage === 'string' ? heartImage : heartImage.default || heartImage.uri || heartImage}
          style={{
            width: actualSize,
            height: actualSize,
            marginLeft: (size - actualSize) / 2,
            marginTop: (size - actualSize) / 2,
            filter: 'hue-rotate(-10deg) saturate(0.85) brightness(1.22)',
          }}
        />
      ) : (
        <Image
          source={heartImage}
          style={[
            styles.heart,
            {
              width: actualSize,
              height: actualSize,
              marginLeft: (size - actualSize) / 2,
              marginTop: (size - actualSize) / 2,
              tintColor: '#F0768E', // Pinkish cottagecore tint, 12% brighter
            }
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heart: {
    // Default styles
  },
});

export default Heart;
