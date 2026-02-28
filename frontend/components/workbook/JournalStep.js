import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Platform, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';

/**
 * JournalStep
 * Extended writing with optional timer and word count.
 *
 * Props from step definition:
 *   step.timerMinutes: 20        // optional countdown
 *   step.minWords: 0             // optional minimum
 *   step.placeholder: '...'
 *   step.showWordCount: true
 *   step.showReread: true        // shows "Re-read" button after writing
 */
const JournalStep = observer(({ step, value, onChange }) => {
  const text = value || '';
  const timerMinutes = step.timerMinutes || 0;
  const minWords = step.minWords || 0;
  const placeholder = step.placeholder || 'Write your thoughts...';
  const showWordCount = step.showWordCount !== false;
  const showReread = step.showReread || false;

  const [secondsLeft, setSecondsLeft] = useState(timerMinutes * 60);
  const [timerActive, setTimerActive] = useState(timerMinutes > 0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [rereadMode, setRereadMode] = useState(false);
  const textareaRef = useRef(null);
  const intervalRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const meetsMinWords = wordCount >= minWords;

  // Timer
  useEffect(() => {
    if (timerActive && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setTimerActive(false);
            setTimerExpired(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);

  // Auto-expand textarea on web
  useEffect(() => {
    if (Platform.OS === 'web' && textareaRef.current) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = (textareaRef.current.scrollHeight + 8) + 'px';
        }
      });
    }
  }, [text]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setTimerActive(true);
  };

  const renderTextArea = () => {
    if (Platform.OS === 'web') {
      return (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={rereadMode}
          style={{
            fontFamily: 'Comfortaa',
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B'),
            padding: FontSettingsStore.getScaledSpacing(12),
            borderRadius: 8,
            border: '1px solid rgba(92, 90, 88, 0.3)',
            backgroundColor: rereadMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
            outline: 'none',
            resize: 'none',
            width: '100%',
            minHeight: FontSettingsStore.getScaledSpacing(180),
            boxSizing: 'border-box',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15), inset -1px 0 0 rgba(0, 0, 0, 0.15)',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
      );
    }

    return (
      <TextInput
        style={[
          styles.textInput,
          {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B'),
            padding: FontSettingsStore.getScaledSpacing(12),
          },
        ]}
        multiline
        placeholder={placeholder}
        placeholderTextColor="rgba(64, 63, 62, 0.4)"
        value={text}
        onChangeText={onChange}
        editable={!rereadMode}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Text area */}
      {renderTextArea()}

      {/* Footer: word count, re-read button, timer */}
      <View style={styles.footerRow}>
        {showWordCount && (
          <Text style={styles.wordCount}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
            {minWords > 0 ? ` (min: ${minWords})` : ''}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        {showReread && text.length > 0 && (timerExpired || meetsMinWords || !timerMinutes) && (
          <WoolButton
            onPress={() => setRereadMode(!rereadMode)}
            variant="gray"
            size="small"
          >
            {rereadMode ? 'Edit' : 'Re-read'}
          </WoolButton>
        )}
        {timerActive && (
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        )}
        {timerExpired && (
          <Text style={styles.timerText}>Time's up</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  timerText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 13,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  textInput: {
    minHeight: 180,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCount: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 13,
    color: '#454342',
    paddingLeft: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default JournalStep;
