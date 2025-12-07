import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ImageBackground } from 'react-native';
import StitchedBorder from './StitchedBorder';
import TiledBackground from './TiledBackground';
import SoundManager from '../services/SoundManager';
import Scroll from './Scroll';

const buttonBgImage = require('../assets/images/button-bg.png');

const Modal = ({ visible, onClose, onBack, canGoBack, title, children, modalSize, playSound = true, additionalOpenSound, showClose = true, zIndex = 2000, size, backLabel, onCustomBack }) => {
  // Show back button if canGoBack OR if a custom back action is provided
  const showBack = canGoBack || onCustomBack;
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

  // Size presets for overlay modals
  const sizePresets = {
    small: { maxWidth: 350, maxHeight: 320 },
    medium: { maxWidth: 450, maxHeight: 450 },
    large: { maxWidth: 550, maxHeight: 550 },
  };

  // Use custom size if provided, otherwise use defaults
  const wrapperStyle = [
    styles.wrapper,
    modalSize,
    size && sizePresets[size],
    { zIndex: zIndex + 1 }
  ].filter(Boolean);

  const overlayStyle = [
    styles.overlay,
    { zIndex }
  ];

  return (
    <Pressable style={overlayStyle} onPress={handleOverlayPress}>
      <View style={wrapperStyle}>
        <TiledBackground>
          <View style={styles.contentWrapper}>
            <StitchedBorder borderRadius={12} borderColor="rgba(92, 90, 88, 0.2)" style={styles.containerBorder}>
              {/* Navigation buttons bar with title */}
              <View style={styles.navBar}>
                {/* Back button or spacer */}
                {showBack ? (
                  <Pressable onPress={onCustomBack || onBack} style={[backLabel ? styles.navButtonPressableWide : styles.navButtonPressable, { left: 0 }]}>
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
                          backgroundSize: backLabel ? '30%' : '15%',
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
                    <View style={styles.navButtonOverlayPurple}>
                      <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(112, 68, 199, 0.4)" style={styles.navButtonBorder}>
                        <Text style={backLabel ? styles.navButtonTextSmall : styles.navButtonText}>← {backLabel || ''}</Text>
                      </StitchedBorder>
                    </View>
                    <View style={styles.embossBorder} pointerEvents="none" />
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
                    <View style={styles.navButtonOverlayPurple}>
                      <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(112, 68, 199, 0.4)" style={styles.navButtonBorder}>
                        <Text style={styles.navButtonText}>✕</Text>
                      </StitchedBorder>
                    </View>
                    <View style={styles.embossBorder} pointerEvents="none" />
                  </Pressable>
                ) : (
                  <View style={styles.navButtonSpacer} />
                )}
              </View>

              {/* Content */}
              <Scroll style={styles.content} contentContainerStyle={styles.contentContainer}>
                {children}
              </Scroll>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  wrapper: {
    width: Platform.OS === 'web' ? '85%' : '100%',
    height: Platform.OS === 'web' ? '85%' : '100%',
    maxWidth: Platform.OS === 'web' ? 840 : undefined,
    maxHeight: Platform.OS === 'web' ? 720 : undefined,
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    overflow: 'hidden',
    // 3D floating/stitched effect with layered shadows
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
    pointerEvents: 'auto',
    alignSelf: 'center',
  },
  contentWrapper: {
    backgroundColor: 'rgba(222, 134, 223, 0.1)',
    padding: 4,
    flex: 1,
  },
  containerBorder: {
    padding: 20,
  },
  navButtonBorder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    minHeight: 50,
    width: '100%',
    zIndex: 10,
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
    zIndex: 11,
  },
  navButtonPressableWide: {
    height: 40,
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 11,
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
  navButtonOverlayPurple: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(78, 78, 188, 0.27)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#403F3E',
  },
  navButtonTextSmall: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  titleInNav: {
    fontSize: 24,
    fontFamily: 'ChubbyTrail',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.82)',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 60, // Make room for buttons on both sides
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    overflow: 'visible',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  embossBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
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

export default Modal;
