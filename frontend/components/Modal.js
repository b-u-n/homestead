import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import StitchedBorder from './StitchedBorder';
import TiledBackground from './TiledBackground';
import SoundManager from '../services/SoundManager';
import Scroll from './Scroll';
import FontSettingsStore from '../stores/FontSettingsStore';

const menuBackImage = require('../assets/images/menu-back.png');
const menuCloseImage = require('../assets/images/menu-close.png');

const Modal = observer(({ visible, onClose, onBack, canGoBack, title, children, modalSize, playSound = true, additionalOpenSound, showClose = true, zIndex = 2000, size, backLabel, onCustomBack }) => {
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
                  <Pressable onPress={onCustomBack || onBack} style={[styles.backButtonPressable, { left: 0 }]}>
                    <img
                      src={typeof menuBackImage === 'string' ? menuBackImage : menuBackImage.default || menuBackImage.uri || menuBackImage}
                      alt="Back"
                      style={{ width: 50, height: 50, display: 'block', filter: 'brightness(1.8) saturate(0.4) contrast(1.0) hue-rotate(315deg) opacity(1.0)' }}
                    />
                    {backLabel && (
                      <Text style={[styles.backButtonLabel, {
                        fontSize: FontSettingsStore.getScaledFontSize(12),
                        color: FontSettingsStore.getFontColor('#403F3E'),
                      }]}>{backLabel}</Text>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.navButtonSpacer} />
                )}

                {/* Title in center */}
                {title && (
                  <Text style={[
                    styles.titleInNav,
                    {
                      fontSize: FontSettingsStore.getScaledFontSize(24),
                      color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.82)'),
                    }
                  ]}>{title}</Text>
                )}

                {/* Close button */}
                {showClose ? (
                  <Pressable onPress={handleClose} style={[styles.closeButtonPressable, { right: 0 }]}>
                    <img
                      src={typeof menuCloseImage === 'string' ? menuCloseImage : menuCloseImage.default || menuCloseImage.uri || menuCloseImage}
                      alt="Close"
                      style={{ width: 50, height: 50, display: 'block', filter: 'brightness(1.8) saturate(0.4) contrast(1.0) hue-rotate(315deg) opacity(1.0)' }}
                    />
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
});

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
  backButtonPressable: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 11,
    gap: 6,
  },
  closeButtonPressable: {
    position: 'absolute',
    zIndex: 11,
  },
  backButtonLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
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
});

export default Modal;
