import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * breath-pacer-animation — animated breathing pacer (circle / box / ring).
 */
const DEFAULT_PHASES = {
  '2-phase-inhale-exhale': [
    { label: 'Inhale', duration: 4 },
    { label: 'Exhale', duration: 6 },
  ],
  '4-phase-box': [
    { label: 'Inhale', duration: 4 },
    { label: 'Hold', duration: 4 },
    { label: 'Exhale', duration: 4 },
    { label: 'Hold', duration: 4 },
  ],
  '5-phase-478': [
    { label: 'Inhale', duration: 4 },
    { label: 'Hold', duration: 7 },
    { label: 'Exhale', duration: 8 },
  ],
};

const BreathPacerAnimation = observer(({
  pacerShape = 'circle-orb',
  phaseCount = '4-phase-box',
  phaseDurationsSeconds,
  audioHapticConfig = 'silent',
  sessionTotalDuration,
  autoStart = false,
  size = 200,
  style,
  onPhaseTransition,
  onCycleCompleted,
  onSessionCompleted,
  onUserPaused,
}) => {
  const phases = (() => {
    if (Array.isArray(phaseDurationsSeconds)) return phaseDurationsSeconds;
    if (phaseDurationsSeconds && typeof phaseDurationsSeconds === 'object') {
      return Object.entries(phaseDurationsSeconds).map(([k, d]) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(),
        duration: d,
      }));
    }
    return DEFAULT_PHASES[phaseCount] || DEFAULT_PHASES['4-phase-box'];
  })();
  const cycleDuration = phases.reduce((s, p) => s + p.duration, 0);
  const [running, setRunning] = useState(autoStart);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cyclesElapsed, setCyclesElapsed] = useState(0);
  const phaseAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const sessionStartRef = useRef(null);

  const currentPhase = phases[phaseIdx];

  const targetForPhase = (label) => {
    if (label === 'Inhale') return 1;
    if (label === 'Exhale') return 0;
    return null; // Hold — keep current value
  };

  const runPhase = (idx) => {
    const phase = phases[idx];
    const target = targetForPhase(phase.label);
    if (target == null) {
      animRef.current = setTimeout(() => advancePhase(idx), phase.duration * 1000);
      return;
    }
    Animated.timing(phaseAnim, {
      toValue: target,
      duration: phase.duration * 1000,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: false,
    }).start(() => advancePhase(idx));
  };

  const advancePhase = (fromIdx) => {
    const nextIdx = (fromIdx + 1) % phases.length;
    onPhaseTransition && onPhaseTransition({ from: fromIdx, to: nextIdx });
    if (nextIdx === 0) {
      setCyclesElapsed(c => c + 1);
      onCycleCompleted && onCycleCompleted();
      if (sessionTotalDuration && Date.now() - (sessionStartRef.current || Date.now()) >= sessionTotalDuration * 1000) {
        setRunning(false);
        onSessionCompleted && onSessionCompleted();
        return;
      }
    }
    setPhaseIdx(nextIdx);
  };

  useEffect(() => {
    if (!running) return;
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    runPhase(phaseIdx);
    return () => {
      clearTimeout(animRef.current);
      phaseAnim.stopAnimation();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIdx]);

  const start = () => {
    sessionStartRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => {
    setRunning(false);
    onUserPaused && onUserPaused();
    clearTimeout(animRef.current);
    phaseAnim.stopAnimation();
  };

  const maxSize = size;
  const minSize = Math.round(size * 0.4);
  const animatedSize = phaseAnim.interpolate({ inputRange: [0, 1], outputRange: [minSize, maxSize] });

  const isSquare = pacerShape === 'square-box-breathing';
  const borderRadius = isSquare ? phaseAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 16] }) : phaseAnim.interpolate({ inputRange: [0, 1], outputRange: [minSize / 2, maxSize / 2] });

  return (
    <MinkyPanel borderRadius={14} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)" style={style}>
      <View style={styles.center}>
        <View style={[styles.shapeContainer, { width: maxSize + 20, height: maxSize + 20 }]}>
          <Animated.View
            style={[
              styles.shape,
              {
                width: animatedSize,
                height: animatedSize,
                borderRadius,
                backgroundColor: 'rgba(135, 180, 210, 0.45)',
                borderColor: 'rgba(92, 90, 88, 0.45)',
                borderWidth: 2,
                borderStyle: 'dashed',
              },
            ]}
          >
            <View style={styles.phaseTextWrap}>
              <Text style={[styles.phaseText, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
                {running ? currentPhase?.label : 'Ready'}
              </Text>
            </View>
          </Animated.View>
        </View>
        <Text style={[styles.cycleLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {cyclesElapsed} cycle{cyclesElapsed === 1 ? '' : 's'} • {phases.map(p => `${p.label} ${p.duration}s`).join(' · ')}
        </Text>
        <View style={styles.controlRow}>
          {running ? (
            <Pressable onPress={pause}><Text style={styles.controlBtn}>⏸ Pause</Text></Pressable>
          ) : (
            <Pressable onPress={start}><Text style={styles.controlBtn}>▶ Start</Text></Pressable>
          )}
        </View>
      </View>
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  shapeContainer: { alignItems: 'center', justifyContent: 'center' },
  shape: { alignItems: 'center', justifyContent: 'center' },
  phaseTextWrap: { alignItems: 'center', justifyContent: 'center' },
  phaseText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cycleLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    marginTop: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  controlRow: { marginTop: 10 },
  controlBtn: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default BreathPacerAnimation;
