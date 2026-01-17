import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { usePathname } from 'expo-router';
import Modal from './Modal';
import WoolButton from './WoolButton';
import SessionStore from '../stores/SessionStore';
import AuthStore from '../stores/AuthStore';
import domain from '../utils/domain';

const MAX_CHARS = 2000;

const ReportIssueModal = observer(({ visible, onClose }) => {
  const [text, setText] = useState('');
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const pathname = usePathname();

  const getSystemMetadata = () => {
    const screenSize = `${Dimensions.get('window').width}x${Dimensions.get('window').height}`;
    return {
      platform: Platform.OS,
      screenSize,
      userAgent: Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      currentRoute: pathname,
      appVersion: '1.0.0', // TODO: Get from app config
      consentGiven: includeSystemInfo,
    };
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please describe the issue you encountered.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const metadata = getSystemMetadata();

      const response = await fetch(`${domain()}/api/report-issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': SessionStore.sessionId,
        },
        body: JSON.stringify({
          text: text.trim(),
          metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSuccess(true);
      setText('');
    } catch (err) {
      console.error('Error submitting issue report:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setText('');
    setError(null);
    setSuccess(false);
    setShowSystemInfo(false);
    onClose();
  };

  const systemInfo = getSystemMetadata();

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Report a Technical Issue"
      size="medium"
    >
      <View style={styles.container}>
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Thank you! Your report has been submitted. Our team will look into it.
            </Text>
            <WoolButton
              title="Close"
              onPress={handleClose}
              variant="primary"
              style={styles.closeButton}
            />
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Let us know if something isn't working right. Please describe what happened and what you expected to happen.
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Describe the issue..."
              placeholderTextColor="rgba(64, 63, 62, 0.5)"
              value={text}
              onChangeText={(value) => {
                if (value.length <= MAX_CHARS) {
                  setText(value);
                  setError(null);
                }
              }}
              maxLength={MAX_CHARS}
            />

            <Text style={styles.charCount}>
              {text.length} / {MAX_CHARS}
            </Text>

            {/* Consent checkbox */}
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setIncludeSystemInfo(!includeSystemInfo)}
            >
              <View style={[styles.checkbox, includeSystemInfo && styles.checkboxChecked]}>
                {includeSystemInfo && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Include system info to help diagnose the issue
              </Text>
            </Pressable>

            {/* Toggle system info preview */}
            {includeSystemInfo && (
              <Pressable
                style={styles.togglePreview}
                onPress={() => setShowSystemInfo(!showSystemInfo)}
              >
                <Text style={styles.togglePreviewText}>
                  {showSystemInfo ? '▼ Hide details' : '▶ Show what will be sent'}
                </Text>
              </Pressable>
            )}

            {/* System info preview */}
            {includeSystemInfo && showSystemInfo && (
              <View style={styles.systemInfoPreview}>
                <Text style={styles.systemInfoItem}>Platform: {systemInfo.platform}</Text>
                <Text style={styles.systemInfoItem}>Screen: {systemInfo.screenSize}</Text>
                <Text style={styles.systemInfoItem}>Route: {systemInfo.currentRoute}</Text>
                {systemInfo.userAgent && (
                  <Text style={styles.systemInfoItem} numberOfLines={2}>
                    Browser: {systemInfo.userAgent.substring(0, 60)}...
                  </Text>
                )}
              </View>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <WoolButton
              title={isSubmitting ? 'Submitting...' : 'Submit Report'}
              onPress={handleSubmit}
              variant="primary"
              disabled={isSubmitting || !text.trim()}
              style={styles.submitButton}
            />
          </>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    marginBottom: 16,
    opacity: 0.8,
    lineHeight: 20,
  },
  textInput: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.5,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.4)',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(120, 180, 120, 0.3)',
    borderColor: 'rgba(80, 140, 80, 0.5)',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A8A4A',
  },
  checkboxLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#403F3E',
    flex: 1,
  },
  togglePreview: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  togglePreviewText: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
    color: '#6A6A8A',
  },
  systemInfoPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  systemInfoItem: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#403F3E',
    opacity: 0.7,
    marginBottom: 4,
  },
  errorText: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#C04040',
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  closeButton: {
    minWidth: 120,
  },
});

export default ReportIssueModal;
