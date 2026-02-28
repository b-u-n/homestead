import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, Platform, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

/**
 * ActionPlanStep
 * Multi-section structured form.
 *
 * Props from step definition:
 *   step.sections: [
 *     { id: 'problem', label: 'Define the problem', placeholder: '...', multiline: false },
 *     { id: 'goal', label: 'Your goal', placeholder: '...' },
 *     { id: 'steps', label: 'Action steps', placeholder: '...', multiline: true },
 *   ]
 */
const ActionPlanStep = observer(({ step, value, onChange }) => {
  const sections = step.sections || [];
  const responses = value || {};

  const handleSectionChange = (sectionId, text) => {
    onChange({ ...responses, [sectionId]: text });
  };

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        {sections.map((section) => (
          <MinkyPanel
            key={section.id}
            borderRadius={8}
            padding={12}
            paddingTop={12}
            overlayColor="rgba(112, 68, 199, 0.1)"
          >
            <Text
              style={[
                styles.sectionLabel,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(15),
                  color: FontSettingsStore.getFontColor('#2D2C2B'),
                },
              ]}
            >
              {section.label}
            </Text>
            {section.multiline ? (
              <MultilineField
                value={responses[section.id] || ''}
                onChange={(text) => handleSectionChange(section.id, text)}
                placeholder={section.placeholder}
              />
            ) : (
              <TextInput
                style={[
                  styles.singleLineInput,
                  {
                    fontSize: FontSettingsStore.getScaledFontSize(16),
                    color: FontSettingsStore.getFontColor('#2D2C2B'),
                  },
                ]}
                placeholder={section.placeholder || ''}
                placeholderTextColor="rgba(64, 63, 62, 0.4)"
                value={responses[section.id] || ''}
                onChangeText={(text) => handleSectionChange(section.id, text)}
              />
            )}
          </MinkyPanel>
        ))}
      </View>
    </ScrollBarView>
  );
});

/**
 * MultilineField — auto-expanding textarea following TEXTBOX.md pattern
 */
const MultilineField = observer(({ value, onChange, placeholder }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && textareaRef.current) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = (textareaRef.current.scrollHeight + 8) + 'px';
        }
      });
    }
  }, [value]);

  if (Platform.OS === 'web') {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ''}
        style={{
          fontFamily: 'Comfortaa',
          fontSize: FontSettingsStore.getScaledFontSize(16),
          color: FontSettingsStore.getFontColor('#2D2C2B'),
          padding: FontSettingsStore.getScaledSpacing(10),
          borderRadius: 6,
          border: '1px solid rgba(92, 90, 88, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          outline: 'none',
          resize: 'none',
          width: '100%',
          minHeight: FontSettingsStore.getScaledSpacing(80),
          boxSizing: 'border-box',
          overflow: 'hidden',
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
        styles.multilineInput,
        {
          fontSize: FontSettingsStore.getScaledFontSize(16),
          color: FontSettingsStore.getFontColor('#2D2C2B'),
        },
      ]}
      multiline
      placeholder={placeholder || ''}
      placeholderTextColor="rgba(64, 63, 62, 0.4)"
      value={value}
      onChangeText={onChange}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 15,
    color: '#2D2C2B',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  singleLineInput: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.2)',
  },
  multilineInput: {
    minHeight: 80,
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.2)',
  },
});

export default ActionPlanStep;
