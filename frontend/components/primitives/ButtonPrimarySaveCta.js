import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WoolButton from '../WoolButton';
import FontSettingsStore from '../../stores/FontSettingsStore';

const SIDE_EFFECTS = [
  'hope_chest_write',
  'safety_plan_sync',
  'quick_mood_widget',
  'entry_card_written',
  'deck_promotion',
  'completion_celebration',
  'platform_sync',
];

/**
 * button-primary-save-cta — primary save/commit CTA.
 */
const ButtonPrimarySaveCta = observer(({
  label = 'Save',
  enabled = true,
  loading = false,
  persistedArtifact,
  placement = 'inline-editor',
  triggersSideEffects = [],
  onTap,
  onCommitted,
  onArtifactSaved,
}) => {
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    if (!enabled || busy || loading) return;
    onTap && onTap();
    setBusy(true);
    try {
      onCommitted && (await onCommitted({ persistedArtifact, label }));
      onArtifactSaved && onArtifactSaved({ persistedArtifact });
      const fx = Array.isArray(triggersSideEffects) ? triggersSideEffects : [];
      fx.forEach(effect => {
        if (SIDE_EFFECTS.includes(effect)) {
          // hand off — actual side-effect routing happens in platform-write-through-hook
        }
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={placement === 'sticky-footer' || placement === 'bottom-bar' ? styles.fullWidth : styles.inline}>
      <WoolButton
        variant="purple"
        size="large"
        onPress={handlePress}
        disabled={!enabled || busy || loading}
      >
        <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
          {busy || loading ? 'Saving…' : label}
        </Text>
      </WoolButton>
    </View>
  );
});

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  label: {
    fontFamily: 'NeedleworkGood',
    fontWeight: '700',
    color: '#403F3E',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ButtonPrimarySaveCta;
