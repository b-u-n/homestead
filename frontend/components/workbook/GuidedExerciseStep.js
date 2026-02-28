import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import WoolButton from '../WoolButton';

/**
 * GuidedExerciseStep
 * Timed/sequenced instruction delivery with breathing, sequential, or timed modes.
 *
 * Props from step definition:
 *   step.instructions: [{ text: '...', duration: 4000 }, ...]
 *   step.repeats: 10
 *   step.mode: 'breathing' | 'sequential' | 'timed'
 */
const GuidedExerciseStep = observer(({ step, value, onChange }) => {
  const instructions = step.instructions || [];
  const repeats = step.repeats || 1;
  const mode = step.mode || 'sequential';

  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completed, setCompleted] = useState(value?.completed || false);
  const [timeLeft, setTimeLeft] = useState(0);

  const breathScale = useRef(new Animated.Value(0.6)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentInstruction = instructions[currentIndex];

  const advanceInstruction = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= instructions.length) {
      // Finished one cycle
      if (currentCycle < repeats) {
        setCurrentCycle(c => c + 1);
        setCurrentIndex(0);
        runInstruction(0);
      } else {
        // All cycles done
        setRunning(false);
        setCompleted(true);
        onChange({ completed: true, cyclesCompleted: repeats });
      }
    } else {
      setCurrentIndex(nextIndex);
      runInstruction(nextIndex);
    }
  };

  const runInstruction = (index) => {
    const inst = instructions[index];
    if (!inst) return;

    if (mode === 'breathing') {
      // Animate breathing circle
      const isInhale = index % 4 === 0; // inhale, hold, exhale, pause pattern
      const isExhale = index % 4 === 2;

      if (isInhale) {
        Animated.timing(breathScale, {
          toValue: 1,
          duration: inst.duration,
          useNativeDriver: false,
        }).start();
      } else if (isExhale) {
        Animated.timing(breathScale, {
          toValue: 0.6,
          duration: inst.duration,
          useNativeDriver: false,
        }).start();
      }
    }

    // Set countdown
    setTimeLeft(Math.ceil(inst.duration / 1000));
    const startTime = Date.now();
    const countDown = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.ceil((inst.duration - elapsed) / 1000);
      if (remaining > 0) {
        setTimeLeft(remaining);
        timerRef.current = setTimeout(countDown, 250);
      } else {
        setTimeLeft(0);
        advanceInstruction();
      }
    };
    timerRef.current = setTimeout(countDown, 250);
  };

  const handleStart = () => {
    setRunning(true);
    setCurrentIndex(0);
    setCurrentCycle(1);
    setCompleted(false);
    runInstruction(0);
  };

  const handlePause = () => {
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    breathScale.stopAnimation();
  };

  if (completed) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text
            style={[
              styles.completedText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(20),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            Exercise Complete
          </Text>
          <Text
            style={[
              styles.cycleInfo,
              {
                fontSize: FontSettingsStore.getScaledFontSize(16),
                color: FontSettingsStore.getFontColor('#454342'),
              },
            ]}
          >
            {repeats} {repeats === 1 ? 'cycle' : 'cycles'} completed
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Breathing mode: animated circle */}
      {mode === 'breathing' && running && (
        <View style={styles.breathingContainer}>
          <Animated.View
            style={[
              styles.breathCircle,
              {
                transform: [{ scale: breathScale }],
                opacity: breathScale.interpolate({
                  inputRange: [0.6, 1],
                  outputRange: [0.5, 0.8],
                }),
              },
            ]}
          />
        </View>
      )}

      {/* Current instruction */}
      {running && currentInstruction && (
        <View style={styles.instructionContainer}>
          <Text
            style={[
              styles.instructionText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(20),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            {currentInstruction.text}
          </Text>

          {timeLeft > 0 && (
            <Text
              style={[
                styles.timer,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(26),
                  color: FontSettingsStore.getFontColor('#7044C7'),
                },
              ]}
            >
              {timeLeft}
            </Text>
          )}

          {/* Cycle counter */}
          {repeats > 1 && (
            <Text
              style={[
                styles.cycleCounter,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(14),
                  color: FontSettingsStore.getFontColor('#454342'),
                },
              ]}
            >
              {mode === 'breathing' ? 'Breath' : 'Cycle'} {currentCycle} of {repeats}
            </Text>
          )}
        </View>
      )}

      {/* Start/Pause/Restart */}
      {!running && (
        <View style={styles.startContainer}>
          {!completed && currentIndex === 0 && currentCycle === 1 && (
            <Text
              style={[
                styles.readyText,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(16),
                  color: FontSettingsStore.getFontColor('#454342'),
                },
              ]}
            >
              {mode === 'breathing'
                ? `${repeats} breathing cycles`
                : `${instructions.length} instructions, ${repeats} ${repeats === 1 ? 'cycle' : 'cycles'}`}
            </Text>
          )}
          <WoolButton
            onPress={handleStart}
            variant="green"
            size="medium"
          >
            {currentIndex === 0 && currentCycle === 1 ? 'Start' : 'Resume'}
          </WoolButton>
        </View>
      )}

      {running && (
        <View style={styles.pauseContainer}>
          <WoolButton
            onPress={handlePause}
            variant="gray"
            size="small"
          >
            Pause
          </WoolButton>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 200,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    width: 160,
  },
  breathCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(112, 68, 199, 0.4)',
    borderWidth: 3,
    borderColor: 'rgba(112, 68, 199, 0.6)',
  },
  instructionContainer: {
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 20,
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  timer: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 26,
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cycleCounter: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 14,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  startContainer: {
    alignItems: 'center',
    gap: 12,
  },
  pauseContainer: {
    marginTop: 8,
  },
  readyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#454342',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  completedContainer: {
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 20,
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cycleInfo: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default GuidedExerciseStep;
