import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Require all images at the top level
const backgroundTile = require('../assets/images/background-tile.jpeg');
const bgTile1 = require('../assets/images/bg-tile-1.png');
const bgTile2 = require('../assets/images/bg-tile-2.png');
const bgTile3 = require('../assets/images/bg-tile-3.png');
const bgTile4 = require('../assets/images/bg-tile-4.png');

const TiledBackground = ({ children, layers = [] }) => {
  // If no layers provided, use a default configuration
  const defaultLayers = [
    // Base layer - original full screen tile (full opacity)
    { image: backgroundTile, opacity: 1.0, offsetX: 0, offsetY: 0, size: '200px 200px' },
    // Use each of the 4 images twice with random offsets (opacities adjusted)
    { image: bgTile1, opacity: 0.448, offsetX: 0, offsetY: 0 },
    { image: bgTile1, opacity: 0.392, offsetX: 186, offsetY: 114 },
    { image: bgTile2, opacity: 0.48, offsetX: 0, offsetY: 0 },
    { image: bgTile2, opacity: 0.48, offsetX: 153, offsetY: 92 },
    { image: bgTile3, opacity: 0.4, offsetX: 0, offsetY: 0 },
    { image: bgTile3, opacity: 0.4, offsetX: 362, offsetY: 216 },
    { image: bgTile4, opacity: 0.32, offsetX: 0, offsetY: 0 },
    { image: bgTile4, opacity: 0.32, offsetX: 329, offsetY: 211 },
  ];

  const backgroundLayers = layers.length > 0 ? layers : defaultLayers;

  return (
    <View style={styles.container}>
      {/* Render background layers - just divs with CSS backgrounds on web */}
      {Platform.OS === 'web' && backgroundLayers.map((layer, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: layer.opacity,
            backgroundImage: `url(${typeof layer.image === 'string' ? layer.image : layer.image.default || layer.image.uri || layer.image})`,
            backgroundRepeat: 'repeat',
            backgroundSize: layer.size || 'auto',
            backgroundPosition: `${layer.offsetX || 0}px ${layer.offsetY || 0}px`,
            pointerEvents: 'none',
            zIndex: index,
          }}
        />
      ))}

      {/* Content overlay */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6d9bf',
    overflow: 'hidden',
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
});

export default TiledBackground;
