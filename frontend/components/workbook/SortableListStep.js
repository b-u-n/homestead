import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';

/**
 * SortableListStep
 * Build a ranked list of items with ratings.
 *
 * Props from step definition:
 *   step.placeholder: 'Add a feared situation...'
 *   step.ratingLabel: 'SUDS (0-100)'
 *   step.ratingMin: 0
 *   step.ratingMax: 100
 *   step.minItems: 5
 */
const SortableListStep = observer(({ step, value, onChange }) => {
  const placeholder = step.placeholder || 'Add an item...';
  const ratingLabel = step.ratingLabel || 'Rating';
  const ratingMin = step.ratingMin ?? 0;
  const ratingMax = step.ratingMax ?? 100;
  const minItems = step.minItems || 1;

  const items = value || [];
  const [newItemText, setNewItemText] = useState('');

  const handleAdd = () => {
    const text = newItemText.trim();
    if (!text) return;
    const updated = [...items, { item: text, rating: ratingMin }];
    updated.sort((a, b) => a.rating - b.rating);
    onChange(updated);
    setNewItemText('');
  };

  const handleRatingChange = (index, ratingText) => {
    let rating = parseInt(ratingText, 10);
    if (isNaN(rating)) rating = ratingMin;
    rating = Math.max(ratingMin, Math.min(ratingMax, rating));
    const updated = [...items];
    updated[index] = { ...updated[index], rating };
    updated.sort((a, b) => a.rating - b.rating);
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* Add new item */}
      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.addInput,
            {
              fontSize: FontSettingsStore.getScaledFontSize(16),
              color: FontSettingsStore.getFontColor('#2D2C2B'),
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor="rgba(64, 63, 62, 0.4)"
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAdd}
        />
        <WoolButton
          onPress={handleAdd}
          variant="purple"
          size="small"
          disabled={!newItemText.trim()}
        >
          Add
        </WoolButton>
      </View>

      {/* Item list */}
      <ScrollBarView style={styles.listScroll}>
        <View style={styles.list}>
          {items.map((entry, index) => (
            <MinkyPanel
              key={index}
              borderRadius={8}
              padding={10}
              paddingTop={10}
              overlayColor="rgba(112, 68, 199, 0.1)"
            >
              <View style={styles.itemRow}>
                <Text
                  style={[
                    styles.itemText,
                    {
                      fontSize: FontSettingsStore.getScaledFontSize(14),
                      color: FontSettingsStore.getFontColor('#2D2C2B'),
                    },
                  ]}
                  numberOfLines={2}
                >
                  {entry.item}
                </Text>
                <View style={styles.ratingGroup}>
                  <TextInput
                    style={[
                      styles.ratingInput,
                      {
                        fontSize: FontSettingsStore.getScaledFontSize(14),
                        color: FontSettingsStore.getFontColor('#7044C7'),
                      },
                    ]}
                    value={String(entry.rating)}
                    onChangeText={(text) => handleRatingChange(index, text)}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Pressable onPress={() => handleRemove(index)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>{'\u2715'}</Text>
                  </Pressable>
                </View>
              </View>
            </MinkyPanel>
          ))}
        </View>
      </ScrollBarView>

      {/* Item count and rating label */}
      <View style={styles.footerRow}>
        <Text
          style={[
            styles.countText,
            {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#454342'),
            },
          ]}
        >
          {items.length} of {minItems} minimum added
        </Text>
        <Text
          style={[
            styles.ratingLabelText,
            {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#454342'),
            },
          ]}
        >
          {ratingLabel} ({ratingMin}-{ratingMax})
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.2)',
  },
  listScroll: {
    flex: 1,
    maxHeight: 300,
  },
  list: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 13,
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingInput: {
    width: 50,
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 13,
    color: '#7044C7',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(112, 68, 199, 0.3)',
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(200, 80, 80, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 14,
    color: '#c85050',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 11,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ratingLabelText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 11,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default SortableListStep;
