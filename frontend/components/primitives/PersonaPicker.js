import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import PersonaStore from '../../stores/PersonaStore';
import MinkyPanel from '../MinkyPanel';

const PERSONA_GLYPHS = {
  warm: '🤗',
  neutral: '😐',
  brisk: '⚡',
  playful: '✨',
  clinical: '🩺',
};

/**
 * persona-picker — platform #5 chrome dropdown / avatar-list.
 * Spec: ../_meta-canonical/persona-picker.json
 *
 * Reads/writes via PersonaStore. If `personas` not provided, falls back to PersonaStore.available.
 */
const PersonaPicker = observer(({
  personas: personasProp,
  currentPersonaId: currentProp,
  value,
  presentation = 'dropdown',
  placement = 'chrome top-right',
  interactable = true,
  onPersonaChange,
  onValueChanged,
}) => {
  const [open, setOpen] = useState(false);
  const personas = personasProp || PersonaStore.available || [];
  // Source of truth: explicit `currentPersonaId` wins, then v2 `value`, then store.
  const currentId = currentProp ?? value ?? PersonaStore.currentPersonaId;
  const current = personas.find(p => p.id === currentId) || { id: currentId, label: currentId };

  const select = async (id) => {
    if (!interactable) return;
    setOpen(false);
    if (currentProp == null) await PersonaStore.set(id);
    onPersonaChange && onPersonaChange(id);
    onValueChanged && onValueChanged(id);
  };

  if (presentation === 'avatar-list') {
    return (
      <View style={styles.avatarRow}>
        {personas.map(p => {
          const sel = p.id === currentId;
          return (
            <Pressable key={p.id} onPress={() => select(p.id)} style={styles.avatarCell}>
              <MinkyPanel
                padding={10}
                overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
                shape="circular"
                size={56}
              >
                <Text style={[styles.glyph, { fontSize: FontSettingsStore.getScaledFontSize(20) }]}>
                  {PERSONA_GLYPHS[p.id] || '👤'}
                </Text>
              </MinkyPanel>
              <Text style={[styles.avatarLabel, sel && styles.avatarLabelSel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Dropdown
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen(!open)}>
        <MinkyPanel borderRadius={20} padding={6} paddingTop={6} overlayColor="rgba(112, 68, 199, 0.2)">
          <View style={styles.triggerRow}>
            <Text style={[styles.triggerGlyph, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              {PERSONA_GLYPHS[current.id] || '👤'}
            </Text>
            <Text style={[styles.triggerLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
              {current.label}
            </Text>
            <Text style={styles.caret}>{open ? '▴' : '▾'}</Text>
          </View>
        </MinkyPanel>
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          <MinkyPanel borderRadius={10} padding={6} paddingTop={6} overlayColor="rgba(100, 130, 195, 0.25)">
            <View style={styles.menuList}>
              {personas.map(p => {
                const sel = p.id === currentId;
                return (
                  <Pressable key={p.id} onPress={() => select(p.id)} style={styles.menuRow}>
                    <Text style={styles.menuGlyph}>{PERSONA_GLYPHS[p.id] || '👤'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, sel && styles.menuLabelSel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                        {p.label}
                      </Text>
                      {p.description ? (
                        <Text style={[styles.menuDesc, { fontSize: FontSettingsStore.getScaledFontSize(10) }]} numberOfLines={1}>
                          {p.description}
                        </Text>
                      ) : null}
                    </View>
                    {sel ? <Text style={styles.menuCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </MinkyPanel>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 },
  triggerGlyph: { },
  triggerLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  caret: {
    color: '#7044C7',
    fontSize: 14,
  },
  menu: { marginTop: 4, minWidth: 200 },
  menuList: { gap: 2, alignSelf: 'stretch' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  menuGlyph: { fontSize: 16, width: 22 },
  menuLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  menuLabelSel: { fontWeight: '700', color: '#7044C7' },
  menuDesc: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  menuCheck: { color: '#7044C7', fontSize: 14, fontWeight: '700' },
  avatarRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  avatarCell: { alignItems: 'center', gap: 4 },
  glyph: { textAlign: 'center' },
  avatarLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  avatarLabelSel: { fontWeight: '700', color: '#7044C7' },
});

export default PersonaPicker;
