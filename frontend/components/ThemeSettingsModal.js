import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Platform } from 'react-native';
import Scroll from './Scroll';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import WoolButton from './WoolButton';
import MinkyPanel from './MinkyPanel';
import ThemeStore from '../stores/ThemeStore';
import AuthStore from '../stores/AuthStore';
import FontSettingsStore from '../stores/FontSettingsStore';

// Predefined color options for panels (lower opacity)
const COLOR_PRESETS = {
  pink: 'rgba(222, 134, 223, 0.25)',
  blue: 'rgba(179, 230, 255, 0.25)',
  purple: 'rgba(112, 68, 199, 0.2)',
  green: 'rgba(110, 200, 130, 0.25)',
  coral: 'rgba(255, 160, 130, 0.25)',
  gold: 'rgba(255, 215, 100, 0.25)',
  lavender: 'rgba(200, 180, 230, 0.25)',
  mint: 'rgba(150, 230, 200, 0.25)',
};

// Button color presets with clear distinction between states
// Default (purple) values match ThemeStore defaults for Help Wanted
const BUTTON_COLOR_PRESETS = {
  purple: {
    default: 'rgba(78, 78, 188, 0.27)',
    focused: 'rgba(78, 78, 188, 0.55)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  pink: {
    default: 'rgba(222, 134, 223, 0.2)',
    focused: 'rgba(222, 134, 223, 0.55)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  blue: {
    default: 'rgba(179, 230, 255, 0.2)',
    focused: 'rgba(179, 230, 255, 0.55)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  green: {
    default: 'rgba(110, 200, 130, 0.25)',
    focused: 'rgba(110, 200, 130, 0.6)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  coral: {
    default: 'rgba(255, 160, 130, 0.25)',
    focused: 'rgba(255, 160, 130, 0.6)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  gold: {
    default: 'rgba(255, 215, 100, 0.2)',
    focused: 'rgba(255, 215, 100, 0.55)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  lavender: {
    default: 'rgba(200, 180, 230, 0.2)',
    focused: 'rgba(200, 180, 230, 0.55)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
  mint: {
    default: 'rgba(150, 230, 200, 0.2)',
    focused: 'rgba(150, 230, 200, 0.55)',
    inactive: 'rgba(68, 71, 90, 0.21)',
  },
};

const FLOW_NAMES = {
  weepingWillow: 'Help Wanted',
  wishingWell: 'Wishing Well',
};

const ThemeSettingsModal = observer(({ visible, onClose }) => {
  const [expandedSection, setExpandedSection] = useState(null);
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

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleGlobalMinkyColorChange = async (color) => {
    await ThemeStore.setGlobalMinkyColor(color);
  };

  const handleGlobalButtonColorChange = async (colorName) => {
    if (!colorName) {
      // Reset to default - clear all global wool colors
      await ThemeStore.setGlobalWoolColors('primary', { default: null, focused: null, inactive: null });
      return;
    }
    const colors = BUTTON_COLOR_PRESETS[colorName];
    if (colors) {
      // Apply to primary variant (which affects most buttons)
      await ThemeStore.setGlobalWoolColors('primary', colors);
    }
  };

  const handleFlowMinkyColorChange = async (flowName, color) => {
    await ThemeStore.setFlowMinkyColor(flowName, color);
  };

  const handleFlowButtonColorChange = async (flowName, colorName) => {
    if (!colorName) {
      // Reset to default
      await ThemeStore.setFlowWoolColors(flowName, 'primary', { default: null, focused: null, inactive: null });
      return;
    }
    const colors = BUTTON_COLOR_PRESETS[colorName];
    if (colors) {
      await ThemeStore.setFlowWoolColors(flowName, 'primary', colors);
    }
  };

  const handleFlowEnabledChange = async (flowName, enabled) => {
    await ThemeStore.setFlowEnabled(flowName, enabled);
  };

  const handleResetAll = async () => {
    await ThemeStore.resetAll();
  };

  const handleResetFlow = async (flowName) => {
    await ThemeStore.resetFlow(flowName);
  };

  const renderColorPicker = (currentColor, onSelect) => {
    return (
      <View style={styles.colorGrid}>
        {Object.entries(COLOR_PRESETS).map(([name, color]) => (
          <Pressable
            key={name}
            onPress={() => onSelect(color)}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              currentColor === color && styles.colorSwatchSelected,
            ]}
          >
            {currentColor === color && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>
        ))}
        <Pressable
          onPress={() => onSelect(null)}
          style={[
            styles.colorSwatch,
            styles.colorSwatchDefault,
            currentColor === null && styles.colorSwatchSelected,
          ]}
        >
          <Text style={styles.defaultText}>Default</Text>
        </Pressable>
      </View>
    );
  };

  // Get current button color name from stored colors
  const getButtonColorName = (woolColors) => {
    if (!woolColors?.primary?.default) return null;
    const currentDefault = woolColors.primary.default;
    for (const [name, colors] of Object.entries(BUTTON_COLOR_PRESETS)) {
      if (colors.default === currentDefault) return name;
    }
    return null;
  };

  const renderButtonColorPicker = (currentColorName, onSelect) => {
    return (
      <View style={styles.colorGrid}>
        {Object.entries(BUTTON_COLOR_PRESETS).map(([name, colors]) => (
          <Pressable
            key={name}
            onPress={() => onSelect(name)}
            style={[
              styles.colorSwatch,
              { backgroundColor: colors.default },
              currentColorName === name && styles.colorSwatchSelected,
            ]}
          >
            {currentColorName === name && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>
        ))}
        <Pressable
          onPress={() => onSelect(null)}
          style={[
            styles.colorSwatch,
            styles.colorSwatchDefault,
            currentColorName === null && styles.colorSwatchSelected,
          ]}
        >
          <Text style={styles.defaultText}>Default</Text>
        </Pressable>
      </View>
    );
  };

  const renderPreview = (panelColor, buttonColorName, label) => {
    const buttonColors = buttonColorName ? BUTTON_COLOR_PRESETS[buttonColorName] : BUTTON_COLOR_PRESETS.purple;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>{label}</Text>
        <MinkyPanel
          borderRadius={8}
          padding={10}
          paddingTop={10}
          overlayColor={panelColor || 'rgba(112, 68, 199, 0.2)'}
        >
          <Text style={[styles.previewText, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('#403F3E') }]}>Preview Panel</Text>
        </MinkyPanel>
        <View style={styles.buttonPreviewRow}>
          <View style={styles.buttonPreviewItem}>
            <WoolButton
              size="small"
              variant="purple"
              overlayColor={buttonColors.default}
            >
              Default
            </WoolButton>
          </View>
          <View style={styles.buttonPreviewItem}>
            <WoolButton
              size="small"
              variant="purple"
              overlayColor={buttonColors.focused}
            >
              Focused
            </WoolButton>
          </View>
          <View style={styles.buttonPreviewItem}>
            <WoolButton
              size="small"
              variant="purple"
              overlayColor={buttonColors.inactive}
            >
              Inactive
            </WoolButton>
          </View>
        </View>
      </View>
    );
  };

  const renderGlobalSection = () => {
    const isExpanded = expandedSection === 'global';
    const currentPanelColor = ThemeStore.globalSettings.minkyColor;
    const currentButtonColorName = getButtonColorName(ThemeStore.globalSettings.woolColors);

    return (
      <View style={styles.section}>
        <Pressable onPress={() => toggleSection('global')} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Global Theme</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </Pressable>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={styles.settingLabel}>Panel Color</Text>
            {renderColorPicker(currentPanelColor, handleGlobalMinkyColorChange)}

            <Text style={[styles.settingLabel, { marginTop: 15 }]}>Button Colors</Text>
            {renderButtonColorPicker(currentButtonColorName, handleGlobalButtonColorChange)}

            {renderPreview(currentPanelColor, currentButtonColorName, 'Current Global Theme')}
          </View>
        )}
      </View>
    );
  };

  const renderFlowSection = (flowName) => {
    const displayName = FLOW_NAMES[flowName] || flowName;
    const isExpanded = expandedSection === flowName;
    const flowSettings = ThemeStore.flowSettings[flowName] || { enabled: false, minkyColor: null, woolColors: {} };
    const isEnabled = flowSettings.enabled;
    const currentPanelColor = flowSettings.minkyColor;
    const currentButtonColorName = getButtonColorName(flowSettings.woolColors);

    return (
      <View key={flowName} style={styles.section}>
        <Pressable onPress={() => toggleSection(flowName)} style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{displayName}</Text>
            <Switch
              value={isEnabled}
              onValueChange={(value) => handleFlowEnabledChange(flowName, value)}
              trackColor={{ false: 'rgba(92, 90, 88, 0.3)', true: 'rgba(112, 68, 199, 0.5)' }}
              thumbColor={isEnabled ? '#7044C7' : '#999'}
              style={styles.switch}
            />
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </Pressable>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {isEnabled ? (
              <>
                <Text style={styles.settingLabel}>Panel Color</Text>
                {renderColorPicker(currentPanelColor, (color) => handleFlowMinkyColorChange(flowName, color))}

                <Text style={[styles.settingLabel, { marginTop: 15 }]}>Button Colors</Text>
                {renderButtonColorPicker(currentButtonColorName, (colorName) => handleFlowButtonColorChange(flowName, colorName))}

                {renderPreview(currentPanelColor || ThemeStore.getMinkyColor(flowName, 'primary'), currentButtonColorName, `${displayName} Theme`)}

                <Pressable
                  onPress={() => handleResetFlow(flowName)}
                  style={styles.resetFlowButton}
                >
                  <Text style={styles.resetFlowText}>Reset to Default</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.disabledText}>
                Enable custom theming to customize colors for {displayName}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Theme Settings"
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
            Customize the colors of panels and buttons. Changes are saved automatically.
          </Text>

          {renderGlobalSection()}

          <Text style={styles.flowsHeader}>Per-Activity Themes</Text>
          {Object.keys(FLOW_NAMES).map(renderFlowSection)}

          <View style={styles.footer}>
            <WoolButton
              onPress={handleResetAll}
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
  flowsHeader: {
    fontFamily: 'SuperStitch',
    fontSize: 14,
    color: '#403F3E',
    marginTop: 10,
    marginBottom: 10,
    opacity: 0.7,
  },
  section: {
    marginBottom: 15,
    backgroundColor: 'rgba(222, 134, 223, 0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'SuperStitch',
    fontSize: 16,
    color: '#403F3E',
    opacity: 0.8,
  },
  switch: {
    marginLeft: 10,
    transform: [{ scale: 0.85 }],
  },
  expandIcon: {
    fontSize: 12,
    color: '#403F3E',
    opacity: 0.6,
  },
  sectionContent: {
    padding: 15,
  },
  settingLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    fontWeight: '600',
    color: '#403F3E',
    marginBottom: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
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
    borderColor: '#403F3E',
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
    color: '#403F3E',
  },
  defaultText: {
    fontFamily: 'Comfortaa',
    fontSize: 9,
    color: '#403F3E',
    opacity: 0.7,
  },
  previewContainer: {
    marginTop: 10,
    gap: 10,
  },
  buttonPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonPreviewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
    marginBottom: 5,
  },
  previewText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#403F3E',
    textAlign: 'center',
  },
  disabledText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#403F3E',
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  resetFlowButton: {
    marginTop: 15,
    padding: 8,
    backgroundColor: 'rgba(92, 90, 88, 0.1)',
    borderRadius: 6,
    alignItems: 'center',
  },
  resetFlowText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#403F3E',
    opacity: 0.7,
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

export default ThemeSettingsModal;
