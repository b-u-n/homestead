import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WoolButton from '../WoolButton';
import FontSettingsStore from '../../stores/FontSettingsStore';

/**
 * button-secondary-action — non-authoring action: cancel/reset/nav/toggle/launcher/mark-complete.
 * Spec: ../_meta-canonical/button-secondary-action.json
 */
const ButtonSecondaryAction = observer(({
  label,
  role = 'cancel-dismiss',
  enabled = true,
  currentState,
  validity = 'valid',
  confirmGuard = 'none',
  draftBehavior = 'discard',
  onTap,
  onCancelTapped,
  onDismiss,
  onResetConfirmed,
  onUndoApplied,
  onShuffleApplied,
  onBackTapped,
  onNextTapped,
  onFinishTapped,
  onToggled,
  onCompletionFlagSet,
  onFlowLaunched,
  onSessionStarted,
}) => {
  const [confirming, setConfirming] = useState(false);

  const variant =
    role === 'wizard-nav-back-next' ? 'blue' :
    role === 'launcher-entry-point' ? 'green' :
    role === 'mark-complete-existing-record' ? 'green' :
    role === 'two-state-toggle (mark-done / expand-all / reference-toggle)' ? (currentState ? 'green' : 'secondary') :
    'secondary';

  const fire = () => {
    onTap && onTap({ role });
    switch (role) {
      case 'cancel-dismiss': onCancelTapped && onCancelTapped(); onDismiss && onDismiss(); break;
      case 'reset-undo-shuffle':
        if (label?.toLowerCase().includes('undo')) onUndoApplied && onUndoApplied();
        else if (label?.toLowerCase().includes('shuffle')) onShuffleApplied && onShuffleApplied();
        else onResetConfirmed && onResetConfirmed();
        break;
      case 'wizard-nav-back-next':
        if (label?.toLowerCase().includes('back')) onBackTapped && onBackTapped();
        else if (label?.toLowerCase().includes('finish')) onFinishTapped && onFinishTapped();
        else onNextTapped && onNextTapped();
        break;
      case 'two-state-toggle (mark-done / expand-all / reference-toggle)':
        onToggled && onToggled(!currentState);
        break;
      case 'mark-complete-existing-record':
        onCompletionFlagSet && onCompletionFlagSet(true);
        break;
      case 'launcher-entry-point':
        onFlowLaunched && onFlowLaunched();
        onSessionStarted && onSessionStarted();
        break;
    }
  };

  const handlePress = () => {
    if (!enabled) return;
    if (validity === 'invalid') return;
    if (confirmGuard === 'confirm_dialog' && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    fire();
  };

  if (role === 'wizard-nav-back-next') {
    return (
      <View style={styles.navRow}>
        <WoolButton variant="secondary" size="medium" onPress={() => { onBackTapped && onBackTapped(); }} disabled={!enabled}>
          <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>Back</Text>
        </WoolButton>
        <WoolButton variant="blue" size="medium" onPress={() => { onNextTapped && onNextTapped(); }} disabled={!enabled || validity === 'invalid'}>
          <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>{label || 'Next'}</Text>
        </WoolButton>
      </View>
    );
  }

  return (
    <WoolButton variant={variant} size="medium" onPress={handlePress} disabled={!enabled} focused={role === 'two-state-toggle (mark-done / expand-all / reference-toggle)' && currentState}>
      <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
        {confirming ? `Tap again to ${label?.toLowerCase() || 'confirm'}` : (label || 'Action')}
      </Text>
    </WoolButton>
  );
});

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
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

export default ButtonSecondaryAction;
