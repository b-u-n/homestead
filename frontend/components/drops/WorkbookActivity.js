import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import Scroll from '../Scroll';
import PsychoeducationStep from '../workbook/PsychoeducationStep';
import RatingStep from '../workbook/RatingStep';
import LikertStep from '../workbook/LikertStep';
import GuidedExerciseStep from '../workbook/GuidedExerciseStep';
import PromptSequenceStep from '../workbook/PromptSequenceStep';
import JournalStep from '../workbook/JournalStep';
import ChecklistAssessmentStep from '../workbook/ChecklistAssessmentStep';
import SortableListStep from '../workbook/SortableListStep';
import ActionPlanStep from '../workbook/ActionPlanStep';
import LikertReflectionStep from '../workbook/LikertReflectionStep';
import StitchedProgressBar from '../workbook/StitchedProgressBar';

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

  const landingData = accumulatedData?.['workbook:landing'];
  const activityId = landingData?.activityId || accumulatedData?.activityId || input?.activityId;
  const bookshelfId = landingData?.bookshelfId || accumulatedData?.bookshelfId || input?.bookshelfId;

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
    const stepValue = stepResponses[currentStep.stepId];

    switch (currentStep.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.textInput, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#2D2C2B') }]}
            multiline
            numberOfLines={4}
            placeholder="Type your response..."
            placeholderTextColor="rgba(64, 63, 62, 0.5)"
            value={stepValue || ''}
            onChangeText={handleResponseChange}
          />
        );

      case 'checkbox':
      case 'multiselect':
        return (
          <View style={styles.checkboxContainer}>
            {(currentStep.options || []).map((option, index) => {
              const isChecked = (stepValue || []).includes(option);
              return (
                <WoolButton
                  key={index}
                  onPress={() => handleCheckboxToggle(option)}
                  variant="purple"
                  size="small"
                  focused={isChecked}
                >
                  {(isChecked ? '\u2713  ' : '') + option}
                </WoolButton>
              );
            })}
          </View>
        );

      case 'slider':
        return (
          <View style={styles.sliderContainer}>
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = stepValue === num;
              return (
                <View key={num} style={styles.sliderButtonWrapper}>
                  <WoolButton
                    onPress={() => handleResponseChange(num)}
                    variant="purple"
                    size="small"
                    focused={isSelected}
                  >
                    {String(num)}
                  </WoolButton>
                </View>
              );
            })}
          </View>
        );

      case 'psychoeducation':
        return <PsychoeducationStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'rating':
        return <RatingStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'likert':
        return <LikertStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'guided-exercise':
        return <GuidedExerciseStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'prompt-sequence':
        return <PromptSequenceStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'journal':
        return <JournalStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'checklist-assessment':
        return <ChecklistAssessmentStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'sortable-list':
        return <SortableListStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'action-plan':
        return <ActionPlanStep step={currentStep} value={stepValue} onChange={handleResponseChange} />;

      case 'likert-reflection':
        return <LikertReflectionStep step={currentStep} allResponses={stepResponses} />;

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
          <Text style={[styles.loadingText, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#454342') }]}>
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
          <Text style={[styles.errorText, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#454342') }]}>
            Activity not found
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <StitchedProgressBar progress={(currentStepIndex + 1) / totalSteps} steps={totalSteps} />
      <Text style={styles.stepCounter}>
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
          <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor('#2D2C2B') }]}>
            {Array.isArray(currentStep?.prompt)
              ? currentStep.prompt[Math.floor(Math.random() * currentStep.prompt.length)]
              : currentStep?.prompt}
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
          variant="purple"
          size="small"
          overlayColor="rgba(100, 130, 195, 0.25)"
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
  stepCounter: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  stepContent: {
    flex: 1,
  },
  prompt: {
    fontSize: 18,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
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
    fontSize: 16,
    color: '#2D2C2B',
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    gap: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  sliderButtonWrapper: {
    minWidth: 48,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default WorkbookActivity;
