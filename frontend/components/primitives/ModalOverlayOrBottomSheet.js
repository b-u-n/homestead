import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal as RNModal } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import PlatformModal from '../Modal';

/**
 * modal-overlay-or-bottom-sheet — transient overlay surface.
 *
 * Uses React Native's built-in `Modal` for true portal behavior — escapes any transformed
 * parent and renders fixed to the viewport on both web and native.
 */
const ModalOverlayOrBottomSheet = observer(({
  open = false,
  overlayKind = 'centered-modal',
  dismissMode = 'tap-outside',
  blocksUnderlying = true,
  autoDismissSeconds,
  bodySlot,
  children,
  title,
  onOpened,
  onDismissed,
  onActionTaken,
  onAutoDismissed,
}) => {
  useEffect(() => {
    if (!open) return;
    onOpened && onOpened({ overlayKind });
    if (overlayKind === 'feedback-toast' && autoDismissSeconds) {
      const t = setTimeout(() => {
        onAutoDismissed && onAutoDismissed();
        onDismissed && onDismissed({ reason: 'auto-timer' });
      }, autoDismissSeconds * 1000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const dismiss = (reason) => {
    onDismissed && onDismissed({ reason });
  };

  const body = bodySlot ?? children;

  const animation =
    overlayKind === 'feedback-toast' ? 'fade' :
    overlayKind === 'bottom-sheet' || overlayKind === 'side-drawer' ? 'slide' :
    'fade';

  // Toast — small floating pill, no scrim, tap-to-dismiss on the toast itself
  if (overlayKind === 'feedback-toast') {
    return (
      <RNModal visible={open} transparent animationType="fade" onRequestClose={() => dismiss('back')}>
        <View pointerEvents="box-none" style={styles.toastWrap}>
          <Pressable onPress={() => dismiss('tap-outside')}>
            <MinkyPanel borderRadius={28} padding={18} paddingTop={18} overlayColor="rgba(135, 180, 210, 0.85)">
              <Text style={[styles.toastText, { fontSize: FontSettingsStore.getScaledFontSize(15) }]} numberOfLines={3}>
                {body}
              </Text>
            </MinkyPanel>
          </Pressable>
        </View>
      </RNModal>
    );
  }

  // Context menu — render inline (caller positions it)
  if (overlayKind === 'context-menu-on-press') {
    return (
      <View style={styles.contextWrap}>
        <MinkyPanel borderRadius={12} padding={10} paddingTop={10} overlayColor="rgba(112, 68, 199, 0.2)">
          {body}
        </MinkyPanel>
      </View>
    );
  }

  // Bottom sheet
  if (overlayKind === 'bottom-sheet') {
    return (
      <RNModal visible={open} transparent animationType={animation} onRequestClose={() => dismiss('back')}>
        <Pressable
          style={[styles.scrim, blocksUnderlying && styles.scrimBlocks, styles.bottomEnd]}
          onPress={() => dismissMode === 'tap-outside' && dismiss('tap-outside')}
        >
          <Pressable onPress={() => {}} style={styles.bottomSheet}>
            <MinkyPanel borderRadius={24} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
              <View style={styles.dragHandle} />
              {title ? (
                <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(17) }]}>
                  {title}
                </Text>
              ) : null}
              {body}
              {dismissMode === 'explicit-close-button' || dismissMode === 'tap-outside' ? (
                <Pressable
                  onPress={() => dismiss('explicit-close')}
                  style={styles.dismissBtn}
                >
                  <Text style={[styles.dismissBtnText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>Close</Text>
                </Pressable>
              ) : null}
            </MinkyPanel>
          </Pressable>
        </Pressable>
      </RNModal>
    );
  }

  // Side drawer
  if (overlayKind === 'side-drawer') {
    return (
      <RNModal visible={open} transparent animationType="slide" onRequestClose={() => dismiss('back')}>
        <Pressable
          style={[styles.scrim, blocksUnderlying && styles.scrimBlocks, styles.rightEnd]}
          onPress={() => dismissMode === 'tap-outside' && dismiss('tap-outside')}
        >
          <Pressable onPress={() => {}} style={styles.sideDrawer}>
            <MinkyPanel borderRadius={0} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
              {title ? <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(17) }]}>{title}</Text> : null}
              {body}
            </MinkyPanel>
          </Pressable>
        </Pressable>
      </RNModal>
    );
  }

  // Default: centered-modal or fullscreen-overlay — delegate to the platform Modal.js so
  // primitives stack inside the same modal-within-a-modal model used by flow drops.
  return (
    <PlatformModal
      visible={open}
      onClose={() => dismiss('explicit-close')}
      title={title}
      size={overlayKind === 'fullscreen-overlay' ? 'fullscreen' : 'small'}
      showClose
      playSound={false}
    >
      {body}
    </PlatformModal>
  );
});

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  scrimBlocks: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  bottomEnd: { justifyContent: 'flex-end' },
  rightEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
  centeredInner: { maxWidth: 480, width: '100%' },
  fullscreenInner: { width: '100%', height: '100%' },
  bottomSheet: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  sideDrawer: {
    width: '70%',
    maxWidth: 380,
    height: '100%',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 44, height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(69, 67, 66, 0.35)',
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  closeBtn: {
    minWidth: 48, minHeight: 48,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  closeX: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(69, 67, 66, 0.85)',
  },
  dismissBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  toastWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  toastText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  contextWrap: { alignSelf: 'flex-start' },
});

export default ModalOverlayOrBottomSheet;
