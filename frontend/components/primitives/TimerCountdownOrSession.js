import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * timer-countdown-or-session — countdown/count-up/session timer.
 */
const formatSeconds = (s) => {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TimerCountdownOrSession = observer(({
  timerKind = 'countdown-ring',
  durationSeconds = 30,
  phaseList,
  completionSignal = 'chime',
  autoStart = false,
  allowOverflow = false,
  // loop — when true, on hitting totalSeconds the timer resets to 0 and
  // keeps ticking instead of stopping. Used by activities like progressive
  // muscle relaxation where the user moves through muscle groups at their
  // own pace and the timer just paces each held breath.
  loop = false,
  scope = 'single-phase',
  size = 160,
  style,
  onTimerStarted,
  onTimerPaused,
  onPhaseAdvanced,
  onTimerCompleted,
  onSessionCompleted,
  onValueChanged,
  onCommit,
}) => {
  const phases = phaseList && phaseList.length ? phaseList : [{ label: 'Session', duration: durationSeconds }];
  const totalSeconds = phases.reduce((sum, p) => sum + p.duration, 0);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const startedRef = useRef(false);
  const intervalRef = useRef(null);

  const currentPhase = phases[phaseIdx];
  const phaseStartElapsed = phases.slice(0, phaseIdx).reduce((s, p) => s + p.duration, 0);
  const phaseElapsed = elapsed - phaseStartElapsed;

  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = timerKind === 'count-up' ? 0 : currentPhase ? phaseElapsed / currentPhase.duration : 0;
    Animated.timing(ringAnim, { toValue: target, duration: 250, useNativeDriver: false }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, phaseIdx]);

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      start();
    }
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (running || (completed && !allowOverflow)) return;
    setRunning(true);
    startedRef.current = true;
    onTimerStarted && onTimerStarted();
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        // Emit elapsed every tick so a parent step can capture it via bind.
        onValueChanged && onValueChanged(formatSeconds(next));
        if (next >= totalSeconds) {
          if (loop) {
            // Looped session: emit one completion ping per lap (so the parent
            // can ding/vibrate) but reset elapsed and phase and keep going.
            onTimerCompleted && onTimerCompleted();
            setPhaseIdx(0);
            return 0;
          }
          if (allowOverflow) {
            // Mark completion the first time we cross the threshold but keep ticking.
            if (prev < totalSeconds) {
              setCompleted(true);
              onTimerCompleted && onTimerCompleted();
              if (scope === 'session-wrapper' || scope === 'multi-phase-sequence') {
                onSessionCompleted && onSessionCompleted();
              }
            }
            return next;
          }
          clearInterval(intervalRef.current);
          setRunning(false);
          setCompleted(true);
          onTimerCompleted && onTimerCompleted();
          if (scope === 'session-wrapper' || scope === 'multi-phase-sequence') {
            onSessionCompleted && onSessionCompleted();
          }
          return totalSeconds;
        }
        // Phase boundary?
        let acc = 0;
        for (let i = 0; i < phases.length; i++) {
          acc += phases[i].duration;
          if (next === acc && i < phases.length - 1) {
            setPhaseIdx(i + 1);
            onPhaseAdvanced && onPhaseAdvanced({ from: i, to: i + 1, phase: phases[i + 1] });
            break;
          }
        }
        return next;
      });
    }, 1000);
  };

  const pause = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    onTimerPaused && onTimerPaused();
    // Lock in the final elapsed time on pause, so a downstream step can carry it.
    onCommit && onCommit(formatSeconds(elapsed));
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setPhaseIdx(0);
    setCompleted(false);
    clearInterval(intervalRef.current);
  };

  const remaining = Math.max(0, totalSeconds - elapsed);
  const overshoot = Math.max(0, elapsed - totalSeconds);
  const display = timerKind === 'count-up'
    ? formatSeconds(elapsed)
    : (allowOverflow && overshoot > 0
        ? `+${formatSeconds(overshoot)}`
        : formatSeconds(remaining));

  if (timerKind === 'non-visual-controller') {
    return null;
  }

  if (timerKind === 'countdown-digits') {
    return (
      <MinkyPanel borderRadius={12} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)" style={style}>
        <Text style={[styles.digitDisplay, { fontSize: FontSettingsStore.getScaledFontSize(36) }]}>
          {display}
        </Text>
        {currentPhase && phases.length > 1 ? (
          <Text style={[styles.phaseLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            {currentPhase.label}
          </Text>
        ) : null}
        <View style={styles.controlRow}>
          {!running && !completed ? (
            <Pressable onPress={start}><Text style={styles.controlBtn}>▶ Start</Text></Pressable>
          ) : running ? (
            <Pressable onPress={pause}><Text style={styles.controlBtn}>⏸ Pause</Text></Pressable>
          ) : null}
          {(elapsed > 0 || completed) ? (
            <Pressable onPress={reset}><Text style={styles.controlBtn}>↻ Reset</Text></Pressable>
          ) : null}
        </View>
        {completed ? <Text style={styles.doneText}>✓ Done</Text> : null}
      </MinkyPanel>
    );
  }

  // Default: countdown-ring — dashed ring where each dash lights up sequentially as time elapses.
  const ringSize = size;
  const ringRadius = ringSize / 2 - 10;
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const totalDashes = 24;
  // Reverse for countdown so dashes "drain" with time; count-up fills forward.
  const progress = totalSeconds > 0 ? Math.min(1, elapsed / totalSeconds) : 0;
  const litCount = Math.round((timerKind === 'count-up' ? progress : (1 - progress)) * totalDashes);

  // Build SVG arc paths for each dash slot.
  const dashes = Array.from({ length: totalDashes }).map((_, i) => {
    const slotDegrees = 360 / totalDashes;
    const dashSpan = slotDegrees * 0.6; // 60% dash, 40% gap
    const startDeg = i * slotDegrees - 90; // start at top, clockwise
    const endDeg = startDeg + dashSpan;
    const toRad = (d) => (d * Math.PI) / 180;
    const x1 = cx + ringRadius * Math.cos(toRad(startDeg));
    const y1 = cy + ringRadius * Math.sin(toRad(startDeg));
    const x2 = cx + ringRadius * Math.cos(toRad(endDeg));
    const y2 = cy + ringRadius * Math.sin(toRad(endDeg));
    return { i, d: `M ${x1} ${y1} A ${ringRadius} ${ringRadius} 0 0 1 ${x2} ${y2}` };
  });

  return (
    <MinkyPanel borderRadius={12} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)" style={style}>
      <View style={[styles.ringWrap, { width: ringSize, height: ringSize }]}>
        {Platform.OS === 'web' ? (
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {dashes.map(({ i, d }) => {
              const lit = i < litCount;
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={lit ? '#7044C7' : 'rgba(92, 90, 88, 0.35)'}
                  strokeWidth={lit ? 8 : 5}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        ) : (
          // Native fallback: solid scaling fill
          <Animated.View
            style={[
              styles.ringFill,
              {
                width: ringSize - 20,
                height: ringSize - 20,
                top: 10,
                left: 10,
                borderRadius: (ringSize - 20) / 2,
                backgroundColor: 'rgba(135, 180, 210, 0.45)',
                transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] }) }],
              },
            ]}
          />
        )}
        <View style={styles.ringContent} pointerEvents="none">
          <Text style={[styles.digitDisplay, { fontSize: FontSettingsStore.getScaledFontSize(28) }]}>
            {display}
          </Text>
          {currentPhase && phases.length > 1 ? (
            <Text style={[styles.phaseLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              {currentPhase.label}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.controlRow}>
        {!running && !completed ? (
          <Pressable onPress={start}><Text style={styles.controlBtn}>▶ Start</Text></Pressable>
        ) : running ? (
          <Pressable onPress={pause}><Text style={styles.controlBtn}>⏸ Pause</Text></Pressable>
        ) : null}
        {(elapsed > 0 || completed) ? (
          <Pressable onPress={reset}><Text style={styles.controlBtn}>↻ Reset</Text></Pressable>
        ) : null}
      </View>
      {completed ? <Text style={styles.doneText}>✓ Done</Text> : null}
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  digitDisplay: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  phaseLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  controlRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 10 },
  controlBtn: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  doneText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ringWrap: {
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    position: 'absolute',
  },
  ringContent: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TimerCountdownOrSession;
