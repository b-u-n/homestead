import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import WoolButton from './WoolButton';
import Scroll from './Scroll';
import FontSettingsStore from '../stores/FontSettingsStore';
import WebSocketService from '../services/websocket';
import SessionStore from '../stores/SessionStore';
import ErrorStore from '../stores/ErrorStore';

const ATTRIBUTION_OPTIONS = [
  { value: 'real-name', label: 'Display my real name and contact information' },
  { value: 'username', label: 'Display my username' },
  { value: 'none', label: 'Do not attribute this art to me' },
];

const UserSettingsModal = observer(({ visible, onClose }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [authorizeAdvertising, setAuthorizeAdvertising] = useState(false);
  const [attribution, setAttribution] = useState('username');
  const [realName, setRealName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [attributionLink, setAttributionLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const webInputStyle = {
    fontFamily: 'Comfortaa',
    fontSize: FontSettingsStore.getScaledFontSize(14),
    color: FontSettingsStore.getFontColor('#2D2C2B'),
    padding: 8,
    borderRadius: 6,
    border: '1px solid rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  };

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    if (!WebSocketService.socket) return;
    try {
      setLoading(true);
      const result = await WebSocketService.emit('copyrightPreferences:get', {
        sessionId: SessionStore.sessionId
      });
      if (result?.preferences) {
        const prefs = result.preferences;
        setAuthorizeAdvertising(prefs.authorizeAdvertising || false);
        setAttribution(prefs.attribution || 'username');
        setRealName(prefs.realName || '');
        setContactInfo(prefs.contactInfo || '');
        setAttributionLink(prefs.attributionLink || '');
      } else {
        resetFields();
      }
    } catch (err) {
      console.error('Failed to load copyright preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFields = () => {
    setAuthorizeAdvertising(false);
    setAttribution('username');
    setRealName('');
    setContactInfo('');
    setAttributionLink('');
  };

  const handleSave = async () => {
    if (!WebSocketService.socket) return;
    try {
      setSaving(true);
      await WebSocketService.emit('copyrightPreferences:update', {
        sessionId: SessionStore.sessionId,
        preferences: {
          authorizeAdvertising,
          attribution,
          realName: realName.trim() || undefined,
          contactInfo: contactInfo.trim() || undefined,
          attributionLink: attributionLink.trim() || undefined,
        },
        source: 'settings',
      });
      onClose();
    } catch (err) {
      ErrorStore.addError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!WebSocketService.socket) return;
    try {
      setSaving(true);
      await WebSocketService.emit('copyrightPreferences:reset', {
        sessionId: SessionStore.sessionId,
      });
      resetFields();
    } catch (err) {
      ErrorStore.addError(err.message || 'Failed to reset preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="User Settings"
      zIndex={5000}
    >
      <Scroll style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Copyright Preferences Category */}
          <View style={styles.category}>
            <Pressable onPress={() => toggleCategory('copyright')} style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Copyright Preferences</Text>
              <Text style={styles.expandIcon}>{expandedCategory === 'copyright' ? '\u25BC' : '\u25B6'}</Text>
            </Pressable>

            {expandedCategory === 'copyright' && (
              <View style={styles.categoryContent}>
                <Text style={[styles.hint, {
                  fontSize: FontSettingsStore.getScaledFontSize(12),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  Default preferences for bazaar submissions.
                </Text>

                {/* Advertising Authorization */}
                <View style={styles.field}>
                  <Text style={styles.fieldTitle}>Advertising Authorization</Text>
                  <WoolButton
                    variant="purple"
                    size="small"
                    focused={authorizeAdvertising}
                    onPress={() => setAuthorizeAdvertising(!authorizeAdvertising)}
                    contentStyle={styles.checkButtonContent}
                  >
                    <View style={styles.checkRow}>
                      <View style={[styles.checkIndicator, authorizeAdvertising && styles.checkIndicatorChecked]}>
                        {authorizeAdvertising && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                      </View>
                      <Text style={[styles.checkText, {
                        fontSize: FontSettingsStore.getScaledFontSize(12),
                        color: FontSettingsStore.getFontColor('#2D2C2B')
                      }]}>
                        I authorize Heartsbox to use my artwork in promotional materials.
                      </Text>
                    </View>
                  </WoolButton>
                </View>

                {/* Attribution */}
                <View style={styles.field}>
                  <Text style={styles.fieldTitle}>Attribution</Text>
                  <View style={styles.attributionOptions}>
                    {ATTRIBUTION_OPTIONS.map(opt => (
                      <WoolButton
                        key={opt.value}
                        variant="purple"
                        size="small"
                        focused={attribution === opt.value}
                        onPress={() => setAttribution(opt.value)}
                      >
                        {opt.label}
                      </WoolButton>
                    ))}
                  </View>

                  {attribution === 'real-name' && (
                    <View style={styles.realNameFields}>
                      <Text style={[styles.inputLabel, {
                        fontSize: FontSettingsStore.getScaledFontSize(13),
                        color: FontSettingsStore.getFontColor('#2D2C2B')
                      }]}>Real Name</Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="text"
                          value={realName}
                          onChange={(e) => setRealName(e.target.value)}
                          placeholder="Your real name"
                          maxLength={200}
                          style={webInputStyle}
                        />
                      ) : null}

                      <Text style={[styles.inputLabel, {
                        fontSize: FontSettingsStore.getScaledFontSize(13),
                        color: FontSettingsStore.getFontColor('#2D2C2B')
                      }]}>Contact Information</Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="text"
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          placeholder="Email or other contact info"
                          maxLength={500}
                          style={webInputStyle}
                        />
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Attribution Link */}
                <View style={styles.field}>
                  <Text style={styles.fieldTitle}>Attribution Link</Text>
                  <Text style={[styles.hint, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#454342'),
                    marginBottom: 8,
                  }]}>
                    Provide a link for attribution (optional)
                  </Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="text"
                      value={attributionLink}
                      onChange={(e) => setAttributionLink(e.target.value)}
                      placeholder="https://..."
                      maxLength={500}
                      style={webInputStyle}
                    />
                  ) : null}
                </View>

                {/* Licensing Notice */}
                <View style={styles.field}>
                  <Text style={styles.fieldTitle}>Licensing Notice</Text>
                  <Text style={[styles.hint, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    lineHeight: FontSettingsStore.getScaledSpacing(18),
                    color: FontSettingsStore.getFontColor('#454342'),
                    marginBottom: 0,
                  }]}>
                    Homestead is an open-source initiative. By submitting artwork, you grant Heartsbox a CC0 license (unrestricted use), and others a CC BY-NC-ND license (they may share your work with attribution, but may not modify it or use it commercially without permission).
                  </Text>
                </View>

                {/* Save / Reset */}
                <View style={styles.categoryFooter}>
                  <WoolButton
                    onPress={handleSave}
                    variant="purple"
                    disabled={saving}
                    style={styles.actionButton}
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </WoolButton>
                  <WoolButton
                    onPress={handleReset}
                    variant="coral"
                    disabled={saving}
                    style={styles.actionButton}
                  >
                    Reset to Default
                  </WoolButton>
                </View>
              </View>
            )}
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
    fontFamily: 'SuperStitch',
    fontSize: 16,
    color: '#403F3E',
    opacity: 0.8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#403F3E',
    opacity: 0.6,
  },
  categoryContent: {
    padding: 10,
  },
  hint: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  field: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.15)',
  },
  fieldTitle: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    fontWeight: '600',
    marginBottom: 8,
  },
  checkButtonContent: {
    alignItems: 'flex-start',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIndicator: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkIndicatorChecked: {
    backgroundColor: 'rgba(110, 200, 130, 0.5)',
    borderColor: 'rgba(80, 160, 100, 0.6)',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D6B3E',
  },
  checkText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  attributionOptions: {
    gap: 8,
  },
  realNameFields: {
    marginTop: 12,
  },
  inputLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  categoryFooter: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.15)',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    minWidth: 180,
  },
});

export default UserSettingsModal;
