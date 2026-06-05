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
    padding: 10,
    borderRadius: 8,
    border: '1px solid rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  };
}

/**
 * RippleMap — concentric rings the user drops labelled dots onto.
 *
 * Built for an-act-of-kindness (place the recipient of a kindness on a
 * ripple — close to you, one ring out, two rings out, etc.). Generic enough
 * for any "how close to the center is this?" mapping.
 *
 * Authors pass `rings` — an array of { id, label } from innermost to
 * outermost. The user types a name, picks a ring, and the dot lands there.
 * Tap an existing dot to remove it.
 *
 * Value shape (bound):
 *   [ { id: "<auto>", name: "<text>", ringId: "<ringId>" }, … ]
 */
const RippleMap = observer(({
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
  rings = [],
  placeholder = 'A name for this person…',
}) => {
  const dots = Array.isArray(currentValue) ? currentValue : [];
  const [draftName, setDraftName] = useState('');

  const commit = (next) => {
    onValueChanged && onValueChanged(next);
    onValueCommitted && onValueCommitted(next);
  };

  const addDot = (ringId) => {
    const name = draftName.trim();
    if (!name || !interactable || disabled) return;
    const id = `dot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    commit([...dots, { id, name, ringId }]);
    setDraftName('');
  };

  const removeDot = (dotId) => {
    if (!interactable || disabled) return;
    commit(dots.filter(d => d.id !== dotId));
  };

  // Reverse so the outermost ring renders first (largest, behind) and the
  // innermost renders last (smallest, on top).
  const rendered = [...rings].reverse();

  return (
    <View style={styles.wrapper}>
      <View style={styles.canvasFrame}>
        {rendered.map((ring, idxFromOutside) => {
          // size shrinks as we move inward; innermost = ~80px, outermost = ~280px
          const ringIdx = rings.length - 1 - idxFromOutside;
          const size = 100 + ringIdx * 60;
          const ringDots = dots.filter(d => d.ringId === ring.id);
          return (
            <View
              key={ring.id}
              style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
            >
              <Text
                style={[styles.ringLabel, { fontSize: FontSettingsStore.getScaledFontSize(9) }]}
                numberOfLines={1}
              >
                {ring.label}
              </Text>
              <View style={styles.dotCluster}>
                {ringDots.map(d => (
                  <Pressable key={d.id} onPress={() => removeDot(d.id)}>
                    <MinkyPanel
                      borderRadius={10}
                      padding={4}
                      paddingTop={4}
                      overlayColor="rgba(135, 180, 210, 0.7)"
                    >
                      <Text
                        style={[styles.dotLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}
                        numberOfLines={1}
                      >
                        {d.name}
                      </Text>
                    </MinkyPanel>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {interactable ? (
        <View style={styles.entry}>
          <Text style={[styles.entryHelp, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
            Type a name, then tap a ring above to drop them there. Tap a dot to remove it.
          </Text>
          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={placeholder}
              maxLength={40}
              style={getWebInputStyle()}
            />
          ) : (
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder={placeholder}
              placeholderTextColor="rgba(92, 90, 88, 0.55)"
              style={[styles.input, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}
              maxLength={40}
            />
          )}
          <View style={styles.ringPickerRow}>
            {rings.map(ring => (
              <Pressable
                key={ring.id}
                onPress={() => addDot(ring.id)}
                disabled={!draftName.trim()}
                style={styles.ringPickerCell}
              >
                <MinkyPanel
                  borderRadius={8}
                  padding={8}
                  paddingTop={8}
                  overlayColor={draftName.trim() ? 'rgba(135, 180, 210, 0.45)' : 'rgba(100, 130, 195, 0.15)'}
                >
                  <Text
                    style={[styles.ringPickerLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}
                    numberOfLines={1}
                  >
                    Drop on "{ring.label}"
                  </Text>
                </MinkyPanel>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 12, alignItems: 'center' },
  canvasFrame: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  ringLabel: {
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dotCluster: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  dotLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
  },
  entry: { width: '100%', gap: 8 },
  input: {
    // Standard text-input pattern per md/TEXTBOX.md — white-ish background,
    // soft border, subtle inset shadow. Matches the Comfortaa-everywhere look.
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    minHeight: 38,
  },
  entryHelp: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ringPickerRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  ringPickerCell: { flexBasis: 0, flexGrow: 1, minWidth: 70 },
  ringPickerLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textAlign: 'center',
  },
});

export default RippleMap;
