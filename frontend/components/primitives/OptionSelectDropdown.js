import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import StitchedBorder from '../StitchedBorder';
import FreeTextShortInput from './FreeTextShortInput';

/**
 * option-select-dropdown — single/multi select picker.
 * Spec: ../_meta-canonical/option-select-dropdown.json
 */
const OptionSelectDropdown = observer(({
  options = [],
  currentValue,
  allowMultiSelect = false,
  allowCustom = false,
  presentation = 'dropdown',
  role = 'inline-value-select',
  label,
  interactable = true,
  onValueChanged,
}) => {
  const [open, setOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const selected = allowMultiSelect ? (Array.isArray(currentValue) ? currentValue : []) : currentValue;

  const isSelected = (opt) => {
    const id = typeof opt === 'string' ? opt : opt.id ?? opt.value;
    if (allowMultiSelect) return selected.includes(id);
    return selected === id;
  };

  const toggle = (opt) => {
    if (!interactable) return;
    const id = typeof opt === 'string' ? opt : opt.id ?? opt.value;
    if (allowMultiSelect) {
      const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
      onValueChanged && onValueChanged(next);
    } else {
      onValueChanged && onValueChanged(id);
      setOpen(false);
    }
  };

  const addCustom = (val) => {
    if (!interactable) return;
    if (!val) return;
    if (allowMultiSelect) {
      const next = [...selected, val];
      onValueChanged && onValueChanged(next);
    } else {
      onValueChanged && onValueChanged(val);
      setOpen(false);
    }
    setCustomDraft('');
  };

  const labelOf = (opt) => typeof opt === 'string' ? opt : (opt.label || opt.id || opt.value);

  if (presentation === 'segmented-control') {
    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.fieldLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {label}
          </Text>
        ) : null}
        <View style={styles.segRow}>
          {options.map((opt, i) => {
            const sel = isSelected(opt);
            return (
              <Pressable key={i} onPress={() => toggle(opt)} style={styles.segCell}>
                <MinkyPanel
                  borderRadius={8}
                  padding={8}
                  paddingTop={8}
                  overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                  borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
                >
                  <Text style={[styles.segText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                    {labelOf(opt)}
                  </Text>
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // Dropdown presentation
  const display = allowMultiSelect
    ? (selected.length ? `${selected.length} selected` : 'Select…')
    : (selected != null ? (options.find(o => (typeof o === 'string' ? o : o.id ?? o.value) === selected)?.label ?? selected) : 'Select…');

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.fieldLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {label}
        </Text>
      ) : null}
      <Pressable onPress={() => setOpen(!open)}>
        <StitchedBorder borderRadius={10} style={styles.trigger}>
          <View style={styles.triggerInner}>
            <Text style={[styles.triggerText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              {display}
            </Text>
            <Text style={styles.caret}>{open ? '▴' : '▾'}</Text>
          </View>
        </StitchedBorder>
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          <MinkyPanel borderRadius={10} padding={8} paddingTop={8} overlayColor="rgba(100, 130, 195, 0.25)">
            <View style={styles.menuList}>
              {options.map((opt, i) => {
                const sel = isSelected(opt);
                return (
                  <Pressable key={i} onPress={() => toggle(opt)} style={styles.menuRow}>
                    <Text style={[styles.menuRowText, sel && styles.menuRowSelected, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
                      {sel ? '✓ ' : '   '}{labelOf(opt)}
                    </Text>
                  </Pressable>
                );
              })}
              {allowCustom ? (
                <View style={styles.customRow}>
                  <FreeTextShortInput
                    placeholder="Add custom…"
                    value={customDraft}
                    onChange={setCustomDraft}
                    onCommit={addCustom}
                    submitMode="blur-commit"
                  />
                </View>
              ) : null}
            </View>
          </MinkyPanel>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  fieldLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  segRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  segCell: { flex: 1, minWidth: 80 },
  segText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  trigger: { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  triggerText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  caret: {
    fontFamily: 'Comfortaa',
    color: '#7044C7',
    fontSize: 16,
  },
  menu: { marginTop: 4 },
  menuList: { gap: 4, alignSelf: 'stretch' },
  menuRow: { paddingVertical: 6, paddingHorizontal: 4 },
  menuRowText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  menuRowSelected: {
    fontWeight: '700',
    color: '#7044C7',
  },
  customRow: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(92, 90, 88, 0.25)' },
});

export default OptionSelectDropdown;
