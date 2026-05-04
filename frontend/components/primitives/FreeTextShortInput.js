import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import StitchedBorder from '../StitchedBorder';

/**
 * free-text-short-input — single-line text entry.
 * Spec: ../_meta-canonical/free-text-short-input.json
 */
const FreeTextShortInput = observer(({
  placeholder = '',
  value = '',
  maxLength,
  suggestionChips = null,
  submitMode = 'blur-commit',
  interactable = true,
  onChange,
  onCommit,
  onEnterSpawnNew,
  onChipInserted,
  containerContext,
}) => {
  const [local, setLocal] = useState(value);

  // Sync only on meaningful, non-empty changes — see FreeTextMultilineArea
  // comment for rationale (avoid spurious clears from sibling re-renders).
  React.useEffect(() => {
    if (value == null || value === '') return;
    if (value === local) return;
    setLocal(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (next) => {
    if (!interactable) return;
    setLocal(next);
    onChange && onChange(next);
  };

  const commit = () => {
    if (!interactable) return;
    onCommit && onCommit(local);
  };

  const handleSubmit = () => {
    if (!interactable) return;
    commit();
    if (submitMode === 'enter-spawns-new-row') {
      onEnterSpawnNew && onEnterSpawnNew(local);
    }
  };

  const insertChip = (chip) => {
    if (!interactable) return;
    const next = local ? `${local} ${chip}` : chip;
    handleChange(next);
    onChipInserted && onChipInserted(chip);
  };

  // Note: raw <input> on web doesn't accept RN's paddingVertical/Horizontal shorthands.
  // Splitting into explicit top/bottom/left/right.
  const inputStyle = {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: FontSettingsStore.getScaledFontSize(16),
    color: FontSettingsStore.getFontColor('#2D2C2B'),
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 22,
    paddingRight: 22,
    minHeight: 56,
  };

  return (
    <View style={styles.wrapper}>
      <StitchedBorder borderRadius={10} style={styles.borderWrap}>
        <View style={styles.inputRow}>
          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={local}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={!interactable}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => submitMode !== 'autosave-debounced' && commit()}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              style={{
                ...inputStyle,
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          ) : (
            <TextInput
              value={local}
              placeholder={placeholder}
              placeholderTextColor="rgba(69, 67, 66, 0.45)"
              maxLength={maxLength}
              editable={interactable}
              onChangeText={handleChange}
              onBlur={() => submitMode !== 'autosave-debounced' && commit()}
              onSubmitEditing={handleSubmit}
              returnKeyType={submitMode === 'enter-spawns-new-row' ? 'next' : 'done'}
              style={[inputStyle, { flex: 1 }]}
            />
          )}
        </View>
      </StitchedBorder>
      {suggestionChips?.length ? (
        <View style={styles.chipRow}>
          {suggestionChips.map((chip, i) => (
            <Pressable key={i} onPress={() => insertChip(chip)}>
              <MinkyPanel
                borderRadius={14}
                padding={6}
                paddingTop={6}
                overlayColor="rgba(100, 130, 195, 0.25)"
              >
                <Text style={[styles.chipLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                  {chip}
                </Text>
              </MinkyPanel>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  borderWrap: { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    paddingHorizontal: 4,
  },
});

export default FreeTextShortInput;
