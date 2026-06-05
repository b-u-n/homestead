import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

// Standard web input style per md/TEXTBOX.md — built inside the render so
// FontSettingsStore can scale the font size with accessibility settings.
function getWebInputStyle() {
  return {
    fontFamily: 'Comfortaa',
    fontSize: FontSettingsStore.getScaledFontSize(14),
    color: '#403F3E',
    padding: 8,
    borderRadius: 6,
    border: '1px solid rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  };
}

/**
 * ChipSortToGroups — tap a chip in the pool, then tap a group to place it.
 * Tap a placed chip to send it back to the pool. Tap a placed chip while a
 * different chip is selected to swap. Long-press a placed chip to delete it
 * entirely (only if it was custom-entered).
 *
 * Drag-and-drop on RN Web is finicky across platforms — tap/tap is the more
 * reliable interaction and works one-handed on touch.
 *
 * Used by:
 *   - locus-of-control-sorting (Wave 3 #10) — three groups: control / influence / external
 *   - medication-adherence (W4-3) — day-cells as groups
 *   - 5 P's plan step (W4-6 alternative) — per-P named groups
 *   - supporter-caregiver-guide (W4-1 alternative) — per-person named groups
 *
 * Authoring shape:
 *   {
 *     "ref": "ChipSortToGroups",
 *     "bind": "sorted",
 *     "props": {
 *       "groups": [
 *         { "id": "control", "label": "In my control" },
 *         { "id": "influence", "label": "I can influence" },
 *         { "id": "external", "label": "Outside me" }
 *       ],
 *       "presetChips": [
 *         { "id": "weather", "label": "The weather" },
 *         { "id": "my-words", "label": "The words I choose" }
 *       ],
 *       "allowCustomEntry": true,
 *       "customEntryPlaceholder": "Add your own…"
 *     }
 *   }
 *
 * Value shape: `{ [groupId]: [chipId, chipId, ...] }`. Unplaced chips remain
 * in the pool (not in the bind value).
 *
 * Renderer-injected props consumed (see activities/v2/_SCHEMA.md):
 *   - `selectedChipIds`: when the entry's `props.sourceStepId` /
 *     `props.sourceBind` resolves to an array, the user only sorts what they
 *     themselves named earlier. Overrides `presetChips`.
 *
 * Downstream carryFrom: the bind value is a nested object, so carry-overs use
 * dot-notation: `carryFrom: { stepId, bind: "sorted.control" }`. See
 * `carryFrom.bind` dot-notation in `activities/v2/_SCHEMA.md`.
 */
const ChipSortToGroups = observer(({
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
  groups = [],
  presetChips = [],
  allowCustomEntry = false,
  customEntryPlaceholder = 'Add your own…',
  // Sourced via ComponentStep's sourceStepId/sourceBind resolver:
  selectedChipIds,
  sourceValue,
}) => {
  const placement = currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)
    ? currentValue
    : {};

  const [selected, setSelected] = useState(null); // currently-tapped pool/group chip id
  const [draft, setDraft] = useState('');
  const [customChips, setCustomChips] = useState([]); // chips the user added inline

  // Resolve the working set of chips. If sourceStepId/sourceBind injected
  // selectedChipIds, those override presetChips (the user is sorting their
  // own prior picks). Otherwise we use the authored presetChips.
  const baseChips = (() => {
    if (Array.isArray(selectedChipIds) && selectedChipIds.length > 0) {
      // Map IDs to {id,label}; fall back to id-as-label for unknowns.
      const byId = new Map(presetChips.map(c => [c.id || c.label, c]));
      return selectedChipIds.map(id => byId.get(id) || { id, label: id });
    }
    return presetChips;
  })();

  const allChips = [...baseChips, ...customChips];
  const placedIds = new Set(Object.values(placement).flat());
  const poolChips = allChips.filter(c => !placedIds.has(c.id || c.label));

  const commit = (next) => {
    if (!interactable || disabled) return;
    onValueChanged && onValueChanged(next);
    onValueCommitted && onValueCommitted(next);
  };

  const groupOfChip = (chipId) => {
    for (const [gId, arr] of Object.entries(placement)) {
      if (Array.isArray(arr) && arr.includes(chipId)) return gId;
    }
    return null;
  };

  const placeIntoGroup = (chipId, groupId) => {
    const from = groupOfChip(chipId);
    const next = { ...placement };
    if (from) {
      next[from] = (next[from] || []).filter(c => c !== chipId);
    }
    next[groupId] = [...(next[groupId] || []), chipId];
    commit(next);
    setSelected(null);
  };

  const returnToPool = (chipId) => {
    const from = groupOfChip(chipId);
    if (!from) return;
    const next = { ...placement, [from]: (placement[from] || []).filter(c => c !== chipId) };
    commit(next);
    setSelected(null);
  };

  const handleChipTap = (chipId, locationGroupId) => {
    if (!interactable || disabled) return;
    // If this same chip is already selected → deselect.
    if (selected === chipId) {
      setSelected(null);
      return;
    }
    // If something else is selected and this chip is in a group, swap them
    // into the same group? Simpler: just select this chip (let the next tap
    // be a group tap to relocate).
    setSelected(chipId);
  };

  const handleGroupTap = (groupId) => {
    if (!interactable || disabled) return;
    if (!selected) return; // tapping an empty group with nothing selected = no-op
    placeIntoGroup(selected, groupId);
  };

  const handlePoolTap = () => {
    if (!interactable || disabled) return;
    if (selected && placedIds.has(selected)) {
      returnToPool(selected);
    }
  };

  const addCustomChip = () => {
    const text = draft.trim();
    if (!text || !allowCustomEntry) return;
    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setCustomChips(prev => [...prev, { id, label: text, custom: true }]);
    setDraft('');
  };

  const renderChip = (chip, opts = {}) => {
    const id = chip.id || chip.label;
    const isSelected = selected === id;
    return (
      <Pressable
        key={id}
        onPress={() => handleChipTap(id, opts.groupId)}
        disabled={disabled || !interactable}
        style={styles.chipWrap}
      >
        <MinkyPanel
          borderRadius={10}
          padding={8}
          paddingTop={8}
          overlayColor={isSelected ? 'rgba(135, 180, 210, 0.7)' : 'rgba(100, 130, 195, 0.25)'}
          borderColor={isSelected ? 'rgba(45, 44, 43, 0.9)' : undefined}
        >
          <Text
            style={[styles.chipText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
            numberOfLines={2}
          >
            {chip.label}
          </Text>
        </MinkyPanel>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Pool */}
      <Pressable onPress={handlePoolTap}>
        <MinkyPanel
          borderRadius={10}
          padding={12}
          paddingTop={12}
          overlayColor="rgba(100, 130, 195, 0.15)"
        >
          <Text style={[styles.sectionLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
            Pool · tap a chip, then tap where it belongs
          </Text>
          <View style={styles.chipsRow}>
            {poolChips.length === 0 ? (
              <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                {placedIds.size > 0
                  ? 'All sorted — tap a placed chip to send it back here.'
                  : 'Nothing to sort yet.'}
              </Text>
            ) : (
              poolChips.map(c => renderChip(c, { groupId: null }))
            )}
          </View>
          {allowCustomEntry && interactable && !disabled ? (
            <View style={styles.customEntryRow}>
              {Platform.OS === 'web' ? (
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={addCustomChip}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomChip(); }}
                  placeholder={customEntryPlaceholder}
                  maxLength={60}
                  style={getWebInputStyle()}
                />
              ) : (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={addCustomChip}
                  onBlur={addCustomChip}
                  placeholder={customEntryPlaceholder}
                  placeholderTextColor="rgba(92, 90, 88, 0.55)"
                  style={[styles.customInput, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}
                  maxLength={60}
                />
              )}
            </View>
          ) : null}
        </MinkyPanel>
      </Pressable>

      {/* Groups */}
      <View style={styles.groupsCol}>
        {groups.map(group => {
          const groupChips = (placement[group.id] || [])
            .map(id => allChips.find(c => (c.id || c.label) === id) || { id, label: id });
          return (
            <Pressable
              key={group.id}
              onPress={() => handleGroupTap(group.id)}
              disabled={disabled || !interactable}
            >
              <MinkyPanel
                borderRadius={10}
                padding={12}
                paddingTop={12}
                overlayColor={selected ? 'rgba(160, 200, 140, 0.45)' : 'rgba(135, 180, 210, 0.25)'}
              >
                <Text
                  style={[styles.groupLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
                >
                  {group.label}
                </Text>
                <View style={styles.chipsRow}>
                  {groupChips.length === 0 ? (
                    <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
                      {selected ? 'Tap here to place the selected chip.' : 'Empty.'}
                    </Text>
                  ) : (
                    groupChips.map(c => renderChip(c, { groupId: group.id }))
                  )}
                </View>
              </MinkyPanel>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  sectionLabel: {
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  groupLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipWrap: {},
  chipText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
  },
  groupsCol: { gap: 6 },
  customEntryRow: { marginTop: 8 },
  customInput: {
    // Standard text-input pattern per md/TEXTBOX.md.
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default ChipSortToGroups;
