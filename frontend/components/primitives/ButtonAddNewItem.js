import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WoolButton from '../WoolButton';
import MinkyPanel from '../MinkyPanel';
import FontSettingsStore from '../../stores/FontSettingsStore';

/**
 * button-add-new-item — '+' / 'Add' affordance.
 */
const ButtonAddNewItem = observer(({
  label = 'Add',
  rendering = 'inline_text_button',
  containerType = 'worksheet_row',
  opens = 'inline_editor',
  addedEntity = 'row',
  enabled = true,
  targetContainerId,
  onTap,
  onItemAdded,
  onEditorOpened,
}) => {
  const handlePress = () => {
    if (!enabled) return;
    onTap && onTap({ targetContainerId });
    if (opens === 'inline_editor' || opens === 'modal' || opens === 'entry_flow') {
      onEditorOpened && onEditorOpened({ targetContainerId, addedEntity });
    } else {
      onItemAdded && onItemAdded({ targetContainerId, addedEntity });
    }
  };

  if (rendering === 'FAB') {
    return (
      <Pressable onPress={handlePress} style={styles.fabWrap} disabled={!enabled}>
        <MinkyPanel
          padding={12}
          overlayColor="rgba(112, 68, 199, 0.55)"
          borderColor="rgba(92, 90, 88, 0.55)"
          shape="circular"
          size={64}
        >
          <Text style={[styles.fabPlus, { fontSize: FontSettingsStore.getScaledFontSize(28) }]}>+</Text>
        </MinkyPanel>
      </Pressable>
    );
  }

  if (rendering === 'plus_icon' || rendering === 'column_header') {
    return (
      <Pressable onPress={handlePress} style={styles.iconBtn} disabled={!enabled}>
        <Text style={[styles.iconPlus, { fontSize: FontSettingsStore.getScaledFontSize(20) }]}>+</Text>
        {rendering === 'column_header' && label ? (
          <Text style={[styles.iconLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{label}</Text>
        ) : null}
      </Pressable>
    );
  }

  // inline_text_button / palette_footer (default)
  return (
    <WoolButton variant="secondary" size="small" onPress={handlePress} disabled={!enabled}>
      <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>+ {label}</Text>
    </WoolButton>
  );
});

const styles = StyleSheet.create({
  fabWrap: {
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fabPlus: {
    color: '#2D2C2B',
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  iconPlus: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  iconLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontFamily: 'NeedleworkGood',
    fontWeight: '700',
    color: '#403F3E',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ButtonAddNewItem;
