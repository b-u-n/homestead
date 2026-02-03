import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import StitchedBorder from './StitchedBorder';
import WoolButton from './WoolButton';
import AuthStore from '../stores/AuthStore';
import LayerStore from '../stores/LayerStore';

const buttonBgImage = require('../assets/images/button-bg.png');

const HamburgerMenu = observer(({
  style,
  onShowLayerModal,
  onShowSoundSettings,
  onShowThemeSettings,
  onShowFontSettings,
  onShowReportIssue,
  onButtonPress,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Global click listener to close menu when clicking outside
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') return;

    const handleClickOutside = (event) => {
      // Check if click is outside the container
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Add listener with slight delay to avoid catching the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    AuthStore.logout();
    LayerStore.clearLayer();
    router.replace('/');
  };

  const handleSwitchLayers = () => {
    setIsOpen(false);
    onShowLayerModal?.();
  };

  const handleSoundSettings = () => {
    setIsOpen(false);
    onShowSoundSettings?.();
  };

  const handleThemeSettings = () => {
    setIsOpen(false);
    onShowThemeSettings?.();
  };

  const handleFontSettings = () => {
    setIsOpen(false);
    onShowFontSettings?.();
  };

  const handleReportIssue = () => {
    setIsOpen(false);
    onShowReportIssue?.();
  };

  const currentLayerName = LayerStore.currentLayer?.name || 'None';

  return (
    <>
      <View ref={containerRef} style={[styles.container, style]}>
        {/* Hamburger Button */}
        <Pressable onPress={() => onButtonPress ? onButtonPress() : setIsOpen(!isOpen)} style={styles.hamburgerButton}>
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
                backgroundSize: '20%',
                borderRadius: 8,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={buttonBgImage}
              style={styles.buttonBgImage}
              imageStyle={{ opacity: 0.8, borderRadius: 8 }}
              resizeMode="repeat"
            />
          )}
          <View style={styles.hamburgerOverlay}>
            <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)" style={styles.hamburgerBorderInner}>
              <View style={styles.hamburgerLines}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </StitchedBorder>
          </View>
          {/* Emboss border */}
          <View style={styles.embossBorder} pointerEvents="none" />
        </Pressable>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop for native platforms */}
            {Platform.OS !== 'web' && (
              <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
            )}

            {/* Menu */}
            <View style={styles.menu}>
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
                    opacity: 0.9,
                  }}
                />
              )}
              <View style={styles.menuOverlay}>
                <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
                  <View style={styles.menuContent}>
                    {/* Current Layer Display */}
                    <View style={styles.layerInfo}>
                      <Text style={styles.layerLabel}>Current Layer:</Text>
                      <Text style={styles.layerName}>{currentLayerName}</Text>
                    </View>

                    {/* Switch Layers Button */}
                    <WoolButton
                      title="Switch Layers"
                      onPress={handleSwitchLayers}
                      variant="secondary"
                      style={styles.menuButton}
                    />

                    {/* Sound Settings Button */}
                    <WoolButton
                      title="Sound Settings"
                      onPress={handleSoundSettings}
                      variant="blue"
                      style={styles.menuButton}
                    />

                    {/* Theme Settings Button */}
                    <WoolButton
                      title="Theme Settings"
                      onPress={handleThemeSettings}
                      variant="purple"
                      style={styles.menuButton}
                    />

                    {/* Font Settings Button */}
                    <WoolButton
                      title="Font Settings"
                      onPress={handleFontSettings}
                      variant="green"
                      style={styles.menuButton}
                    />

                    {/* Report Issue Button */}
                    <WoolButton
                      title="Report Issue"
                      onPress={handleReportIssue}
                      variant="coral"
                      style={styles.menuButton}
                    />

                    {/* Logout Button */}
                    {AuthStore.isAuthenticated && (
                      <WoolButton
                        title="Logout"
                        onPress={handleLogout}
                        variant="coral"
                        style={styles.menuButton}
                      />
                    )}
                  </View>
                </StitchedBorder>
              </View>
            </View>
          </>
        )}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  hamburgerButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  hamburgerOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerBorderInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerLines: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#403F3E',
    borderRadius: 2,
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
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9998,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    top: 55,
    right: 0,
    minWidth: 180,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  menuOverlay: {
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
    padding: 4,
  },
  menuContent: {
    padding: 12,
    gap: 10,
  },
  layerInfo: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.2)',
  },
  layerLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
  },
  layerName: {
    fontFamily: 'SuperStitch',
    fontSize: 16,
    color: '#403F3E',
    opacity: 0.8,
    marginTop: 2,
  },
  menuButton: {
    marginVertical: 2,
  },
});

export default HamburgerMenu;
