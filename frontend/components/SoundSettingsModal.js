import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Platform } from 'react-native';
import Scroll from './Scroll';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import WoolButton from './WoolButton';
import StitchedBorder from './StitchedBorder';
import sounds from '../config/sounds';
import SoundSettingsStore from '../stores/SoundSettingsStore';
import SoundManager from '../services/SoundManager';
import AuthStore from '../stores/AuthStore';

// Human-readable names for sounds
const SOUND_DISPLAY_NAMES = {
  emote: 'Notification',
  openActivity: 'Modal Open',
  closeActivity: 'Modal Close',
  weepingWillow: 'Weeping Willow Ambient',
  weepingWillowRandom: 'Weeping Willow Layers',
  wishingWell: 'Wishing Well',
  campfire: 'Campfire Crackle',
  campfireRandom1: 'Campfire Pop 1',
  campfireRandom2: 'Campfire Pop 2',
  cafeAmbientGroup: 'Sugarbee Ambient',
  cafeOverlayGroup: 'Sugarbee Chatter',
};

// Group sounds by category
const SOUND_CATEGORIES = {
  'UI Sounds': ['emote', 'openActivity', 'closeActivity'],
  'Ambient': ['weepingWillow', 'weepingWillowRandom', 'campfire', 'campfireRandom1', 'campfireRandom2', 'cafeAmbientGroup', 'cafeOverlayGroup'],
  'Interactive': ['wishingWell'],
};

const SoundSettingsModal = observer(({ visible, onClose }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [localSettings, setLocalSettings] = useState({});
  const [showedNoAccountWarning, setShowedNoAccountWarning] = useState(false);

  // Show warning once when modal opens and user is not authenticated
  const showNoAccountWarning = visible && !AuthStore.isAuthenticated && !showedNoAccountWarning;

  // Reset the warning flag when modal closes
  useEffect(() => {
    if (!visible) {
      setShowedNoAccountWarning(false);
    }
  }, [visible]);

  const handleDismissWarning = () => {
    setShowedNoAccountWarning(true);
  };

  // Initialize local settings from store
  useEffect(() => {
    if (visible) {
      const initial = {};
      Object.keys(sounds).forEach(key => {
        const override = SoundSettingsStore.getSettings(key);
        initial[key] = {
          volume: override?.volume ?? 1,
          enabled: override?.enabled ?? true,
        };
      });
      setLocalSettings(initial);
    }
  }, [visible]);

  const handleVolumeChange = async (soundKey, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [soundKey]: { ...prev[soundKey], volume: value }
    }));
    await SoundSettingsStore.updateSound(soundKey, { volume: value });
  };

  const handleEnabledChange = async (soundKey, enabled) => {
    setLocalSettings(prev => ({
      ...prev,
      [soundKey]: { ...prev[soundKey], enabled }
    }));
    await SoundSettingsStore.updateSound(soundKey, { enabled });
  };

  const handlePreviewSound = async (soundKey) => {
    // Play a short preview
    const instance = SoundManager.createInstance(soundKey);
    await instance.play();
    // Stop after 2 seconds for looping sounds
    setTimeout(() => {
      instance.stop();
    }, 2000);
  };

  const handleResetAll = async () => {
    await SoundSettingsStore.resetAll();
    // Reset local state
    const initial = {};
    Object.keys(sounds).forEach(key => {
      initial[key] = { volume: 1, enabled: true };
    });
    setLocalSettings(initial);
  };

  const getDefaultVolume = (soundKey) => {
    const config = sounds[soundKey];
    if (config?.volume !== undefined) return config.volume;
    if (config?.minVolume !== undefined && config?.maxVolume !== undefined) {
      return (config.minVolume + config.maxVolume) / 2;
    }
    return 1;
  };

  const formatVolume = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const renderSlider = (soundKey) => {
    const setting = localSettings[soundKey] || { volume: 1, enabled: true };
    const defaultVol = getDefaultVolume(soundKey);

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: `${setting.volume * 100}%` }
            ]}
          />
          {/* Slider thumb and interaction */}
          {Platform.OS === 'web' ? (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={setting.volume}
              onChange={(e) => handleVolumeChange(soundKey, parseFloat(e.target.value))}
              style={styles.sliderInput}
            />
          ) : (
            <Pressable
              style={styles.sliderTouchArea}
              onPress={(e) => {
                const { locationX, width } = e.nativeEvent;
                const newValue = Math.max(0, Math.min(1, locationX / width));
                handleVolumeChange(soundKey, newValue);
              }}
            />
          )}
        </View>
        <Text style={styles.volumeText}>{formatVolume(setting.volume)}</Text>
      </View>
    );
  };

  const renderSoundItem = (soundKey) => {
    const setting = localSettings[soundKey] || { volume: 1, enabled: true };
    const displayName = SOUND_DISPLAY_NAMES[soundKey] || soundKey;

    return (
      <View key={soundKey} style={styles.soundItem}>
        <View style={styles.soundHeader}>
          <View style={styles.soundTitleRow}>
            <Switch
              value={setting.enabled}
              onValueChange={(value) => handleEnabledChange(soundKey, value)}
              trackColor={{ false: 'rgba(92, 90, 88, 0.3)', true: 'rgba(110, 200, 130, 0.5)' }}
              thumbColor={setting.enabled ? '#6EC882' : '#999'}
              style={styles.switch}
            />
            <Text style={[styles.soundName, !setting.enabled && styles.soundNameDisabled]}>
              {displayName}
            </Text>
          </View>
          <Pressable
            onPress={() => handlePreviewSound(soundKey)}
            style={styles.previewButton}
          >
            <Text style={styles.previewIcon}>▶</Text>
          </Pressable>
        </View>

        {setting.enabled && renderSlider(soundKey)}
      </View>
    );
  };

  const renderCategory = (category, soundKeys) => {
    const validSoundKeys = soundKeys.filter(key => sounds[key]);
    if (validSoundKeys.length === 0) return null;

    const isExpanded = expandedCategory === category;

    return (
      <View key={category} style={styles.category}>
        <Pressable onPress={() => toggleCategory(category)} style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </Pressable>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {validSoundKeys.map(renderSoundItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Sound Settings"
      zIndex={5000}
    >
      <Scroll style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {showNoAccountWarning && (
            <Pressable style={styles.warningBanner} onPress={handleDismissWarning}>
              <Text style={styles.warningText}>
                You're not logged in. Settings will only be saved locally and won't sync across devices.
              </Text>
              <Text style={styles.warningDismiss}>Tap to dismiss</Text>
            </Pressable>
          )}

          <Text style={styles.description}>
            Adjust volume levels and toggle sounds on or off. Changes are saved automatically.
          </Text>

          {Object.entries(SOUND_CATEGORIES).map(([category, soundKeys]) =>
            renderCategory(category, soundKeys)
          )}

          <View style={styles.footer}>
            <WoolButton
              title="Reset All to Default"
              onPress={handleResetAll}
              variant="coral"
              style={styles.resetButton}
            />
          </View>
        </View>
      </Scroll>
    </Modal>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 10,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#403F3E',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 180, 100, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(200, 140, 60, 0.4)',
  },
  warningText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#5C4A30',
    textAlign: 'center',
    lineHeight: 18,
  },
  warningDismiss: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#5C4A30',
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  category: {
    marginBottom: 15,
    backgroundColor: 'rgba(222, 134, 223, 0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
  },
  categoryTitle: {
    fontFamily: 'ChubbyTrail',
    fontSize: 16,
    color: '#403F3E',
  },
  expandIcon: {
    fontSize: 12,
    color: '#403F3E',
    opacity: 0.6,
  },
  categoryContent: {
    padding: 10,
  },
  soundItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.15)',
  },
  soundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  soundTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switch: {
    marginRight: 10,
    transform: [{ scale: 0.85 }],
  },
  soundName: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    fontWeight: '600',
  },
  soundNameDisabled: {
    opacity: 0.5,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.2)',
  },
  previewIcon: {
    fontSize: 12,
    color: '#403F3E',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(92, 90, 88, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(110, 200, 130, 0.6)',
    borderRadius: 4,
  },
  sliderInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  },
  sliderTouchArea: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    bottom: -10,
  },
  volumeText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#403F3E',
    marginLeft: 10,
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.15)',
    alignItems: 'center',
  },
  resetButton: {
    minWidth: 180,
  },
});

export default SoundSettingsModal;
