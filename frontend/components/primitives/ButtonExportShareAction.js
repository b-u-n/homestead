import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WoolButton from '../WoolButton';
import FontSettingsStore from '../../stores/FontSettingsStore';
import OverlayStore from '../../stores/OverlayStore';

const FORMAT_GLYPH = {
  pdf: '📄',
  png: '🖼',
  jpg: '🖼',
  image: '🖼',
  print: '🖨',
  wallpaper: '📱',
  lockscreen: '🔒',
  share_sheet: '↗',
  home_screen: '🏠',
  readable_summary: '📝',
};

/**
 * ButtonExportShareAction — export / print / share artifact.
 *
 * Default behavior fires one of `onPrintRequested` / `onShareInvoked` /
 * `onFileWritten` / `onExportGenerated` / `onHandoffSelected` based on the
 * `outputFormat` and `handoffTarget` props.
 *
 * Receipt-popup mode: when `opensReceipt: true` AND `resolvedReceipt` is
 * provided by the renderer (via the `_receiptContent` directive — see
 * `activities/v2/_SCHEMA.md`), tapping the button opens a `ReceiptPopup`
 * with the assembled `{ title, sections }` instead of firing the export
 * callbacks. Used by my-management-plan's "Open printable plan."
 *
 * Renderer-injected props consumed:
 *   - `resolvedReceipt`: `{ title: string, sections: [{ heading, body }] }`
 *     resolved by ComponentStep from the `_receiptContent` directive on
 *     this entry's `props`.
 */
const ButtonExportShareAction = observer(({
  label,
  enabled = true,
  outputFormat = 'pdf',
  artifactExported,
  handoffTarget,
  bundling = 'single-format-button',
  availableTargets,
  artifactPayload,
  // When opensReceipt is true and ComponentStep has resolved a `_receiptContent`
  // directive into `resolvedReceipt`, tapping the button opens a ReceiptPopup
  // with that title + sections instead of firing the side-effect callbacks.
  opensReceipt = false,
  resolvedReceipt,
  onTap,
  onExportGenerated,
  onPrintRequested,
  onFileWritten,
  onShareInvoked,
  onHandoffSelected,
}) => {
  const fire = (target, format) => {
    onTap && onTap({ target, format });
    // Receipt-popup path: if the button is configured to open a receipt and a
    // resolved one is available, open the global overlay and skip the export
    // callbacks. The popup itself is mounted at the app root and reads from
    // OverlayStore — no local state needed here.
    if (opensReceipt && resolvedReceipt) {
      OverlayStore.openReceipt({
        title: resolvedReceipt.title,
        sections: resolvedReceipt.sections || [],
      });
      return;
    }
    if (format === 'print') onPrintRequested && onPrintRequested({ artifactPayload });
    else if (target === 'share_sheet' || target === 'social_share' || target === 'clinical_handoff') onShareInvoked && onShareInvoked({ target, artifactPayload });
    else if (target === 'file_download') onFileWritten && onFileWritten({ format, artifactPayload });
    else onExportGenerated && onExportGenerated({ format, target, artifactPayload });
    onHandoffSelected && onHandoffSelected({ target, format });
  };

  // Receipt-popup mounting lives at the app root (ReceiptPopupOverlay); when
  // the receipt path fires above, OverlayStore.openReceipt() shows it. No
  // local overlay state needed here.

  if (bundling === 'multi-target-action-bar') {
    const targets = availableTargets || [
      { format: 'pdf', target: 'file_download', label: 'PDF' },
      { format: 'image', target: 'file_download', label: 'Image' },
      { format: 'print', target: 'system_print', label: 'Print' },
      { format: 'share_sheet', target: 'share_sheet', label: 'Share' },
    ];
    return (
      <View style={styles.barRow}>
        {targets.map((t, i) => (
          <View key={i} style={styles.barCell}>
            <WoolButton variant="secondary" size="small" onPress={() => fire(t.target, t.format)} disabled={!enabled}>
              <Text style={[styles.barLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                {FORMAT_GLYPH[t.format] || '↗'} {t.label}
              </Text>
            </WoolButton>
          </View>
        ))}
      </View>
    );
  }

  return (
    <WoolButton
      variant="secondary"
      size="medium"
      onPress={() => fire(handoffTarget || 'file_download', outputFormat)}
      disabled={!enabled}
    >
      <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
        {FORMAT_GLYPH[outputFormat] || '↗'} {label || `Export ${outputFormat.toUpperCase()}`}
      </Text>
    </WoolButton>
  );
});

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  barCell: { minWidth: 80 },
  barLabel: {
    fontFamily: 'NeedleworkGood',
    fontWeight: '700',
    color: '#403F3E',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontFamily: 'NeedleworkGood',
    fontWeight: '700',
    color: '#403F3E',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ButtonExportShareAction;
