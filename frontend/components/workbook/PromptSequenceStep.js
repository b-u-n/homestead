import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';

/**
 * PromptSequenceStep
 * Multiple sub-prompts within a single step, answered one at a time.
 *
 * Props from step definition:
 *   step.prompts: [
 *     { id: 'see', prompt: 'Name 5 things you can SEE', count: 5 },
 *     { id: 'feel', prompt: 'Name 4 things you can FEEL', count: 4 },
 *     ...
 *   ]
 */
const PromptSequenceStep = observer(({ step, value, onChange }) => {
  const prompts = step.prompts || [];
  const responses = value || {};
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const currentPrompt = prompts[currentPromptIndex];
  const isLastPrompt = currentPromptIndex === prompts.length - 1;

  const handleFieldChange = (promptId, fieldIndex, text) => {
    const existing = responses[promptId] || [];
    const updated = [...existing];
    updated[fieldIndex] = text;
    onChange({ ...responses, [promptId]: updated });
  };

  const handleNextPrompt = () => {
    if (!isLastPrompt) {
      setCurrentPromptIndex(i => i + 1);
    }
  };

  const handlePrevPrompt = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(i => i - 1);
    }
  };

  if (!currentPrompt) return null;

  const count = currentPrompt.count || 1;
  const fieldValues = responses[currentPrompt.id] || [];

  return (
    <View style={styles.container}>
      {/* Mini progress */}
      <Text
        style={[
          styles.miniProgress,
          {
            fontSize: FontSettingsStore.getScaledFontSize(11),
            color: FontSettingsStore.getFontColor('#454342'),
          },
        ]}
      >
        Prompt {currentPromptIndex + 1} of {prompts.length}
      </Text>

      {/* Current prompt */}
      <MinkyPanel
        borderRadius={8}
        padding={14}
        paddingTop={14}
        overlayColor="rgba(112, 68, 199, 0.12)"
      >
        <Text
          style={[
            styles.promptText,
            {
              fontSize: FontSettingsStore.getScaledFontSize(15),
              color: FontSettingsStore.getFontColor('#2D2C2B'),
            },
          ]}
        >
          {currentPrompt.prompt}
        </Text>

        <View style={styles.fieldsContainer}>
          {Array.from({ length: count }).map((_, i) => (
            <TextInput
              key={i}
              style={[
                styles.fieldInput,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(16),
                  color: FontSettingsStore.getFontColor('#2D2C2B'),
                },
              ]}
              placeholder={`${i + 1}.`}
              placeholderTextColor="rgba(64, 63, 62, 0.4)"
              value={fieldValues[i] || ''}
              onChangeText={(text) => handleFieldChange(currentPrompt.id, i, text)}
            />
          ))}
        </View>
      </MinkyPanel>

      {/* Internal navigation */}
      <View style={styles.navRow}>
        {currentPromptIndex > 0 && (
          <WoolButton
            onPress={handlePrevPrompt}
            variant="gray"
            size="small"
          >
            Back
          </WoolButton>
        )}
        <View style={{ flex: 1 }} />
        {!isLastPrompt && (
          <WoolButton
            onPress={handleNextPrompt}
            variant="purple"
            size="small"
          >
            Next prompt
          </WoolButton>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  miniProgress: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 11,
    color: '#454342',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  promptText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 15,
    color: '#2D2C2B',
    marginBottom: 12,
    lineHeight: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fieldsContainer: {
    gap: 8,
  },
  fieldInput: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 16,
    color: '#2D2C2B',
    lineHeight: 24,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.15)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default PromptSequenceStep;
