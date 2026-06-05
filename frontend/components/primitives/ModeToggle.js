import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import OptionSelectDropdown from './OptionSelectDropdown';

/**
 * mode-toggle — chrome-level toggle that swaps the surface (visual<->conv, edit<->crisis,
 * filter, sort, display preference).
 */
const ModeToggle = observer(({
  axis = 'visual<->conversational (platform-#4)',
  presentation = 'mode-switch-toggle',
  currentMode,
  availableOptions = [],
  transferableState,
  placement = 'chrome top-right',
  onModeChanged,
  onFilterChanged,
  onSortChanged,
  onPreferenceChanged,
  onProgressTransferred,
}) => {
  const fire = (next) => {
    if (axis.startsWith('visual')) {
      onModeChanged && onModeChanged(next);
      if (transferableState) onProgressTransferred && onProgressTransferred({ from: currentMode, to: next, state: transferableState });
    } else if (axis === 'filter-bucket') {
      onFilterChanged && onFilterChanged(next);
    } else if (axis === 'sort-order') {
      onSortChanged && onSortChanged(next);
    } else {
      onPreferenceChanged && onPreferenceChanged(next);
    }
  };

  // Visual<->conv: 2-position toggle pill
  if (presentation === 'mode-switch-toggle' && availableOptions.length === 2) {
    return (
      <View style={styles.toggleWrap}>
        {availableOptions.map((opt, i) => {
          const id = typeof opt === 'string' ? opt : opt.id;
          const label = typeof opt === 'string' ? opt : (opt.label || opt.id);
          const sel = currentMode === id;
          return (
            <Pressable key={i} onPress={() => fire(id)} style={styles.toggleCell}>
              <MinkyPanel
                borderRadius={20}
                padding={6}
                paddingTop={6}
                overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
              >
                <Text style={[styles.toggleLabel, sel && styles.toggleLabelSel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                  {label}
                </Text>
              </MinkyPanel>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (presentation === 'segmented-toggle' || presentation === 'tab-bar') {
    return (
      <View style={styles.segWrap}>
        {availableOptions.map((opt, i) => {
          const id = typeof opt === 'string' ? opt : opt.id;
          const label = typeof opt === 'string' ? opt : (opt.label || opt.id);
          const count = typeof opt === 'object' ? opt.count : null;
          const sel = currentMode === id;
          return (
            <Pressable key={i} onPress={() => fire(id)} style={styles.segCell}>
              <MinkyPanel
                borderRadius={8}
                padding={8}
                paddingTop={8}
                overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
              >
                <Text style={[styles.segLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                  {label}{count != null ? ` (${count})` : ''}
                </Text>
              </MinkyPanel>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (presentation === 'dropdown') {
    return (
      <OptionSelectDropdown
        options={availableOptions}
        currentValue={currentMode}
        presentation="dropdown"
        role="scope-context-picker"
        onValueChanged={fire}
      />
    );
  }

  // inline-button fallback
  return (
    <View style={styles.segWrap}>
      {availableOptions.map((opt, i) => {
        const id = typeof opt === 'string' ? opt : opt.id;
        const label = typeof opt === 'string' ? opt : (opt.label || opt.id);
        const sel = currentMode === id;
        return (
          <Pressable key={i} onPress={() => fire(id)} style={styles.segCell}>
            <Text style={[styles.inlineLabel, sel && styles.inlineLabelSel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  toggleWrap: { flexDirection: 'row', gap: 4, alignSelf: 'flex-start' },
  toggleCell: { },
  toggleLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    paddingHorizontal: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  toggleLabelSel: { fontWeight: '700', color: '#2D2C2B' },
  segWrap: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  segCell: { flex: 1, minWidth: 70 },
  segLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inlineLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: 'rgba(69, 67, 66, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inlineLabelSel: { fontWeight: '700', color: '#7044C7', textDecorationLine: 'underline' },
});

export default ModeToggle;
