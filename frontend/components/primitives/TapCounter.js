import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * TapCounter — single-tap-to-increment counter.
 *
 * Built for white bear / pink elephant ("keep track of how many times the
 * thought slips in"). The user taps the big number to add one; a small
 * minus button steps back if they over-counted.
 *
 * Value shape: integer (the count). Default 0.
 */
const TapCounter = observer(({
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
  label,           // optional: "thoughts that slipped in" — shown below the count
  unitSingular,    // optional: "thought" — used in the readout when count === 1
  unitPlural,      // optional: "thoughts" — used in the readout when count !== 1
}) => {
  const count = Number.isFinite(currentValue) ? currentValue : 0;

  const commit = (next) => {
    onValueChanged && onValueChanged(next);
    onValueCommitted && onValueCommitted(next);
  };

  const bump = () => {
    if (!interactable || disabled) return;
    commit(count + 1);
  };

  const step_back = () => {
    if (!interactable || disabled || count <= 0) return;
    commit(count - 1);
  };

  const unit = count === 1 ? (unitSingular || 'time') : (unitPlural || 'times');

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={bump} disabled={disabled || !interactable} style={styles.bigTap}>
        <MinkyPanel
          borderRadius={20}
          padding={28}
          paddingTop={28}
          overlayColor="rgba(135, 180, 210, 0.55)"
        >
          <Text style={[styles.count, { fontSize: FontSettingsStore.getScaledFontSize(56) }]}>
            {count}
          </Text>
          <Text style={[styles.unit, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {unit}
          </Text>
        </MinkyPanel>
      </Pressable>

      {label ? (
        <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          {label}
        </Text>
      ) : null}

      <View style={styles.controlsRow}>
        <Pressable
          onPress={step_back}
          disabled={disabled || !interactable || count <= 0}
          style={styles.minorBtn}
        >
          <MinkyPanel
            borderRadius={8}
            padding={6}
            paddingTop={6}
            overlayColor={count > 0 ? 'rgba(100, 130, 195, 0.35)' : 'rgba(100, 130, 195, 0.12)'}
          >
            <Text style={[styles.minorBtnText, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              step back
            </Text>
          </MinkyPanel>
        </Pressable>

        <Text style={[styles.hint, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
          tap the number to add one
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 8, alignItems: 'center' },
  bigTap: { alignSelf: 'stretch' },
  count: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  unit: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  minorBtn: {},
  minorBtnText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
  },
});

export default TapCounter;
