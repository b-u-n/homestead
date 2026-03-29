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

  // On web, we use a raw div click handler for the overlay background because
  // React Native Web's Pressable calls preventDefault() on pointer events,
  // which prevents TextInput elements from receiving focus.
  // See: handleOverlayClick is used on a background div, not on Pressable.
  const handleOverlayClick = (event) => {
    if (showClose && event.target === event.currentTarget) {
      handleClose();
    }
  };

  // Size presets for overlay modals
  const isFullscreen = size === 'fullscreen';
  const sizePresets = {
    small: { maxWidth: 525, maxHeight: 480 },
    medium: { maxWidth: 675, maxHeight: 675 },
    large: { maxWidth: 825, maxHeight: 825 },
    fullscreen: { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', borderRadius: 0 },
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

  const modalContent = (
    <View style={wrapperStyle}>
      <TiledBackground>
        <View style={styles.contentWrapper}>
          <StitchedBorder borderRadius={isFullscreen ? 0 : 12} borderColor="rgba(92, 90, 88, 0.2)" style={styles.containerBorder}>
            {/* Navigation buttons bar with title — hidden in fullscreen */}
            {!isFullscreen && (
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
            )}

            {/* Fullscreen: minimal close button */}
            {isFullscreen && showClose && (
              <Pressable onPress={handleClose} style={styles.fullscreenClose}>
                <img
                  src={typeof menuCloseImage === 'string' ? menuCloseImage : menuCloseImage.default || menuCloseImage.uri || menuCloseImage}
                  alt="Close"
                  style={{ width: 36, height: 36, display: 'block', filter: 'brightness(1.8) saturate(0.4) contrast(1.0) hue-rotate(315deg) opacity(1.0)' }}
                />
              </Pressable>
            )}

            {/* Content */}
            <Scroll style={styles.content} contentContainerStyle={styles.contentContainer}>
              {children}
            </Scroll>
          </StitchedBorder>
        </View>
      </TiledBackground>
    </View>
  );

  // On web, use a plain div for the overlay to avoid Pressable's preventDefault()
  // which blocks TextInput focus. On native, use Pressable for touch handling.
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex,
        }}
        onClick={handleOverlayClick}
      >
        {modalContent}
      </div>
    );
  }

  return (
    <View style={overlayStyle}>
      {showClose && (
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      )}
      {modalContent}
    </View>
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
    maxWidth: Platform.OS === 'web' ? 1260 : undefined,
    maxHeight: Platform.OS === 'web' ? 1080 : undefined,
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
  fullscreenClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
    opacity: 0.7,
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
    fontFamily: 'SuperStitch',
    color: 'rgba(64, 63, 62, 0.82)',
    opacity: 0.8,
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
