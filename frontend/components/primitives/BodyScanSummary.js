import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

const REGION_LABELS = {
  head: 'Head',
  chest: 'Chest',
  back: 'Back',
  stomach: 'Stomach',
  pelvis: 'Pelvis',
  'left-arm': 'Left arm',
  'right-arm': 'Right arm',
  'left-leg': 'Left leg',
  'right-leg': 'Right leg',
  heart: 'Heart',
  'upper-front': 'Upper front',
  'lower-front': 'Lower front',
  'upper-back': 'Upper back',
  'lower-back': 'Lower back',
};

/**
 * BodyScanSummary — read-only review of the per-region notes captured in an
 * earlier `BodySilhouetteWithZones` step (notesEnabled mode). Reads from
 * `allResponses[sourceStepId][sourceBindKey]` (a `{ regionId: noteText }` map)
 * and renders one card per region with a note.
 */
const BodyScanSummary = observer(({
  sourceStepId = 'scan',
  sourceBindKey = 'noticed_zones',
  title = 'What you noticed',
  emptyText = "You didn't note any sensations this time. That's also data — coming back later, you might notice more.",
  allResponses,
}) => {
  const sourceStep = allResponses?.[sourceStepId];
  const notes = (sourceStep && typeof sourceStep === 'object') ? (sourceStep[sourceBindKey] || {}) : {};
  const entries = Object.entries(notes)
    .filter(([_, note]) => typeof note === 'string' && note.trim())
    .map(([regionId, note]) => ({ regionId, label: REGION_LABELS[regionId] || regionId, note }));

  return (
    <MinkyPanel borderRadius={14} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
      <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>{title}</Text>
      {entries.length === 0 ? (
        <Text style={[styles.empty, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{emptyText}</Text>
      ) : (
        <View style={styles.list}>
          {entries.map(e => (
            <View key={e.regionId} style={styles.row}>
              <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>{e.label}</Text>
              <Text style={[styles.note, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{e.note}</Text>
            </View>
          ))}
        </View>
      )}
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  empty: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  list: { gap: 12 },
  row: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    gap: 4,
  },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  note: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default BodyScanSummary;
