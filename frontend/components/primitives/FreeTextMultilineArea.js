import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import StitchedBorder from '../StitchedBorder';

const SIZE_ROWS = {
  'compact-small': 2,
  'medium': 4,
  'large-writable': 7,
  'full-card': 10,
};

/**
 * free-text-multiline-area — textarea + action-plan editor.
 */
const FreeTextMultilineArea = observer(({
  promptText,
  placeholder = '',
  value = '',
  size = 'medium',
  scaffoldingChips = null,
  starterPromptChips = null,
  saveMode = 'save-on-blur',
  writeThroughTarget = null,
  required = false,
  subFields = null,
  anchorLabel,
  commitmentLabel,
  interactable = true,
  onChange,
  onCommit,
  onChipInserted,
  onWriteThrough,
  onPlanCommitted,
}) => {
  const isActionPlan = Array.isArray(subFields) && subFields.length > 0;
  const [local, setLocal] = useState(value);
  const [planValues, setPlanValues] = useState(() => {
    if (!isActionPlan) return null;
    const seed = {};
    subFields.forEach(f => { seed[f.id] = f.value || ''; });
    return seed;
  });
  const [committed, setCommitted] = useState(false);

  // Sync `local` from `value` only when the parent's value is meaningfully
  // different from what we already have AND non-empty. Without this guard, any
  // transient render that produces an undefined/empty `value` (e.g. a sibling
  // component triggers a parent re-render mid-edit) wipes the textarea.
  React.useEffect(() => {
    if (isActionPlan) return;
    if (value == null || value === '') return;
    if (value === local) return;
    setLocal(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isActionPlan]);

  const rows = SIZE_ROWS[size] || 4;
  // Both minHeight and lineHeight need to track the rendered font size — the
  // workbook bump (+30%) grows glyphs, so the line slot + minimum textarea
  // height need to grow with them or the input feels cramped.
  const scaledFontSize = FontSettingsStore.getScaledFontSize(16);
  const scaledLineHeight = Math.round(scaledFontSize * 1.4);
  const minHeight = rows * scaledLineHeight + 36;

  // Note: raw <textarea> / <input> on web doesn't accept RN's paddingVertical/Horizontal
  // shorthands — splitting into explicit top/bottom/left/right.
  const inputStyle = {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    fontSize: scaledFontSize,
    color: FontSettingsStore.getFontColor('#2D2C2B'),
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 22,
    paddingRight: 22,
    minHeight,
    lineHeight: scaledLineHeight,
    textAlign: 'left',
    textAlignVertical: 'top',
  };

  const handleChange = (next) => {
    if (!interactable) return;
    setLocal(next);
    onChange && onChange(next);
    if (saveMode === 'autosave-on-type') onCommit && onCommit(next);
  };

  const handleBlur = () => {
    if (!interactable) return;
    if (saveMode === 'save-on-blur') {
      onCommit && onCommit(local);
      if (writeThroughTarget) onWriteThrough && onWriteThrough({ target: writeThroughTarget, content: local });
    }
  };

  const insertChip = (chip, mode = 'append') => {
    if (!interactable) return;
    const insert =
      mode === 'bullet'
        ? (local ? `${local.replace(/\s+$/, '')}\n• ${chip}` : `• ${chip}`)
        : (local ? `${local} ${chip}` : chip);
    handleChange(insert);
    onChipInserted && onChipInserted(chip);
  };

  const handlePlanField = (id, val) => {
    if (!interactable) return;
    const next = { ...planValues, [id]: val };
    setPlanValues(next);
    onChange && onChange(next);
  };

  const handlePlanCommit = () => {
    if (!interactable) return;
    onCommit && onCommit(planValues);
    onPlanCommitted && onPlanCommitted(planValues);
    setCommitted(true);
  };

  // Auto-grow on web: reset height to auto, then snap to scrollHeight so the
  // textarea always fits its content. The user can't manually drag-resize
  // (resize: 'none') — that handle was crashing layout for some users.
  const autoGrow = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const renderTextarea = () => (
    <StitchedBorder borderRadius={10} style={styles.borderWrap}>
      {Platform.OS === 'web' ? (
        // CRITICAL: lineHeight must be a string with 'px' unit when applied to a raw <textarea>.
        // React serializes unitless numbers as bare values for line-height, which CSS interprets
        // as a unitless multiplier (24× font-size = ~384px line-height — text floats midway).
        <textarea
          ref={autoGrow}
          value={local}
          placeholder={placeholder}
          disabled={!interactable}
          onChange={(e) => { handleChange(e.target.value); autoGrow(e.target); }}
          onBlur={handleBlur}
          rows={rows}
          style={{
            ...inputStyle,
            lineHeight: `${scaledLineHeight}px`,
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'Comfortaa',
            verticalAlign: 'top',
            display: 'block',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <TextInput
          value={local}
          placeholder={placeholder}
          placeholderTextColor="rgba(69, 67, 66, 0.45)"
          editable={interactable}
          onChangeText={handleChange}
          onBlur={handleBlur}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          style={inputStyle}
        />
      )}
    </StitchedBorder>
  );

  if (isActionPlan) {
    return (
      <View style={styles.wrapper}>
        {anchorLabel ? (
          <Text style={[styles.anchorLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            {anchorLabel}
          </Text>
        ) : null}
        {subFields.map(field => (
          <View key={field.id} style={styles.planFieldRow}>
            <Text style={[styles.fieldLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              {field.label}
            </Text>
            <StitchedBorder borderRadius={8} style={styles.borderWrap}>
              {Platform.OS === 'web' ? (
                <input
                  type="text"
                  value={planValues[field.id]}
                  placeholder={field.placeholder || ''}
                  disabled={!interactable}
                  onChange={(e) => handlePlanField(field.id, e.target.value)}
                  style={{ ...inputStyle, lineHeight: '20px', minHeight: 48, paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14, width: '100%', background: 'transparent', border: 'none', outline: 'none' }}
                />
              ) : (
                <TextInput
                  value={planValues[field.id]}
                  placeholder={field.placeholder || ''}
                  placeholderTextColor="rgba(69, 67, 66, 0.45)"
                  editable={interactable}
                  onChangeText={(v) => handlePlanField(field.id, v)}
                  style={[inputStyle, { minHeight: 48, paddingVertical: 12, paddingHorizontal: 14 }]}
                />
              )}
            </StitchedBorder>
          </View>
        ))}
        {commitmentLabel ? (
          <Pressable
            onPress={handlePlanCommit}
            style={styles.commitBtn}
          >
            <MinkyPanel
              borderRadius={12}
              padding={10}
              paddingTop={10}
              overlayColor={committed ? 'rgba(135, 180, 210, 0.55)' : 'rgba(112, 68, 199, 0.2)'}
            >
              <Text style={[styles.commitText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                {committed ? '✓ ' : ''}{commitmentLabel}
              </Text>
            </MinkyPanel>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {promptText ? (
        <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
          {promptText}
          {required ? ' *' : ''}
        </Text>
      ) : null}
      {starterPromptChips?.length ? (
        <View style={styles.chipRow}>
          {starterPromptChips.map((chip, i) => (
            <Pressable key={i} onPress={() => insertChip(chip, 'bullet')}>
              <MinkyPanel borderRadius={14} padding={6} paddingTop={6} overlayColor="rgba(100, 130, 195, 0.25)">
                <Text style={[styles.chipLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>{chip}</Text>
              </MinkyPanel>
            </Pressable>
          ))}
        </View>
      ) : null}
      {renderTextarea()}
      {scaffoldingChips?.length ? (
        <View style={styles.chipRow}>
          {scaffoldingChips.map((chip, i) => (
            <Pressable key={i} onPress={() => insertChip(chip)}>
              <MinkyPanel borderRadius={14} padding={6} paddingTop={6} overlayColor="rgba(100, 130, 195, 0.25)">
                <Text style={[styles.chipLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>{chip}</Text>
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
  prompt: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  anchorLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fieldLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  planFieldRow: { gap: 2 },
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
  commitBtn: { alignSelf: 'flex-start', marginTop: 4 },
  commitText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    paddingHorizontal: 6,
  },
});

export default FreeTextMultilineArea;
