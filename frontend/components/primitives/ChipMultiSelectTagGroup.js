import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import FreeTextShortInput from './FreeTextShortInput';
import Checkbox from './Checkbox';

/**
 * chip-multi-select-tag-group — multi-select pills or vertical checkbox list.
 * Spec: ../_meta-canonical/chip-multi-select-tag-group.json
 */
const ChipMultiSelectTagGroup = observer(({
  presetChips = [],
  currentSelection,
  value,
  allowCustomEntry = false,
  guidingQuestionText,
  scopeKey,
  rendering = 'chip-strip',
  rowFormat = 'name-only',
  minSelection,
  maxSelection,
  interactable = true,
  onSelectionChanged,
  onChipAdded,
  onChipRemoved,
  onDownstreamWrite,
  onValueChanged,
}) => {
  const [customDraft, setCustomDraft] = useState('');
  const [draftKey, setDraftKey] = useState(0); // bumps to force-clear the input on add
  const [customChips, setCustomChips] = useState([]); // chips the user has added in this session, kept around even when deselected
  const items = presetChips || [];
  // Source of truth: explicit `currentSelection` wins, then `value` from auto-save, then [].
  const selection = Array.isArray(currentSelection)
    ? currentSelection
    : (Array.isArray(value) ? value : []);

  const itemId = (it) => typeof it === 'string' ? it : (it.id || it.label);
  const itemLabel = (it) => typeof it === 'string' ? it : it.label;
  const itemDesc = (it) => typeof it === 'string' ? null : it.short_description;
  const itemExamples = (it) => typeof it === 'string' ? null : it.examples;

  const isSelected = (it) => selection.includes(itemId(it));
  const presetIds = new Set(items.map(itemId));
  // Custom chips visible in UI = local-added (kept even when deselected) ∪ selected-but-not-preset (rehydrated from saved value).
  const customChipsVisible = Array.from(new Set([
    ...customChips,
    ...selection.filter(s => !presetIds.has(s)),
  ]));

  const emit = (next) => {
    onSelectionChanged && onSelectionChanged(next);
    onValueChanged && onValueChanged(next);
  };

  const toggle = (it) => {
    if (!interactable) return;
    const id = itemId(it);
    let next;
    if (selection.includes(id)) {
      next = selection.filter(s => s !== id);
      onChipRemoved && onChipRemoved(id);
    } else {
      if (maxSelection && selection.length >= maxSelection) return;
      next = [...selection, id];
    }
    emit(next);
    onDownstreamWrite && onDownstreamWrite({ scopeKey, selection: next });
  };

  const clearDraft = () => {
    setCustomDraft('');
    setDraftKey(k => k + 1);
  };

  const addCustom = (raw) => {
    if (!interactable) return;
    const val = (raw || '').trim();
    if (!val) return clearDraft();
    if (selection.includes(val)) return clearDraft();
    if (presetIds.has(val)) {
      // Treat as selecting an existing preset, not a new custom entry.
      const next = [...selection, val];
      emit(next);
      onDownstreamWrite && onDownstreamWrite({ scopeKey, selection: next });
      return clearDraft();
    }
    if (maxSelection != null && selection.length >= maxSelection) return;
    const next = [...selection, val];
    setCustomChips(prev => prev.includes(val) ? prev : [...prev, val]);
    onChipAdded && onChipAdded(val);
    emit(next);
    onDownstreamWrite && onDownstreamWrite({ scopeKey, selection: next });
    clearDraft();
  };

  const isCheckList = rendering === 'checkbox-list-vertical';

  return (
    <View style={styles.wrapper}>
      {guidingQuestionText ? (
        <Text style={[styles.question, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
          {guidingQuestionText}
        </Text>
      ) : null}
      {isCheckList ? (
        <View style={styles.checkList}>
          {items.map((it, i) => (
            <Checkbox
              key={i}
              checked={isSelected(it)}
              onToggle={() => toggle(it)}
              title={itemLabel(it)}
              description={rowFormat === 'name-plus-short-description' ? itemDesc(it) : null}
              examples={itemExamples(it)}
            />
          ))}
          {customChipsVisible.map((custom, i) => (
            <Checkbox
              key={`custom-${custom}`}
              checked={selection.includes(custom)}
              onToggle={() => toggle(custom)}
              title={custom}
            />
          ))}
        </View>
      ) : (
        <View style={styles.chipRow}>
          {items.map((it, i) => {
            const sel = isSelected(it);
            return (
              <Pressable key={i} onPress={() => toggle(it)}>
                <MinkyPanel
                  borderRadius={14}
                  padding={6}
                  paddingTop={6}
                  overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                  borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
                >
                  <Text style={[styles.chipLabel, sel && styles.chipLabelSel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                    {itemLabel(it)}
                  </Text>
                </MinkyPanel>
              </Pressable>
            );
          })}
          {customChipsVisible.map((custom) => {
            const sel = selection.includes(custom);
            return (
              <Pressable key={`custom-${custom}`} onPress={() => toggle(custom)}>
                <MinkyPanel
                  borderRadius={14}
                  padding={6}
                  paddingTop={6}
                  overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                  borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
                >
                  <Text style={[styles.chipLabel, sel && styles.chipLabelSel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                    {custom}
                  </Text>
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>
      )}
      {allowCustomEntry ? (
        <View style={styles.customRow}>
          <View style={styles.customInputWrap}>
            <FreeTextShortInput
              key={draftKey}
              placeholder="Add your own…"
              value={customDraft}
              onChange={setCustomDraft}
              submitMode="enter-spawns-new-row"
              onEnterSpawnNew={addCustom}
            />
          </View>
          <Pressable
            onPress={() => addCustom(customDraft.trim())}
            disabled={!interactable || !customDraft.trim() || (maxSelection != null && selection.length >= maxSelection)}
          >
            <MinkyPanel
              borderRadius={14}
              padding={8}
              paddingTop={8}
              overlayColor={
                !customDraft.trim() || (maxSelection != null && selection.length >= maxSelection)
                  ? 'rgba(100, 130, 195, 0.18)'
                  : 'rgba(135, 180, 210, 0.55)'
              }
              borderColor="rgba(92, 90, 88, 0.55)"
            >
              <Text style={[styles.addBtnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                Add
              </Text>
            </MinkyPanel>
          </Pressable>
        </View>
      ) : null}
      {minSelection && selection.length < minSelection ? (
        <Text style={[styles.hint, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          Pick at least {minSelection}.
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  question: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chipLabelSel: { fontWeight: '700' },
  checkList: { gap: 6 },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  checkBox: {
    color: 'rgba(69, 67, 66, 0.5)',
    width: 22,
    textAlign: 'center',
  },
  checkBoxOn: { color: '#7044C7' },
  checkBody: { flex: 1 },
  checkLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  checkLabelSel: { fontWeight: '700' },
  checkDesc: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  customInputWrap: { flex: 1 },
  addBtnLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  hint: {
    fontFamily: 'Comfortaa',
    color: 'rgba(69, 67, 66, 0.65)',
    fontStyle: 'italic',
  },
});

export default ChipMultiSelectTagGroup;
