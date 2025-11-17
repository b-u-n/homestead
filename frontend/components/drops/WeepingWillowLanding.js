import React from 'react';
import { View, StyleSheet, Image, Pressable, ImageBackground, Platform } from 'react-native';
import StitchedBorder from '../StitchedBorder';

const weepingWillowImage = require('../../assets/images/weeping-willow.png');
const slotBgImage = require('../../assets/images/slot-bg-2.jpeg');

/**
 * WeepingWillow Landing Drop
 * Shows clickable images - willow to view, willow to create
 */
const WeepingWillowLanding = ({
  input,
  context,
  onComplete,
  canGoBack
}) => {
  const handleView = () => {
    onComplete({ action: 'view' });
  };

  const handleCreate = () => {
    onComplete({ action: 'create' });
  };

  return (
    <View style={styles.container}>
      {/* Create a post button */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={handleCreate} style={styles.buttonPressable}>
          {/* Background texture */}
          {Platform.OS === 'web' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '40%',
                borderRadius: 8,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={slotBgImage}
              style={styles.slotBgImage}
              imageStyle={{ opacity: 0.8, borderRadius: 6 }}
              resizeMode="repeat"
            />
          )}
          <View style={styles.buttonOverlay}>
            <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
              <Image
                source={weepingWillowImage}
                style={styles.image}
                resizeMode="contain"
              />
            </StitchedBorder>
          </View>
        </Pressable>
      </View>

      {/* View posts button */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={handleView} style={styles.buttonPressable}>
          {/* Background texture */}
          {Platform.OS === 'web' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '40%',
                borderRadius: 8,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={slotBgImage}
              style={styles.slotBgImage}
              imageStyle={{ opacity: 0.8, borderRadius: 6 }}
              resizeMode="repeat"
            />
          )}
          <View style={styles.buttonOverlay}>
            <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
              <Image
                source={weepingWillowImage}
                style={styles.image}
                resizeMode="contain"
              />
            </StitchedBorder>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 20,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressable: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 200 : 300,
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  slotBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  buttonOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: Platform.OS === 'web' ? 120 : 180,
    height: Platform.OS === 'web' ? 120 : 180,
  },
});

export default WeepingWillowLanding;
