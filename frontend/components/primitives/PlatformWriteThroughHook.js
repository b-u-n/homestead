import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import HopeChestStore from '../../stores/HopeChestStore';
import MinkyPanel from '../MinkyPanel';

/**
 * platform-write-through-hook — silent platform-bridge or celebratory burst.
 *
 * Mostly non-visual. Three destinations:
 *  - hope-chest → HopeChestStore.write()
 *  - safety-plan → logged for now (real safety-plan store deferred per plan)
 *  - completion-celebration-animation → confetti burst overlay
 *
 * Imperative API: call `fire()` on the ref OR pass `triggerKey` (a value that changes when you
 * want the hook to fire). Confirmation_mode controls visible feedback.
 */
const PlatformWriteThroughHook = observer(({
  destination = 'hope-chest',
  firesOn = 'save',
  confirmationMode = 'silent',
  extractionKind = 'positive-reflection',
  payload,
  sourcePrototypeId,
  triggerKey = null,
  onStoreWrite,
  onSoftConfirm,
  onCelebratoryAnimationRendered,
}) => {
  const [toast, setToast] = useState(null);
  const [bursting, setBursting] = useState(false);
  const burstAnim = useRef(new Animated.Value(0)).current;
  const lastTriggerRef = useRef(triggerKey);

  const fire = async () => {
    const ts = new Date().toISOString();
    const writeEvent = {
      destination,
      entryType: extractionKind,
      content: payload,
      sourcePrototype: sourcePrototypeId,
      sourceEvent: firesOn,
      timestamp: ts,
    };

    if (destination === 'hope-chest' && payload) {
      try {
        await HopeChestStore.write({
          content: typeof payload === 'string' ? payload : JSON.stringify(payload),
          sourcePrototypeId,
          sourceFieldRef: extractionKind
        });
      } catch (err) {
        console.error('Hope chest write failed:', err);
      }
    } else if (destination === 'safety-plan') {
      // Deferred per plan — log only
      console.log('[platform-write-through-hook] safety-plan (deferred):', writeEvent);
    } else if (destination === 'completion-celebration-animation') {
      setBursting(true);
      burstAnim.setValue(0);
      Animated.sequence([
        Animated.timing(burstAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(burstAnim, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(() => setBursting(false));
      onCelebratoryAnimationRendered && onCelebratoryAnimationRendered();
    }

    onStoreWrite && onStoreWrite(writeEvent);

    if (confirmationMode === 'soft-confirm-toast') {
      const msg = destination === 'hope-chest' ? 'Saved to hope chest ✨' :
                  destination === 'safety-plan' ? 'Added to your safety plan' :
                  'Logged';
      setToast(msg);
      onSoftConfirm && onSoftConfirm(msg);
      setTimeout(() => setToast(null), 3500);
    }
  };

  useEffect(() => {
    if (triggerKey != null && triggerKey !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerKey;
      fire();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  // Render: only the celebratory burst and optional toast are visible
  if (!toast && !bursting) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {bursting ? (
        <Animated.View
          style={[
            styles.burst,
            {
              opacity: burstAnim,
              transform: [{ scale: burstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }],
            },
          ]}
        >
          <Text style={styles.burstText}>✨🎉✨</Text>
          <Text style={styles.burstLabel}>nicely done</Text>
        </Animated.View>
      ) : null}
      {toast ? (
        <View style={styles.toastWrap}>
          <MinkyPanel borderRadius={24} padding={14} paddingTop={14} overlayColor="rgba(135, 180, 210, 0.65)">
            <Text style={[styles.toastText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              {toast}
            </Text>
          </MinkyPanel>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', minHeight: 60 },
  burst: { padding: 16, alignItems: 'center', gap: 8 },
  burstText: { fontSize: 56, textAlign: 'center' },
  burstLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 16,
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  toastWrap: { marginTop: 8 },
  toastText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PlatformWriteThroughHook;
