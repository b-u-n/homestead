import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Modal from './Modal';
import WoolButton from './WoolButton';
import FontSettingsStore from '../stores/FontSettingsStore';

// Web-first clipboard (no extra deps). Returns true on success.
async function copyToClipboard(text) {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Native fallback: no-op for now; expo-clipboard can be added later if
    // ReceiptPopup ships on native and we need true clipboard write there.
    console.warn('[ReceiptPopup] Clipboard not available on this platform');
    return false;
  } catch (err) {
    console.error('[ReceiptPopup] copy failed:', err);
    return false;
  }
}

/**
 * ReceiptPopup — a "print this" popup of pretty-formatted text content on a
 * white background. Used by activities that produce something the user might
 * want to save, share, or print: a management plan, a customized supporter
 * note, a values statement.
 *
 * Renders inside the standard `/components/Modal.js` (close button + chrome
 * provided by Modal). Copy + Print sit at the top of the receipt body.
 *
 * Props:
 *   - visible, onClose — standard Modal control
 *   - title — modal title (also printed as the receipt's heading)
 *   - sections — `[{ heading?, body }]` printed in order
 */
const ReceiptPopup = ({
  visible,
  onClose,
  title = 'Your receipt',
  sections = [],
}) => {
  const [copied, setCopied] = useState(false);

  const plainText = () => {
    const parts = [];
    if (title) parts.push(title.toUpperCase(), '');
    sections.forEach(s => {
      if (s.heading) parts.push(s.heading, '');
      if (s.body) parts.push(s.body, '');
    });
    return parts.join('\n').trim();
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(plainText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.print) {
      window.print();
    } else {
      handleCopy(); // native fallback — clipboard for the user to paste into a printable app
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      titleSize={20}
      modalSize={{ width: '76%', height: '76%' }}
      zIndex={2500}
      playSound={false}
    >
      <View style={styles.card}>
        <View style={styles.actionsRow}>
          <WoolButton
            onPress={handleCopy}
            variant="secondary"
            size="small"
          >
            {copied ? '✓ Copied' : 'Copy text'}
          </WoolButton>
          <WoolButton
            onPress={handlePrint}
            variant="secondary"
            size="small"
          >
            Print
          </WoolButton>
        </View>

        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            {section.heading ? (
              <Text style={[styles.heading, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                {section.heading}
              </Text>
            ) : null}
            {section.body ? (
              <Text style={[styles.body, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                {section.body}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // White-card-on-modal: keeps the print-friendly receipt look. The Modal
  // chrome (texture, stitching) is outside this; this is the "paper" the
  // receipt lives on.
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  section: { marginBottom: 14 },
  heading: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#5034A0',
    marginBottom: 4,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    lineHeight: 20,
  },
});

export default ReceiptPopup;
