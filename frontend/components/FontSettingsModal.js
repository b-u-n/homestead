import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Platform } from 'react-native';
import Scroll from './Scroll';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import WoolButton from './WoolButton';
import MinkyPanel from './MinkyPanel';
import StitchedBorder from './StitchedBorder';
import FontSettingsStore from '../stores/FontSettingsStore';
import AuthStore from '../stores/AuthStore';

// Predefined text color options
const TEXT_COLOR_PRESETS = {
  default: { label: 'Default', color: null, display: '#403F3E' },
  black: { label: 'Black', color: '#000000', display: '#000000' },
  darkGray: { label: 'Dark Gray', color: '#333333', display: '#333333' },
  charcoal: { label: 'Charcoal', color: '#2C2C2C', display: '#2C2C2C' },
  brown: { label: 'Brown', color: '#4A3728', display: '#4A3728' },
  navy: { label: 'Navy', color: '#1A1A3E', display: '#1A1A3E' },
  forest: { label: 'Forest', color: '#1E3A1E', display: '#1E3A1E' },
  plum: { label: 'Plum', color: '#3E1A3E', display: '#3E1A3E' },
};

// Font size slider steps
const SIZE_MIN = 0.75;
const SIZE_MAX = 2.0;
const SIZE_STEP = 0.05;

const FontSettingsModal = observer(({ visible, onClose }) => {
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

  const handleAccessibilityModeChange = async (enabled) => {
    await FontSettingsStore.setAccessibilityMode(enabled);
  };

  const handleFontSizeChange = async (multiplier) => {
    await FontSettingsStore.setFontSizeMultiplier(multiplier);
  };

  const handleFontColorChange = async (color) => {
    await FontSettingsStore.setFontColor(color);
  };

  const handleReset = async () => {
    await FontSettingsStore.reset();
  };

  const formatMultiplier = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  const renderFontColorPicker = () => {
    const currentColor = FontSettingsStore.fontColor;

    return (
      <View style={styles.colorGrid}>
        {Object.entries(TEXT_COLOR_PRESETS).map(([key, preset]) => (
          <Pressable
            key={key}
            onPress={() => handleFontColorChange(preset.color)}
            style={[
              styles.colorSwatch,
              { backgroundColor: preset.display },
              currentColor === preset.color && styles.colorSwatchSelected,
              key === 'default' && styles.colorSwatchDefault,
            ]}
          >
            {currentColor === preset.color && (
              <Text style={[styles.checkmark, { color: key === 'default' ? '#403F3E' : '#FFFFFF' }]}>
                {'\u2713'}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  const sliderRef = useRef(null);

  const handleSliderClick = (event) => {
    if (!sliderRef.current || Platform.OS !== 'web') return;

    // Get the native event for clientX
    const nativeEvent = event.nativeEvent || event;
    const clientX = nativeEvent.clientX || nativeEvent.pageX;

    if (clientX === undefined) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newValue = SIZE_MIN + percentage * (SIZE_MAX - SIZE_MIN);
    // Round to nearest step
    const steppedValue = Math.round(newValue / SIZE_STEP) * SIZE_STEP;
    const clampedValue = Math.max(SIZE_MIN, Math.min(SIZE_MAX, steppedValue));
    handleFontSizeChange(clampedValue);
  };

  const renderSizeSlider = () => {
    const currentValue = FontSettingsStore.fontSizeMultiplier;
    const percentage = ((currentValue - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)) * 100;

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{formatMultiplier(SIZE_MIN)}</Text>
          <Text style={styles.sliderValueLabel}>{formatMultiplier(currentValue)}</Text>
          <Text style={styles.sliderLabel}>{formatMultiplier(SIZE_MAX)}</Text>
        </View>

        {/* Stitched slider track */}
        <Pressable
          ref={sliderRef}
          onPress={handleSliderClick}
          style={styles.sliderTrackOuter}
          {...(Platform.OS === 'web' ? { onClick: handleSliderClick } : {})}
        >
          <StitchedBorder
            borderRadius={12}
            borderWidth={2}
            borderColor="rgba(92, 90, 88, 0.3)"
            style={styles.sliderTrackBorder}
          >
            <View style={styles.sliderTrack}>
              {/* Fill */}
              <View
                style={[
                  styles.sliderFill,
                  { width: `${percentage}%` },
                ]}
              />
              {/* Thumb */}
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${percentage}%` },
                ]}
              >
                <View style={styles.sliderThumbInner} />
              </View>
            </View>
          </StitchedBorder>
        </Pressable>

        <View style={styles.sliderButtons}>
          <WoolButton
            size="small"
            variant="secondary"
            onPress={() => handleFontSizeChange(Math.max(SIZE_MIN, currentValue - SIZE_STEP))}
            disabled={currentValue <= SIZE_MIN}
          >
            -
          </WoolButton>
          <WoolButton
            size="small"
            variant="secondary"
            onPress={() => handleFontSizeChange(1.0)}
          >
            Reset
          </WoolButton>
          <WoolButton
            size="small"
            variant="secondary"
            onPress={() => handleFontSizeChange(Math.min(SIZE_MAX, currentValue + SIZE_STEP))}
            disabled={currentValue >= SIZE_MAX}
          >
            +
          </WoolButton>
        </View>
      </View>
    );
  };

  const renderPreview = () => {
    const multiplier = FontSettingsStore.fontSizeMultiplier;
    const color = FontSettingsStore.fontColor || '#403F3E';

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <MinkyPanel
          borderRadius={8}
          padding={15}
          paddingTop={15}
        >
          <Text
            style={[
              styles.previewTextLarge,
              { fontSize: Math.round(20 * multiplier), color },
            ]}
          >
            Header Text
          </Text>
          <Text
            style={[
              styles.previewTextBody,
              { fontSize: Math.round(14 * multiplier), color },
            ]}
          >
            This is body text that will appear throughout the application. It adjusts based on your font size settings.
          </Text>
          <Text
            style={[
              styles.previewTextSmall,
              { fontSize: Math.round(11 * multiplier), color },
            ]}
          >
            Small caption text
          </Text>
        </MinkyPanel>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Font Settings"
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
            Adjust text size and color for better readability. Changes are saved automatically.
          </Text>

          {/* Accessibility Mode Section */}
          <View style={styles.section}>
            <View style={styles.accessibilityRow}>
              <View style={styles.accessibilityInfo}>
                <Text style={styles.sectionTitle}>Accessibility Mode</Text>
                <Text style={styles.accessibilityHint}>
                  Enables larger text and high contrast colors
                </Text>
              </View>
              <Switch
                value={FontSettingsStore.accessibilityMode}
                onValueChange={handleAccessibilityModeChange}
                trackColor={{ false: 'rgba(92, 90, 88, 0.3)', true: 'rgba(110, 200, 130, 0.5)' }}
                thumbColor={FontSettingsStore.accessibilityMode ? '#6EC882' : '#999'}
              />
            </View>
          </View>

          {/* Font Size Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Font Size</Text>
            {renderSizeSlider()}
          </View>

          {/* Font Color Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Text Color</Text>
            <Text style={styles.settingHint}>
              Choose a text color for improved readability
            </Text>
            {renderFontColorPicker()}
          </View>

          {/* Preview Section */}
          {renderPreview()}

          {/* Reset Button */}
          <View style={styles.footer}>
            <WoolButton
              onPress={handleReset}
              variant="coral"
              style={styles.resetButton}
            >
              Reset All to Default
            </WoolButton>
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
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(222, 134, 223, 0.08)',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontFamily: 'ChubbyTrail',
    fontSize: 16,
    color: '#403F3E',
    marginBottom: 10,
  },
  accessibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessibilityInfo: {
    flex: 1,
    marginRight: 15,
  },
  accessibilityHint: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
    marginTop: -5,
  },
  settingHint: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
    marginBottom: 12,
    marginTop: -5,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorSwatchSelected: {
    borderColor: '#6EC882',
    borderWidth: 3,
  },
  colorSwatchDefault: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.4)',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginTop: 5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.6,
  },
  sliderValueLabel: {
    fontFamily: 'ChubbyTrail',
    fontSize: 18,
    color: '#403F3E',
  },
  sliderTrackOuter: {
    paddingVertical: 8,
    cursor: 'pointer',
  },
  sliderTrackBorder: {
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
    padding: 4,
  },
  sliderTrack: {
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible',
  },
  sliderFill: {
    position: 'absolute',
    top: 2,
    left: 2,
    height: 24,
    backgroundColor: 'rgba(110, 200, 130, 0.5)',
    borderRadius: 6,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    marginLeft: -18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderThumbInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6EC882',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 12,
  },
  previewContainer: {
    marginBottom: 15,
  },
  previewLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
    marginBottom: 8,
  },
  previewTextLarge: {
    fontFamily: 'ChubbyTrail',
    marginBottom: 8,
  },
  previewTextBody: {
    fontFamily: 'Comfortaa',
    lineHeight: 20,
    marginBottom: 8,
  },
  previewTextSmall: {
    fontFamily: 'Comfortaa',
    opacity: 0.7,
  },
  footer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.15)',
    alignItems: 'center',
  },
  resetButton: {
    minWidth: 180,
  },
});

export default FontSettingsModal;
