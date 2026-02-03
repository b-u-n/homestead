import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Scroll from './Scroll';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import WoolButton from './WoolButton';
import FontSettingsStore from '../stores/FontSettingsStore';

const AccessibilitySettingsModal = observer(({ visible, onClose, onOpenFontSettings }) => {
  const handleAccessibilityModeChange = async (enabled) => {
    await FontSettingsStore.setAccessibilityMode(enabled);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Accessibility"
      zIndex={5000}
    >
      <Scroll style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.description}>
            Adjust accessibility settings for a more comfortable experience.
          </Text>

          {/* Accessibility Toggles */}
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
            <View style={[styles.accessibilityRow, { marginTop: 14 }]}>
              <View style={styles.accessibilityInfo}>
                <Text style={styles.sectionTitle}>Reduce Animations</Text>
                <Text style={styles.accessibilityHint}>
                  Disables motion effects like avatar movement animations
                </Text>
              </View>
              <Switch
                value={FontSettingsStore.reduceAnimations}
                onValueChange={(enabled) => FontSettingsStore.setReduceAnimations(enabled)}
                trackColor={{ false: 'rgba(92, 90, 88, 0.3)', true: 'rgba(110, 200, 130, 0.5)' }}
                thumbColor={FontSettingsStore.reduceAnimations ? '#6EC882' : '#999'}
              />
            </View>
          </View>

          {/* Font Settings Link */}
          <View style={styles.footer}>
            <WoolButton
              onPress={() => {
                onClose();
                onOpenFontSettings();
              }}
              variant="green"
              style={styles.fontSettingsButton}
            >
              Font Settings
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
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(222, 134, 223, 0.08)',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontFamily: 'SuperStitch',
    fontSize: 16,
    color: '#403F3E',
    opacity: 0.8,
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
  footer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.15)',
    alignItems: 'center',
  },
  fontSettingsButton: {
    minWidth: 180,
  },
});

export default AccessibilitySettingsModal;
