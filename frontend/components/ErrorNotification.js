import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import StitchedBorder from './StitchedBorder';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const ErrorNotification = observer(({ error, onDismiss, index = 0 }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          bottom: 20 + (index * 80)
        }
      ]}
    >
      <Pressable onPress={handleDismiss} style={styles.pressable}>
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
              backgroundSize: '60%',
              borderRadius: 12,
              pointerEvents: 'none',
              opacity: 0.4,
            }}
          />
        )}
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={slotBgImage}
            style={styles.bgImage}
            imageStyle={styles.bgImageStyle}
            resizeMode="repeat"
          />
        )}

        {/* Red overlay */}
        <View style={styles.overlay}>
          <StitchedBorder
            borderRadius={10}
            borderWidth={2}
            borderColor="rgba(255, 120, 120, 0.6)"
            style={styles.stitchedContent}
          >
            <View style={styles.content}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.message} numberOfLines={3}>{error.message}</Text>
              <View style={styles.dismissHint}>
                <Text style={styles.dismissText}>✕</Text>
              </View>
            </View>
          </StitchedBorder>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 1000,
  },
  pressable: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#ff3333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bgImageStyle: {
    opacity: 0.4,
    borderRadius: 12,
  },
  overlay: {
    backgroundColor: 'rgba(160, 40, 40, 0.88)',
    padding: 4,
  },
  stitchedContent: {
    flex: 0,
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: {
    fontSize: 20,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dismissHint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ErrorNotification;
