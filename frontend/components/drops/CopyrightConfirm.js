import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';

const ATTRIBUTION_OPTIONS = [
  { value: 'real-name', label: 'Display my real name and contact information' },
  { value: 'username', label: 'Display my username' },
  { value: 'none', label: 'Do not attribute this art to me' },
];

const CopyrightConfirm = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [ipConfirmed, setIpConfirmed] = useState(false);
  const [authorizeAdvertising, setAuthorizeAdvertising] = useState(true);
  const [attribution, setAttribution] = useState('username');
  const [realName, setRealName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [attributionLink, setAttributionLink] = useState('');
  const [rememberPreferences, setRememberPreferences] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

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

  // Fetch saved preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        if (!WebSocketService.socket) {
          setLoadingPrefs(false);
          return;
        }
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
        }
      } catch (err) {
        // Non-critical — just use defaults
      } finally {
        setLoadingPrefs(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSubmit = async () => {
    if (!ipConfirmed) {
      ErrorStore.addError('Please confirm ownership');
      return;
    }

    const formData = accumulatedData?.['drawingBoard:submit']?.formData;
    if (!formData) {
      ErrorStore.addError('Missing submission data');
      return;
    }

    try {
      setSubmitting(true);

      const copyright = {
        ipConfirmed: true,
        authorizeAdvertising,
        attribution,
        realName: attribution === 'real-name' ? realName.trim() : undefined,
        contactInfo: attribution === 'real-name' ? contactInfo.trim() : undefined,
        attributionLink: attributionLink.trim() || undefined,
      };

      // Save preferences if requested
      if (rememberPreferences) {
        try {
          await WebSocketService.emit('copyrightPreferences:update', {
            sessionId: SessionStore.sessionId,
            preferences: {
              authorizeAdvertising,
              attribution,
              realName: realName.trim() || undefined,
              contactInfo: contactInfo.trim() || undefined,
              attributionLink: attributionLink.trim() || undefined,
            },
            source: 'submission',
          });
        } catch (err) {
          // Non-critical — continue with submission
          console.error('Failed to save preferences:', err);
        }
      }

      const result = await WebSocketService.emit('bazaar:submission:create', {
        ...formData,
        copyright,
      });

      if (result) {
        FormStore.resetForm('bazaar:newPost');
        onComplete({ action: 'submitted' });
      }
    } catch (error) {
      console.error('Error submitting:', error);
      ErrorStore.addError(error.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
          {/* Attribution */}
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Attribution</Text>
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
              <Text style={[styles.label, {
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

              <Text style={[styles.label, {
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

          {/* Attribution Link */}
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B'),
            marginTop: 16,
          }]}>Attribution Link</Text>
          <Text style={[styles.infoText, {
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

          {/* Checkboxes */}
          <View style={{ height: 16 }} />
          <WoolButton
            variant="purple"
            size="small"
            focused={ipConfirmed}
            onPress={() => setIpConfirmed(!ipConfirmed)}
            contentStyle={styles.checkButtonContent}
          >
            <View style={styles.checkRow}>
              <View style={[styles.checkIndicator, ipConfirmed && styles.checkIndicatorChecked]}>
                {ipConfirmed && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <Text style={[styles.checkText, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                By submitting this artwork, I confirm that I am the original creator and owner of this work. I grant Heartsbox a nonexclusive license to use this artwork for its Homestead initiative. You retain ownership and are free to continue to use your submission however you'd like.
              </Text>
            </View>
          </WoolButton>

          <View style={{ height: 8 }} />
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
                I authorize Heartsbox to use this artwork in promotional materials. This may improve the likelihood of approval.
              </Text>
            </View>
          </WoolButton>

          <View style={{ height: 8 }} />
          <WoolButton
            variant="purple"
            size="small"
            focused={rememberPreferences}
            onPress={() => setRememberPreferences(!rememberPreferences)}
            contentStyle={styles.checkButtonContent}
          >
            <View style={styles.checkRow}>
              <View style={[styles.checkIndicator, rememberPreferences && styles.checkIndicatorChecked]}>
                {rememberPreferences && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <Text style={[styles.checkText, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                Save these preferences for future submissions.
              </Text>
            </View>
          </WoolButton>

        </MinkyPanel>

        <View style={{ height: 12 }} />

        {/* Licensing Notice */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Licensing Notice</Text>
          <Text style={[styles.infoText, {
            fontSize: FontSettingsStore.getScaledFontSize(12),
            lineHeight: FontSettingsStore.getScaledSpacing(18),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Heartsbox is a 501(c)(3) nonprofit. Homestead is an open-source initiative. By submitting, you grant Heartsbox a CC0 license (unrestricted use), and others a CC BY-NC-ND license (they may share your work with attribution, but may not modify it or use it commercially without permission). Attributions are included on the credits page and when viewing items in the shop and item detail sections.
          </Text>
        </MinkyPanel>

        <View style={{ height: 20 }} />

        {/* Submit button */}
        <View style={styles.submitRow}>
          <WoolButton
            variant="purple"
            onPress={handleSubmit}
            disabled={!ipConfirmed || submitting}
          >
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </WoolButton>
        </View>

        <View style={{ height: 20 }} />
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  checkButtonContent: {
    alignItems: 'flex-start',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  infoText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
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
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  submitRow: {
    alignSelf: 'center',
  },
});

export default CopyrightConfirm;
