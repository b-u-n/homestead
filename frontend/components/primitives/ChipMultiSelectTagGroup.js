import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import FreeTextShortInput from './FreeTextShortInput';
import Checkbox from './Checkbox';

// Normalize any saved/passed value into a flat array of string IDs. The
// primitive's source of truth is a string[], but historically activities
// sometimes saved arrays of `{label}` objects (when chips were authored as
// objects) — which broke `.includes(matchValue)` in downstream `showIfSelected`
// gates. Coerce here so the emitted shape is always a flat string array.
function normalizeSelection(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === 'string' ? v : (v?.id ?? v?.label)))
    .filter((v) => typeof v === 'string' && v.length > 0);
}

/**
 * chip-multi-select-tag-group — multi-select pills or vertical checkbox list.
 *
 * Renderer-injected props consumed (see activities/v2/_SCHEMA.md):
 *   - `selectedChipIds` — when an upstream `sourceStepId`/`sourceBind` resolves
 *     to an array of chip IDs, this filters `presetChips` down to only those
 *     IDs. Used by carry-forward flows where step 3 should only show the chips
 *     the user picked in step 2.
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
  // Renderer-injected (via sourceStepId/sourceBind): filter presetChips to
  // only those whose id/label is in this array. Untouched if null/undefined.
  selectedChipIds,
  onSelectionChanged,
  onChipAdded,
  onChipRemoved,
  onDownstreamWrite,
  onValueChanged,
}) => {
  const [customDraft, setCustomDraft] = useState('');
  const [draftKey, setDraftKey] = useState(0); // bumps to force-clear the input on add
  const [customChips, setCustomChips] = useState([]); // chips the user has added in this session, kept around even when deselected

  // Filter presetChips by renderer-injected `selectedChipIds` if present.
  // This lets a later step show only the chips picked earlier.
  const allPresets = presetChips || [];
  const items = Array.isArray(selectedChipIds) && selectedChipIds.length > 0
    ? allPresets.filter((c) => {
        const id = typeof c === 'string' ? c : (c?.id ?? c?.label);
        return selectedChipIds.includes(id);
      })
    : allPresets;

  // Source of truth: explicit `currentSelection` wins, then `value` from
  // auto-save, then []. Always normalized to a flat string array.
  const selection = normalizeSelection(
    Array.isArray(currentSelection) ? currentSelection : value
  );

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

  // Auto-flush an unsubmitted draft on unmount. If the user types a custom
  // entry and then navigates away (step Next) without pressing Enter / Add /
  // blurring the input, the text would otherwise be lost. The ref pattern
  // captures the latest draft for the unmount handler to read.
  const draftRef = useRef(customDraft);
  draftRef.current = customDraft;
  const addCustomRef = useRef(null);
  useEffect(() => {
    return () => {
      const pending = (draftRef.current || '').trim();
      if (pending && addCustomRef.current) addCustomRef.current(pending);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Wire the ref so the unmount effect above can flush a pending draft.
  addCustomRef.current = addCustom;

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
              onBlur={(text) => {
                // Auto-convert an unsubmitted draft to a chip on blur so the
                // user doesn't lose what they typed when they move to the
                // next step. Trimmed empty strings noop.
                const trimmed = (text || '').trim();
                if (trimmed) addCustom(trimmed);
              }}
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
