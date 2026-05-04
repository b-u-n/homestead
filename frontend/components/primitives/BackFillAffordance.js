import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * back-fill-affordance — empty-slot tap target OR referent-date picker.
 * Spec: ../_meta-canonical/back-fill-affordance.json
 */
const formatDate = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const BackFillAffordance = observer(({
  shape = 'tap-target / empty-slot affordance',
  hostSurface = 'history-view',
  defaultDate = 'today',
  referentDate: referentProp,
  cellLabel,
  onBackFillInitiated,
  onEntryCreated,
}) => {
  const today = new Date();
  const [referent, setReferent] = useState(() => referentProp ? new Date(referentProp) : today);
  const [openedPicker, setOpenedPicker] = useState(false);

  const fireInit = () => {
    onBackFillInitiated && onBackFillInitiated({ referentDate: referent, hostSurface });
    setOpenedPicker(true);
  };

  if (shape === 'tap-target / empty-slot affordance' && !openedPicker) {
    return (
      <Pressable onPress={fireInit} style={styles.slotWrap}>
        <View style={styles.slotInner}>
          <Text style={[styles.slotLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {cellLabel || formatDate(referent)}
          </Text>
          <Text style={[styles.slotPlus, { fontSize: FontSettingsStore.getScaledFontSize(28) }]}>+</Text>
          <Text style={[styles.slotHint, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
            tap to log
          </Text>
        </View>
      </Pressable>
    );
  }

  // Referent date picker variant
  const setDateRel = (deltaDays) => {
    const next = new Date(referent);
    next.setDate(next.getDate() + deltaDays);
    setReferent(next);
  };

  const fakeCommit = () => {
    onEntryCreated && onEntryCreated({ referentDate: referent, writeTimestamp: new Date() });
    if (openedPicker) setOpenedPicker(false);
  };

  return (
    <MinkyPanel borderRadius={12} padding={16} paddingTop={16} overlayColor="rgba(100, 130, 195, 0.25)">
      <Text style={[styles.fieldLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
        WHEN DID THIS HAPPEN?
      </Text>
      <View style={styles.dateRow}>
        <Pressable onPress={() => setDateRel(-1)} style={styles.dateArrow}>
          <Text style={styles.dateArrowGlyph}>‹</Text>
        </Pressable>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={referent.toISOString().slice(0, 10)}
            onChange={(e) => setReferent(new Date(e.target.value))}
            style={{
              fontFamily: 'Comfortaa',
              fontWeight: 600,
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: '#2D2C2B',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              flex: 1,
              textAlign: 'center',
            }}
          />
        ) : (
          <Text style={[styles.dateText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
            {formatDate(referent)}
          </Text>
        )}
        <Pressable onPress={() => setDateRel(1)} style={styles.dateArrow} disabled={referent >= today}>
          <Text style={[styles.dateArrowGlyph, referent >= today && styles.dateArrowDisabled]}>›</Text>
        </Pressable>
      </View>
      <View style={styles.actionsRow}>
        <Pressable onPress={() => setReferent(today)} style={styles.linkBtn}>
          <Text style={[styles.todayLink, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            today
          </Text>
        </Pressable>
        {openedPicker ? (
          <Pressable onPress={() => setOpenedPicker(false)} style={styles.linkBtn}>
            <Text style={[styles.todayLink, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              cancel
            </Text>
          </Pressable>
        ) : null}
      </View>
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  slotWrap: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 4,
  },
  slotInner: { alignItems: 'center', justifyContent: 'center', gap: 0 },
  slotLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  slotPlus: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  slotHint: {
    fontFamily: 'Comfortaa',
    fontStyle: 'italic',
    color: 'rgba(69, 67, 66, 0.5)',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fieldLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  dateArrow: { paddingHorizontal: 10, paddingVertical: 4 },
  dateArrowGlyph: { fontSize: 22, color: '#7044C7' },
  dateArrowDisabled: { color: 'rgba(112, 68, 199, 0.3)' },
  dateText: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  todayLink: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionsRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 10 },
  linkBtn: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
});

export default BackFillAffordance;
