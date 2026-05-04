import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WoolButton from '../WoolButton';
import FontSettingsStore from '../../stores/FontSettingsStore';

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
 * button-export-share-action — export / print / share artifact.
 * Spec: ../_meta-canonical/button-export-share-action.json
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
  onTap,
  onExportGenerated,
  onPrintRequested,
  onFileWritten,
  onShareInvoked,
  onHandoffSelected,
}) => {
  const fire = (target, format) => {
    onTap && onTap({ target, format });
    if (format === 'print') onPrintRequested && onPrintRequested({ artifactPayload });
    else if (target === 'share_sheet' || target === 'social_share' || target === 'clinical_handoff') onShareInvoked && onShareInvoked({ target, artifactPayload });
    else if (target === 'file_download') onFileWritten && onFileWritten({ format, artifactPayload });
    else onExportGenerated && onExportGenerated({ format, target, artifactPayload });
    onHandoffSelected && onHandoffSelected({ target, format });
  };

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
