import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * Checkbox — a single checkable row primitive with optional collapsible
 * "voice" examples.
 *
 * Title + description live INSIDE a tappable blue MinkyPanel. Tapping the
 * panel toggles the check. When `examples` is provided, a chevron on the
 * right toggles a separate expand/collapse — examples are hidden by default
 * and reveal beneath the panel as italic indented voice lines.
 *
 * Props:
 *   checked       boolean
 *   onToggle      (next: boolean) => void
 *   title         string  -- main label (required)
 *   description   string  -- soft secondary line under the title
 *   examples      string[] -- short concrete examples shown beneath the panel
 *                            when expanded
 *   defaultExpanded boolean -- start with examples open (default false)
 *   disabled      boolean
 *   interactable  boolean  -- false renders as a static display row (no toggle)
 */
const Checkbox = observer(({
  checked = false,
  onToggle,
  title,
  description,
  examples,
  defaultExpanded = false,
  disabled = false,
  interactable = true,
}) => {
  const hasExamples = Array.isArray(examples) && examples.length > 0;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggleCheck = () => {
    if (!interactable) return;
    if (disabled) return;
    onToggle && onToggle(!checked);
  };

  const handleToggleExpand = (e) => {
    // Stop the press from bubbling to the parent Pressable so expand doesn't
    // accidentally also toggle the check.
    e?.stopPropagation && e.stopPropagation();
    setExpanded(v => !v);
  };

  const titleSize = FontSettingsStore.getScaledFontSize(15);
  const descSize = FontSettingsStore.getScaledFontSize(12);
  const exampleSize = FontSettingsStore.getScaledFontSize(15);

  // Tapping the panel body expands/collapses (the bigger, more useful
  // affordance). Tapping the stitched checkbox indicator on the left toggles
  // the check. Both work via separate Pressables — the indicator's press
  // stops propagation so the body's expand handler doesn't also fire.
  const handleIndicatorPress = (e) => {
    e?.stopPropagation && e.stopPropagation();
    handleToggleCheck();
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handleToggleExpand}
        disabled={!hasExamples}
        hitSlop={4}
        accessibilityRole={hasExamples ? 'button' : undefined}
        accessibilityLabel={hasExamples ? (expanded ? 'Hide examples' : 'Show examples') : undefined}
      >
        <MinkyPanel
          borderRadius={12}
          padding={12}
          paddingTop={12}
          overlayColor={checked ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
          borderColor={checked ? 'rgba(92, 90, 88, 0.55)' : undefined}
        >
          <View style={styles.row}>
            <Pressable
              onPress={handleIndicatorPress}
              disabled={disabled || !interactable}
              hitSlop={40}
              style={styles.indicatorWrap}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={title}
            >
              <View style={[styles.indicator, checked && styles.indicatorChecked]}>
                {checked ? <Text style={styles.checkmark}>{'✓'}</Text> : null}
              </View>
            </Pressable>
            <View style={styles.body}>
              {title ? (
                <Text style={[
                  styles.title,
                  { fontSize: titleSize, color: FontSettingsStore.getFontColor('#2D2C2B') },
                ]}>
                  {title}
                </Text>
              ) : null}
              {description ? (
                <Text style={[
                  styles.description,
                  { fontSize: descSize, color: FontSettingsStore.getFontColor('#1A1A19') },
                ]}>
                  {description}
                </Text>
              ) : null}
            </View>
            {hasExamples ? (
              <View style={styles.chevronTap} pointerEvents="none">
                <Text style={[styles.chevron, { fontSize: FontSettingsStore.getScaledFontSize(28) }]}>
                  {expanded ? '▴' : '▾'}
                </Text>
              </View>
            ) : null}
          </View>
        </MinkyPanel>
      </Pressable>

      {hasExamples && expanded ? (
        <View style={styles.examplesBlock}>
          {examples.map((ex, i) => (
            <Text
              key={i}
              style={[
                styles.exampleText,
                { fontSize: exampleSize, color: FontSettingsStore.getFontColor('#1A1A19') },
              ]}
            >
              {`“${ex.replace(/^["']|["']$/g, '')}”`}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorWrap: {
    padding: 12,
    margin: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.55)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorChecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(92, 90, 88, 0.55)',
  },
  checkmark: {
    color: '#2D2C2B',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#1A1A19',
    lineHeight: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chevronTap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontFamily: 'Comfortaa',
    fontWeight: '900',
    color: '#2D2C2B',
    lineHeight: 28,
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  examplesBlock: {
    marginTop: 4,
    marginLeft: 14,
    paddingLeft: 12,
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(112, 68, 199, 0.45)',
    gap: 6,
  },
  exampleText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#1A1A19',
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default Checkbox;
