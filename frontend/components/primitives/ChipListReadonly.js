import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * ChipListReadonly — render an array of chip labels as a row of read-only
 * pill chips. Visually matches the `chip-strip` rendering of
 * `ChipMultiSelectTagGroup` so a downstream carry-over of selected chips
 * reads as actual chip pills, not a bulleted text list.
 *
 * Used as the `ref` on a `carryFrom` block:
 *   {
 *     "interactable": false,
 *     "ref": "ChipListReadonly",
 *     "carryFrom": { "stepId": "motivators", "bind": "motivators" }
 *   }
 *
 * The carry resolver in ComponentStep fills `value` (and `currentValue`) with
 * the resolved array. Empty / non-array values render the `emptyText` prose.
 */
const ChipListReadonly = observer(({
  value,
  currentValue,
  emptyText = 'Nothing selected.',
  title,
  style,
}) => {
  const list = Array.isArray(value)
    ? value
    : (Array.isArray(currentValue) ? currentValue : []);
  // Normalize each item — strings pass through; objects use label/text.
  const labels = list
    .map((it) => (typeof it === 'string' ? it : (it?.label ?? it?.text ?? it?.id)))
    .filter((s) => typeof s === 'string' && s.length > 0);

  const titleSize = FontSettingsStore.getScaledFontSize(15);
  const titleEl = title ? (
    <Text style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.4) }]}>
      {title}
    </Text>
  ) : null;

  if (labels.length === 0) {
    return (
      <View style={style}>
        {titleEl}
        <Text style={[styles.empty, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {emptyText}
        </Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {titleEl}
      <View style={styles.row}>
        {labels.map((label, i) => (
          <View key={i}>
            <MinkyPanel
              borderRadius={14}
              padding={6}
              paddingTop={6}
              overlayColor="rgba(135, 180, 210, 0.55)"
              borderColor="rgba(92, 90, 88, 0.55)"
            >
              <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                {label}
              </Text>
            </MinkyPanel>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginBottom: 8,
    // lineHeight is inline so it tracks the scaled fontSize.
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  empty: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
  },
});

export default ChipListReadonly;
