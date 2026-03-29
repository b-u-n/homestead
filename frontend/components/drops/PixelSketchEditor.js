import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import InventoryStore from '../../stores/InventoryStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import PixelEditor from '../PixelEditor';

/**
 * Pixel Sketch Editor drop - used in the knapsack for personal pixel art.
 * No budget constraints, unlimited drawing. Saves to server on explicit save.
 */
const PixelSketchEditor = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const itemId = input?.itemId || context?.itemId;
  const item = InventoryStore.items.find(i => (i._id || i.id) === itemId);

  const sketchData = item?.data || { width: 32, height: 32, pixels: new Array(32 * 32).fill(null) };
  const [localPixels, setLocalPixels] = useState([...(sketchData.pixels || [])]);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [saving, setSaving] = useState(false);

  const handlePixelsChanged = useCallback((changedPixels) => {
    setLocalPixels(prev => {
      const next = [...prev];
      for (const p of changedPixels) {
        next[p.y * sketchData.width + p.x] = p.color;
      }
      return next;
    });
  }, [sketchData.width]);

  const handleSave = async (pixels) => {
    if (!itemId) return;
    setSaving(true);
    try {
      await InventoryStore.saveItem(itemId, {
        itemData: {
          width: sketchData.width,
          height: sketchData.height,
          pixels: pixels || localPixels
        }
      });
    } catch (err) {
      ErrorStore.addError('Failed to save sketch');
    }
    setSaving(false);
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sketch not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
        {item.title || 'Pixel Sketch'}
      </Text>

      <PixelEditor
        pixels={localPixels}
        width={sketchData.width}
        height={sketchData.height}
        readOnly={false}
        onPixelsChanged={handlePixelsChanged}
        onSave={handleSave}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        savedColors={[]}
        showGrid={true}
        showZoomControls={true}
        showSaveButton={true}
        style={styles.editor}
      />

      {saving && (
        <Text style={styles.savingText}>Saving...</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    padding: 8,
  },
  title: {
    fontFamily: 'Comfortaa',
    color: '#2D2C2B',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  editor: {
    flex: 1,
  },
  errorText: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#454342',
    textAlign: 'center',
    padding: 20,
  },
  savingText: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#7044C7',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PixelSketchEditor;
