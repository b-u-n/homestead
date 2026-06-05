import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * PaintLegend — selectable color swatch row in the cottagecore palette.
 *
 * Built for emotion-body-mapping (paint the body in the color of what each
 * area is carrying), but generic — any activity that needs the user to pick
 * one of a small palette of meaning-bearing colors can use it.
 *
 * Authors pass `swatches` — an array of { id, label, color }. The currently-
 * selected swatch is rendered with a stitched-border / scale-up treatment so
 * the choice is visible at a glance. The bound value is the selected swatch's
 * `id`.
 *
 * The same `swatches` array can be reused in a previous step as a passive
 * legend (set `interactable: false` for read-only display).
 */
const PaintLegend = observer(({
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
  swatches = [],
  layout = 'row', // 'row' | 'wrap'
}) => {
  const select = (id) => {
    if (!interactable || disabled) return;
    onValueChanged && onValueChanged(id);
    onValueCommitted && onValueCommitted(id);
  };

  const rowStyle = layout === 'wrap' ? styles.wrap : styles.row;

  return (
    <View style={[styles.wrapper, rowStyle]}>
      {swatches.map((sw) => {
        const selected = sw.id === currentValue;
        return (
          <Pressable
            key={sw.id}
            onPress={() => select(sw.id)}
            disabled={disabled || !interactable}
            style={styles.cell}
          >
            <MinkyPanel
              borderRadius={10}
              padding={10}
              paddingTop={10}
              overlayColor={sw.color}
              borderColor={selected ? 'rgba(45, 44, 43, 0.9)' : 'rgba(92, 90, 88, 0.35)'}
            >
              {sw.label ? (
                <Text
                  style={[
                    styles.label,
                    selected && styles.labelSelected,
                    { fontSize: FontSettingsStore.getScaledFontSize(11) },
                  ]}
                  numberOfLines={2}
                >
                  {sw.label}
                </Text>
              ) : null}
            </MinkyPanel>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: 'row' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: 0, flexGrow: 1, minWidth: 64 },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  labelSelected: {
    fontWeight: '700',
  },
});

export default PaintLegend;
