import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable, ImageBackground } from 'react-native';
import StitchedBorder from './StitchedBorder';
import TiledBackground from './TiledBackground';
import SoundManager from '../services/SoundManager';

const buttonBgImage = require('../assets/images/button-bg.png');

const Modal = ({ visible, onClose, onBack, canGoBack, title, children, modalSize, playSound = true, additionalOpenSound, showClose = true }) => {
  const hasPlayedOpenSound = useRef(false);

  // Play open sounds once when modal first becomes visible
  useEffect(() => {
    if (visible && !hasPlayedOpenSound.current) {
      hasPlayedOpenSound.current = true;
      if (playSound) {
        SoundManager.play('openActivity');
        if (additionalOpenSound) {
          SoundManager.play(additionalOpenSound);
        }
      }
    }
    if (!visible) {
      hasPlayedOpenSound.current = false;
    }
  }, [visible, playSound, additionalOpenSound]);

  if (!visible) return null;

  const handleClose = () => {
    if (playSound) {
      SoundManager.play('closeActivity');
    }
    onClose();
  };

  const handleOverlayPress = (event) => {
    // Only close if clicking the overlay itself, not its children, and if close is allowed
    if (showClose && event.target === event.currentTarget) {
      handleClose();
    }
  };

  // Use custom size if provided, otherwise use defaults
  const wrapperStyle = modalSize ? [styles.wrapper, modalSize] : styles.wrapper;

  return (
    <Pressable style={styles.overlay} onPress={handleOverlayPress}>
      <View style={wrapperStyle}>
        <TiledBackground>
          <View style={styles.contentWrapper}>
            <StitchedBorder borderRadius={12} borderColor="rgba(92, 90, 88, 0.2)" style={styles.container}>
              {/* Navigation buttons bar with title */}
              <View style={styles.navBar}>
                {/* Back button or spacer */}
                {canGoBack ? (
                  <Pressable onPress={onBack} style={[styles.navButtonPressable, { left: 0 }]}>
                    {/* Background texture */}
                    {Platform.OS === 'web' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
                          backgroundRepeat: 'repeat',
                          backgroundSize: '15%',
                          borderRadius: 8,
                          pointerEvents: 'none',
                          opacity: 0.8,
                        }}
                      />
                    )}
                    {Platform.OS !== 'web' && (
                      <ImageBackground
                        source={buttonBgImage}
                        style={styles.navButtonBgImage}
                        imageStyle={{ opacity: 0.8, borderRadius: 8 }}
                        resizeMode="repeat"
                      />
                    )}
                    <View style={styles.navButtonOverlay}>
                      <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
                        <Text style={styles.navButtonText}>←</Text>
                      </StitchedBorder>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.navButtonSpacer} />
                )}

                {/* Title in center */}
                {title && (
                  <Text style={styles.titleInNav}>{title}</Text>
                )}

                {/* Close button */}
                {showClose ? (
                  <Pressable onPress={handleClose} style={[styles.navButtonPressable, { right: 0 }]}>
                    {/* Background texture */}
                    {Platform.OS === 'web' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
                          backgroundRepeat: 'repeat',
                          backgroundSize: '15%',
                          borderRadius: 8,
                          pointerEvents: 'none',
                          opacity: 0.8,
                        }}
                      />
                    )}
                    {Platform.OS !== 'web' && (
                      <ImageBackground
                        source={buttonBgImage}
                        style={styles.navButtonBgImage}
                        imageStyle={{ opacity: 0.8, borderRadius: 8 }}
                        resizeMode="repeat"
                      />
                    )}
                    <View style={styles.navButtonOverlay}>
                      <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
                        <Text style={styles.navButtonText}>✕</Text>
                      </StitchedBorder>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.navButtonSpacer} />
                )}
              </View>

              {/* Content */}
              <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {children}
              </ScrollView>
            </StitchedBorder>
          </View>
        </TiledBackground>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  wrapper: {
    width: Platform.OS === 'web' ? '80%' : '100%',
    height: Platform.OS === 'web' ? '80%' : '100%',
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    maxHeight: Platform.OS === 'web' ? 600 : undefined,
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    overflow: 'hidden',
    // 3D floating/stitched effect with layered shadows
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 2001,
    pointerEvents: 'auto',
  },
  contentWrapper: {
    backgroundColor: 'rgba(222, 134, 223, 0.1)',
    padding: 4,
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    minHeight: 50,
    width: '100%',
  },
  navButtonSpacer: {
    width: 50,
    height: 50,
    position: 'absolute',
    left: 0,
  },
  navButtonPressable: {
    width: 50,
    height: 50,
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  navButtonOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#403F3E',
  },
  titleInNav: {
    fontSize: 24,
    fontFamily: 'ChubbyTrail',
    color: '#403F3E',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 60, // Make room for buttons on both sides
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
});

export default Modal;
