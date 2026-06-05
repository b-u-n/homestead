import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, TextInput, Linking } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * chip-suggestion-or-action — pill that inserts payload or fires an action.
 */
const ChipSuggestionOrAction = observer(({
  label,
  value = '',
  payload,
  role = 'suggestion-tap-to-insert',
  insertionMode = 'append-line',
  actionType = 'none',
  targetFieldRef,
  allowFreeType = false,
  interactable = true,
  onChipTapped,
  onPayloadInserted,
  onActionFired,
  onValueChanged,
  onValueCommitted,
}) => {
  const [draft, setDraft] = useState(value);

  React.useEffect(() => { setDraft(value); }, [value]);

  const handleSuggestionTap = () => {
    if (!interactable) return;
    onChipTapped && onChipTapped({ label, payload });
    onPayloadInserted && onPayloadInserted({
      payload: payload ?? label,
      mode: insertionMode,
      targetFieldRef,
    });
  };

  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2400);
  };

  const handleActionTap = async () => {
    if (!interactable) return;
    onChipTapped && onChipTapped({ label, actionType });
    const value = payload || label;

    if (actionType === 'tel-dial') {
      const tel = String(value).replace(/[^\d+]/g, '');
      try {
        await Linking.openURL(`tel:${tel}`);
        showFeedback(`Calling ${value}…`);
        onActionFired && onActionFired({ actionType: 'tel-dial', value });
        return;
      } catch {
        // Fall through to clipboard fallback
      }
      if (Platform.OS === 'web') {
        try {
          if (navigator?.clipboard) await navigator.clipboard.writeText(value);
          showFeedback(`${value} copied to clipboard`);
          onActionFired && onActionFired({ actionType: 'copy-to-clipboard', value });
          return;
        } catch {}
      }
      showFeedback(`Could not place call — number: ${value}`);
      return;
    }

    if (actionType === 'platform-deep-link') {
      try {
        await Linking.openURL(String(value));
        showFeedback('Opening…');
        onActionFired && onActionFired({ actionType, value });
        return;
      } catch {}
      showFeedback('Could not open link.');
      return;
    }

    if (actionType === 'copy-to-clipboard') {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        try {
          await navigator.clipboard.writeText(value);
          showFeedback('Copied to clipboard');
          onActionFired && onActionFired({ actionType, value });
          return;
        } catch {}
      }
      showFeedback('Copy failed');
      return;
    }

    onActionFired && onActionFired({ actionType, payload, targetFieldRef });
  };

  if (role === 'chip-as-text-input' || (role === 'suggestion-tap-to-insert' && allowFreeType)) {
    return (
      <View style={styles.inputWrap}>
        <MinkyPanel borderRadius={14} padding={4} paddingTop={4} overlayColor="rgba(100, 130, 195, 0.25)">
          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={draft}
              placeholder={label || ''}
              disabled={!interactable}
              onChange={(e) => { if (!interactable) return; setDraft(e.target.value); onValueChanged && onValueChanged(e.target.value); }}
              onBlur={() => { if (!interactable) return; onValueCommitted && onValueCommitted(draft); }}
              onKeyDown={(e) => { if (!interactable) return; if (e.key === 'Enter') onValueCommitted && onValueCommitted(draft); }}
              style={{
                ...inputStyleObj,
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          ) : (
            <TextInput
              value={draft}
              placeholder={label || ''}
              placeholderTextColor="rgba(69, 67, 66, 0.45)"
              editable={interactable}
              onChangeText={(v) => { if (!interactable) return; setDraft(v); onValueChanged && onValueChanged(v); }}
              onBlur={() => { if (!interactable) return; onValueCommitted && onValueCommitted(draft); }}
              style={[inputStyleObj, { minWidth: 80 }]}
            />
          )}
        </MinkyPanel>
      </View>
    );
  }

  const onPress = role === 'link-action-fire' ? handleActionTap : handleSuggestionTap;

  return (
    <View style={{ alignSelf: 'flex-start', gap: 4 }}>
      <Pressable onPress={onPress} hitSlop={6}>
        <MinkyPanel borderRadius={14} padding={8} paddingTop={8} overlayColor="rgba(100, 130, 195, 0.25)">
          <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(13) }]} numberOfLines={1}>
            {role === 'link-action-fire' && actionType === 'tel-dial' ? '📞 ' : ''}
            {label}
          </Text>
        </MinkyPanel>
      </Pressable>
      {feedback ? (
        <Text style={[styles.feedback, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
});

const inputStyleObj = {
  fontFamily: 'Comfortaa',
  fontWeight: '600',
  fontSize: 13,
  color: '#2D2C2B',
  paddingVertical: 4,
  paddingHorizontal: 8,
};

const styles = StyleSheet.create({
  inputWrap: { alignSelf: 'flex-start' },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  feedback: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ChipSuggestionOrAction;
