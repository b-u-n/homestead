import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * collapsible-section — header + body that toggles visibility.
 */
const CollapsibleSection = observer(({
  headerTitle,
  badge,
  count,
  initialState = 'collapsed',
  bodySlotContent,
  children,
  exclusiveWithSiblings = false,
  variant = 'accordion-section (mutual-exclusion)',
  isOpen,
  onExpanded,
  onCollapsed,
  onStatePersisted,
}) => {
  const [internalOpen, setInternalOpen] = useState(initialState === 'expanded');
  const open = isOpen != null ? isOpen : internalOpen;

  useEffect(() => {
    if (open) onExpanded && onExpanded();
    else onCollapsed && onCollapsed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = () => {
    const next = !open;
    if (isOpen == null) setInternalOpen(next);
    onStatePersisted && onStatePersisted(next);
  };

  // bodySlotContent often comes through as a plain string from activity JSON
  // (CollapsibleSection blocks usually carry a paragraph of prose, not nested
  // components). React Native won't render a raw string inside a <View>, and
  // when authors did get text out of it the font was wrong. Wrap strings in
  // a Comfortaa <Text> so the body matches the rest of the activity copy.
  let body = bodySlotContent ?? children;
  if (typeof body === 'string') {
    body = (
      <Text style={[styles.bodyText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
        {body}
      </Text>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={toggle}>
        <MinkyPanel
          borderRadius={open ? 10 : 10}
          padding={10}
          paddingTop={10}
          overlayColor={open ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              {headerTitle}
            </Text>
            {badge ? (
              <Text style={[styles.badge, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                {badge}
              </Text>
            ) : null}
            {count != null ? (
              <Text style={[styles.count, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                ({count})
              </Text>
            ) : null}
            <Text style={[styles.chevron, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              {open ? '▾' : '▸'}
            </Text>
          </View>
        </MinkyPanel>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {body}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  badge: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  count: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chevron: {
    fontFamily: 'Comfortaa',
    color: '#7044C7',
    fontWeight: '700',
  },
  body: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bodyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    lineHeight: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default CollapsibleSection;
