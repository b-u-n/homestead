import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import StitchedBorder from '../StitchedBorder';
import WoolButton from '../WoolButton';

/**
 * body-silhouette-with-zones — anatomical body canvas with tappable regions.
 * Spec: ../_meta-canonical/body-silhouette-with-zones.json
 *
 * Implemented with positioned View shapes (no SVG dep). Zones use percentage layout where
 * `top`/`left` are the top-left corner of the region (not the center).
 *
 * Every region carries a clear dashed outline + label so all are visible regardless of
 * active/visited state — accessibility-first.
 */
const REGION_LAYOUT = {
  'head-to-toe-classic': [
    { id: 'head', label: 'Head', top: 2, left: 38, width: 24, height: 14, shape: 'oval' },
    { id: 'chest', label: 'Chest', top: 18, left: 30, width: 40, height: 12, shape: 'box' },
    { id: 'back', label: 'Back', top: 31, left: 32, width: 36, height: 5, shape: 'box' },
    { id: 'stomach', label: 'Stomach', top: 37, left: 32, width: 36, height: 11, shape: 'box' },
    { id: 'pelvis', label: 'Pelvis', top: 50, left: 32, width: 36, height: 10, shape: 'box' },
    { id: 'left-arm', label: 'L arm', top: 18, left: 8, width: 18, height: 30, shape: 'box' },
    { id: 'right-arm', label: 'R arm', top: 18, left: 74, width: 18, height: 30, shape: 'box' },
    { id: 'left-leg', label: 'L leg', top: 62, left: 30, width: 18, height: 32, shape: 'box' },
    { id: 'right-leg', label: 'R leg', top: 62, left: 52, width: 18, height: 32, shape: 'box' },
  ],
  'chest-stomach-heart': [
    { id: 'heart', label: 'Heart', top: 22, left: 36, width: 18, height: 14, shape: 'oval' },
    { id: 'chest', label: 'Chest', top: 14, left: 28, width: 44, height: 28, shape: 'box' },
    { id: 'stomach', label: 'Stomach', top: 44, left: 30, width: 40, height: 22, shape: 'box' },
  ],
  'front-back-quadrants': [
    { id: 'upper-front', label: 'Upper front', top: 8, left: 14, width: 32, height: 36, shape: 'box' },
    { id: 'lower-front', label: 'Lower front', top: 50, left: 14, width: 32, height: 36, shape: 'box' },
    { id: 'upper-back', label: 'Upper back', top: 8, left: 54, width: 32, height: 36, shape: 'box' },
    { id: 'lower-back', label: 'Lower back', top: 50, left: 54, width: 32, height: 36, shape: 'box' },
  ],
};

const BodySilhouetteWithZones = observer(({
  regionTaxonomy = 'head-to-toe-classic',
  selectedRegionIds: selectedProp,
  regionStateMap,
  interactionMode = 'tap-to-toggle',
  advanceDriver = 'self-tap',
  width = 240,
  height = 380,
  // notesEnabled: when true, value is a `{ regionId: noteText }` map and a
  // side panel lets the user write+submit a note about each tapped region.
  // notesEnabled=false (default): value is a string[] of selected region IDs.
  notesEnabled = false,
  value: valueProp,
  currentValue,
  interactable = true,
  onRegionTapped,
  onRegionToggled,
  onRegionPainted,
  onRegionCompleted,
  onScanFinished,
  onEmotionBodyMapSaved,
  onValueChanged,
}) => {
  const regions = REGION_LAYOUT[regionTaxonomy] || REGION_LAYOUT['head-to-toe-classic'];
  // Notes-mode reads `value` as an object; default-mode reads `value` as an array.
  const notesValueProp = notesEnabled ? valueProp : undefined;
  const selectedValueProp = !notesEnabled
    ? (Array.isArray(valueProp) ? valueProp : (Array.isArray(currentValue) ? currentValue : undefined))
    : undefined;
  // Seed internal state from the persisted value so resume restores selection.
  const [internalSelected, setInternalSelected] = useState(() =>
    Array.isArray(selectedValueProp) ? selectedValueProp : []
  );
  const [activeRegionId, setActiveRegionId] = useState(null);
  const [draft, setDraft] = useState('');
  const stateOf = (id) => regionStateMap?.find(r => r.region_id === id || r.regionId === id);

  const notes = notesEnabled ? (notesValueProp && typeof notesValueProp === 'object' ? notesValueProp : {}) : null;
  const noteRegionIds = notesEnabled ? Object.keys(notes).filter(id => (notes[id] || '').trim()) : [];

  const selectedIds = notesEnabled
    ? noteRegionIds
    : (selectedProp !== undefined
        ? selectedProp
        : (selectedValueProp !== undefined ? selectedValueProp : internalSelected));
  const isSelected = (id) => selectedIds.includes(id);

  const handleTap = (region) => {
    if (!interactable) return;
    if (interactionMode === 'read-only') return;
    onRegionTapped && onRegionTapped(region.id);

    if (notesEnabled) {
      // In notes mode, tapping focuses the side panel on this region.
      // Submitted note for this region (if any) populates the textarea.
      setActiveRegionId(region.id);
      setDraft(notes[region.id] || '');
      return;
    }

    if (interactionMode === 'paint-fill' || interactionMode === 'radial-gradient-place') {
      onRegionPainted && onRegionPainted(region.id);
    }
    const wasSelected = isSelected(region.id);
    const next = wasSelected
      ? selectedIds.filter(id => id !== region.id)
      : [...selectedIds, region.id];
    if (selectedProp === undefined) setInternalSelected(next);
    onRegionToggled && onRegionToggled({ id: region.id, selected: !wasSelected, all: next });
    // Persist the new selection array for v2 auto-save (R4).
    onValueChanged && onValueChanged(next);
  };

  const clearAll = () => {
    if (!interactable) return;
    if (selectedProp === undefined) setInternalSelected([]);
    onRegionToggled && onRegionToggled({ id: null, selected: false, all: [] });
    onValueChanged && onValueChanged([]);
  };

  const submitNote = () => {
    if (!interactable) return;
    if (!notesEnabled || !activeRegionId) return;
    const trimmed = (draft || '').trim();
    const next = { ...notes };
    if (trimmed) next[activeRegionId] = trimmed;
    else delete next[activeRegionId];
    onValueChanged && onValueChanged(next);
    setActiveRegionId(null);
    setDraft('');
  };

  const cancelNote = () => {
    setActiveRegionId(null);
    setDraft('');
  };

  const removeNote = (regionId) => {
    if (!interactable) return;
    if (!notesEnabled) return;
    const next = { ...notes };
    delete next[regionId];
    onValueChanged && onValueChanged(next);
    if (activeRegionId === regionId) {
      setActiveRegionId(null);
      setDraft('');
    }
  };

  const selectedLabels = selectedIds.map(id => regions.find(r => r.id === id)?.label).filter(Boolean);
  const activeRegion = activeRegionId ? regions.find(r => r.id === activeRegionId) : null;

  const silhouette = (
    <View style={[styles.canvasWrap, { width }]}>
      <View style={[styles.canvas, { width, height }]}>
        {regions.map((r) => {
          const sel = isSelected(r.id);
          const isActive = notesEnabled && activeRegionId === r.id;
          const state = stateOf(r.id);
          const fill = state?.color
            ?? (isActive ? 'rgba(112, 68, 199, 0.55)' : sel ? 'rgba(135, 180, 210, 0.75)' : 'rgba(255, 255, 255, 0.55)');
          const isOval = r.shape === 'oval';
          return (
            <Pressable
              key={r.id}
              onPress={() => handleTap(r)}
              accessibilityLabel={`${r.label} — ${sel ? 'selected, tap to deselect' : 'tap to select'}`}
              style={[
                styles.region,
                {
                  top: `${r.top}%`,
                  left: `${r.left}%`,
                  width: `${r.width}%`,
                  height: `${r.height}%`,
                  borderRadius: isOval ? 9999 : 8,
                  backgroundColor: fill,
                  borderWidth: (sel || isActive) ? 3 : 2,
                  borderColor: isActive ? '#7044C7' : sel ? '#7044C7' : 'rgba(92, 90, 88, 0.65)',
                  borderStyle: 'dashed',
                },
              ]}
            >
              <Text
                style={[
                  styles.regionLabel,
                  sel && styles.regionLabelActive,
                  { fontSize: FontSettingsStore.getScaledFontSize(10) },
                ]}
                numberOfLines={1}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!notesEnabled && (
        <View style={styles.readoutRow}>
          <Text style={[styles.activeReadout, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            {selectedLabels.length === 0
              ? 'Tap any zone to select. Tap again to deselect.'
              : `Selected (${selectedLabels.length}): ${selectedLabels.join(', ')}`}
          </Text>
          {selectedLabels.length ? (
            <Pressable onPress={clearAll} hitSlop={6} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>clear all</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );

  if (!notesEnabled) return silhouette;

  // Notes mode: silhouette LEFT, write+submit panel RIGHT, submitted notes list below.
  const submittedEntries = noteRegionIds
    .map(id => ({ id, label: regions.find(r => r.id === id)?.label || id, note: notes[id] }))
    .filter(e => e.note);

  const inputBase = {
    fontFamily: 'Comfortaa',
    fontSize: FontSettingsStore.getScaledFontSize(14),
    color: '#2D2C2B',
    minHeight: 96,
    padding: 10,
  };

  return (
    <View style={styles.notesRoot}>
      <View style={styles.notesRow}>
        {silhouette}
        <View style={styles.notesPanel}>
          {activeRegion ? (
            <>
              <Text style={[styles.notesPrompt, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                What do you notice in your <Text style={styles.notesPromptStrong}>{activeRegion.label.toLowerCase()}</Text>?
              </Text>
              <StitchedBorder borderRadius={10} style={styles.notesInputWrap}>
                {Platform.OS === 'web' ? (
                  <textarea
                    value={draft}
                    placeholder="Warmth, tightness, ease, ache… just describe."
                    onChange={(e) => {
                      if (!interactable) return;
                      setDraft(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    disabled={!interactable}
                    rows={4}
                    style={{
                      ...inputBase,
                      lineHeight: '20px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      overflow: 'hidden',
                      verticalAlign: 'top',
                      display: 'block',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <TextInput
                    value={draft}
                    placeholder="Warmth, tightness, ease, ache… just describe."
                    placeholderTextColor="rgba(69, 67, 66, 0.45)"
                    onChangeText={(v) => { if (!interactable) return; setDraft(v); }}
                    editable={interactable}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={inputBase}
                  />
                )}
              </StitchedBorder>
              <View style={styles.notesBtnRow}>
                <WoolButton onPress={submitNote} variant="purple" size="small" disabled={!(draft || '').trim()}>
                  Submit
                </WoolButton>
                <WoolButton onPress={cancelNote} variant="purple" size="small" overlayColor="rgba(100, 130, 195, 0.25)">
                  Cancel
                </WoolButton>
              </View>
            </>
          ) : (
            <Text style={[styles.notesIdle, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              Tap a body part on the left to write what you notice there.
            </Text>
          )}
        </View>
      </View>
      {submittedEntries.length > 0 && (
        <View style={styles.submittedWrap}>
          <Text style={[styles.submittedHeader, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            What you've noticed so far
          </Text>
          {submittedEntries.map(e => (
            <View key={e.id} style={styles.submittedRow}>
              <View style={styles.submittedTextWrap}>
                <Text style={[styles.submittedLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>{e.label}</Text>
                <Text style={[styles.submittedNote, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{e.note}</Text>
              </View>
              <Pressable onPress={() => removeNote(e.id)} hitSlop={6} style={styles.submittedRemove}>
                <Text style={styles.submittedRemoveText}>remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  canvasWrap: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  canvas: {
    position: 'relative',
    backgroundColor: 'rgba(100, 130, 195, 0.08)',
    borderRadius: 16,
  },
  region: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    paddingHorizontal: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  regionLabelActive: {
    color: '#2D2C2B',
  },
  activeReadout: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  readoutRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  notesRoot: { gap: 16, alignSelf: 'stretch' },
  notesRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  notesPanel: { flex: 1, gap: 10 },
  notesPrompt: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  notesPromptStrong: { fontWeight: '700', color: '#7044C7' },
  notesIdle: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  notesInputWrap: { backgroundColor: 'rgba(255, 255, 255, 0.55)', borderRadius: 10 },
  notesBtnRow: { flexDirection: 'row', gap: 10 },
  submittedWrap: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  submittedHeader: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  submittedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  submittedTextWrap: { flex: 1, gap: 2 },
  submittedLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  submittedNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  submittedRemove: { paddingHorizontal: 6, paddingVertical: 2 },
  submittedRemoveText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#9B5454',
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default BodySilhouetteWithZones;
