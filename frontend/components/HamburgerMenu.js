import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import StitchedBorder from './StitchedBorder';
import VaporwaveButton from './VaporwaveButton';
import LayerSelectModal from './LayerSelectModal';
import SoundSettingsModal from './SoundSettingsModal';
import AuthStore from '../stores/AuthStore';
import LayerStore from '../stores/LayerStore';

const buttonBgImage = require('../assets/images/button-bg.png');

const HamburgerMenu = observer(({ style }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    AuthStore.logout();
    LayerStore.clearLayer();
    router.replace('/');
  };

  const handleSwitchLayers = () => {
    setIsOpen(false);
    setShowLayerModal(true);
  };

  const handleSoundSettings = () => {
    setIsOpen(false);
    setShowSoundSettings(true);
  };

  const handleLayerSelected = (layer) => {
    setShowLayerModal(false);
  };

  const currentLayerName = LayerStore.currentLayer?.name || 'None';

  return (
    <>
      <View style={[styles.container, style]}>
        {/* Hamburger Button */}
        <Pressable onPress={() => setIsOpen(!isOpen)} style={styles.hamburgerButton}>
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
            <StitchedBorder borderRadius={8} borderWidth={2} borderColor="rgba(92, 90, 88, 0.3)">
              <View style={styles.hamburgerLines}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </StitchedBorder>
          </View>
        </Pressable>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />

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
                    <VaporwaveButton
                      title="Switch Layers"
                      onPress={handleSwitchLayers}
                      variant="secondary"
                      style={styles.menuButton}
                    />

                    {/* Sound Settings Button */}
                    <VaporwaveButton
                      title="Sound Settings"
                      onPress={handleSoundSettings}
                      variant="blue"
                      style={styles.menuButton}
                    />

                    {/* Logout Button */}
                    {AuthStore.isAuthenticated && (
                      <VaporwaveButton
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

      {/* Layer Selection Modal */}
      <LayerSelectModal
        visible={showLayerModal}
        onClose={() => setShowLayerModal(false)}
        onLayerSelected={handleLayerSelected}
      />

      {/* Sound Settings Modal */}
      <SoundSettingsModal
        visible={showSoundSettings}
        onClose={() => setShowSoundSettings(false)}
      />
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
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
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
    zIndex: 1001,
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
    fontFamily: 'ChubbyTrail',
    fontSize: 16,
    color: '#403F3E',
    marginTop: 2,
  },
  menuButton: {
    marginVertical: 2,
  },
});

export default HamburgerMenu;
