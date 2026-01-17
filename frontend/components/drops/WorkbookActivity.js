import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import Scroll from '../Scroll';

/**
 * WorkbookActivity Drop
 * Multi-step form/activity with navigation between steps
 */
const WorkbookActivity = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack,
  accumulatedData
}) => {
  const [activity, setActivity] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResponses, setStepResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activityId = accumulatedData?.activityId || input?.activityId;
  const bookshelfId = accumulatedData?.bookshelfId || input?.bookshelfId;

  useEffect(() => {
    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  const loadActivity = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load activity details
      const result = await WebSocketService.emit('workbook:activity:load', {
        activityId,
        sessionId: SessionStore.sessionId
      });

      if (result?.activity) {
        setActivity(result.activity);

        // If there's existing progress, load it
        if (result.progress) {
          setProgress(result.progress);
          // Restore step responses from progress
          const responses = {};
          if (result.progress.stepData) {
            for (const [key, value] of Object.entries(result.progress.stepData)) {
              responses[key] = value;
            }
          }
          setStepResponses(responses);

          // Resume at last incomplete step
          const completedSteps = result.progress.completedSteps || [];
          const steps = result.activity.steps || [];
          const firstIncomplete = steps.findIndex(s => !completedSteps.includes(s.stepId));
          if (firstIncomplete >= 0) {
            setCurrentStepIndex(firstIncomplete);
          }
        }

        // Start the activity (creates progress record if needed)
        await WebSocketService.emit('workbook:activity:start', {
          sessionId: SessionStore.sessionId,
          activityId
        });
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = activity?.steps?.[currentStepIndex];
  const totalSteps = activity?.steps?.length || 0;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleResponseChange = (value) => {
    if (!currentStep) return;
    setStepResponses(prev => ({
      ...prev,
      [currentStep.stepId]: value
    }));
  };

  const handleCheckboxToggle = (option) => {
    if (!currentStep) return;
    const currentValue = stepResponses[currentStep.stepId] || [];
    const newValue = currentValue.includes(option)
      ? currentValue.filter(o => o !== option)
      : [...currentValue, option];
    setStepResponses(prev => ({
      ...prev,
      [currentStep.stepId]: newValue
    }));
  };

  const saveCurrentStep = async () => {
    if (!currentStep || !WebSocketService.socket) return;

    try {
      setSaving(true);
      await WebSocketService.emit('workbook:step:complete', {
        sessionId: SessionStore.sessionId,
        activityId,
        stepId: currentStep.stepId,
        stepData: stepResponses[currentStep.stepId]
      });
    } catch (error) {
      console.error('Error saving step:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveCurrentStep();

    if (isLastStep) {
      // Complete the activity
      try {
        await WebSocketService.emit('workbook:activity:complete', {
          sessionId: SessionStore.sessionId,
          activityId
        });
      } catch (error) {
        console.error('Error completing activity:', error);
      }
      onComplete({ action: 'complete' });
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (isFirstStep) {
      onComplete({ action: 'back' });
    } else {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.textInput, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}
            multiline
            numberOfLines={4}
            placeholder="Type your response..."
            placeholderTextColor="rgba(64, 63, 62, 0.5)"
            value={stepResponses[currentStep.stepId] || ''}
            onChangeText={handleResponseChange}
          />
        );

      case 'checkbox':
        return (
          <View style={styles.checkboxContainer}>
            {(currentStep.options || []).map((option, index) => {
              const isChecked = (stepResponses[currentStep.stepId] || []).includes(option);
              return (
                <Pressable
                  key={index}
                  style={styles.checkboxRow}
                  onPress={() => handleCheckboxToggle(option)}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkmark}>check</Text>}
                  </View>
                  <Text style={[styles.checkboxLabel, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );

      case 'slider':
        // Placeholder for slider - using simple number buttons
        return (
          <View style={styles.sliderContainer}>
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = stepResponses[currentStep.stepId] === num;
              return (
                <Pressable
                  key={num}
                  style={[styles.sliderButton, isSelected && styles.sliderButtonSelected]}
                  onPress={() => handleResponseChange(num)}
                >
                  <Text style={[styles.sliderButtonText, isSelected && styles.sliderButtonTextSelected]}>
                    {num}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );

      default:
        return (
          <Text style={styles.errorText}>Unknown step type: {currentStep.type}</Text>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <MinkyPanel
          borderRadius={8}
          padding={20}
          paddingTop={20}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          <Text style={[styles.loadingText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
            Loading activity...
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <MinkyPanel
          borderRadius={8}
          padding={20}
          paddingTop={20}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          <Text style={[styles.errorText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
            Activity not found
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        {activity.steps.map((step, index) => (
          <View
            key={step.stepId}
            style={[
              styles.progressDot,
              index < currentStepIndex && styles.progressDotCompleted,
              index === currentStepIndex && styles.progressDotCurrent
            ]}
          />
        ))}
      </View>

      <Text style={[styles.stepCounter, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
        Step {currentStepIndex + 1} of {totalSteps}
      </Text>

      {/* Step content */}
      <Scroll style={styles.stepContent}>
        <MinkyPanel
          borderRadius={8}
          padding={16}
          paddingTop={16}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#403F3E') }]}>
            {currentStep?.prompt}
          </Text>

          <View style={styles.responseArea}>
            {renderStepContent()}
          </View>
        </MinkyPanel>
      </Scroll>

      {/* Navigation buttons */}
      <View style={styles.navigation}>
        <WoolButton
          onPress={handlePrevious}
          variant="gray"
          size="small"
        >
          {isFirstStep ? 'Back' : 'Previous'}
        </WoolButton>

        <WoolButton
          onPress={handleNext}
          variant="purple"
          size="small"
          disabled={saving}
        >
          {saving ? 'Saving...' : isLastStep ? 'Complete' : 'Next'}
        </WoolButton>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.3)',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressDotCurrent: {
    backgroundColor: '#7044C7',
  },
  stepCounter: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  stepContent: {
    flex: 1,
  },
  prompt: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  responseArea: {
    minHeight: 100,
  },
  textInput: {
    minHeight: 100,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 14,
    color: '#403F3E',
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#7044C7',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7044C7',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
    borderColor: '#7044C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonSelected: {
    backgroundColor: '#7044C7',
  },
  sliderButtonText: {
    fontSize: 18,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  sliderButtonTextSelected: {
    color: '#fff',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default WorkbookActivity;
