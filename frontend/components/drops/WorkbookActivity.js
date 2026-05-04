import React, { useState, useEffect, useRef } from 'react';
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
import AssessmentResultsStep from '../workbook/AssessmentResultsStep';
import StitchedProgressBar from '../workbook/StitchedProgressBar';
import ComponentStep from '../workbook/ComponentStep';
import * as PrimitivesByRef from '../primitives/_index';

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
  // Live instance ID for this run. Derived from input/accumulated data when
  // resuming a specific instance; otherwise filled in by workbook:activity:start
  // which creates a new instance.
  const [instanceId, setInstanceId] = useState(null);
  // Persistence concept (R4): every state change persists. Keep refs to the
  // latest values so the debounced saver always reads the freshest state, and
  // a refs-mirror of instanceId so we don't capture a stale closure during
  // the load → start → first-render race.
  const stepResponsesRef = useRef({});
  const currentStepIndexRef = useRef(0);
  const instanceIdRef = useRef(null);
  const saveTimerRef = useRef(null);
  stepResponsesRef.current = stepResponses;
  currentStepIndexRef.current = currentStepIndex;
  instanceIdRef.current = instanceId;

  // Sources of activity context: workbook flow's landing, the resume picker,
  // OR the diary flow's landing (when resuming from history).
  const landingData = accumulatedData?.['workbook:landing'];
  const pickerData = accumulatedData?.['workbook:resume-picker'];
  const diaryData = accumulatedData?.['history:landing'];
  const activityId = pickerData?.activityId || landingData?.activityId || diaryData?.activityId || accumulatedData?.activityId || input?.activityId;
  const bookshelfId = landingData?.bookshelfId || accumulatedData?.bookshelfId || input?.bookshelfId;
  const initialInstanceId = pickerData?.instanceId || diaryData?.instanceId || accumulatedData?.instanceId || input?.instanceId || null;

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

      // Load activity definition + the specific instance's progress (if resuming).
      const result = await WebSocketService.emit('workbook:activity:load', {
        activityId,
        sessionId: context?.sessionId ?? SessionStore.sessionId,
        instanceId: initialInstanceId || undefined
      });

      if (result?.activity) {
        setActivity(result.activity);

        if (result.progress) {
          setProgress(result.progress);
          const responses = {};
          if (result.progress.stepData) {
            for (const [key, value] of Object.entries(result.progress.stepData)) {
              responses[key] = value;
            }
          }
          setStepResponses(responses);

          // Resume to the EXACT step the user was on (R4 — currentStepIndex is
          // persisted on every navigation). Fall back to first-incomplete for
          // legacy progress rows that predate currentStepIndex.
          const steps = result.activity.steps || [];
          if (typeof result.progress.currentStepIndex === 'number'
              && result.progress.currentStepIndex >= 0
              && result.progress.currentStepIndex < steps.length) {
            setCurrentStepIndex(result.progress.currentStepIndex);
          } else {
            const completedSteps = result.progress.completedSteps || [];
            const firstIncomplete = steps.findIndex(s => !completedSteps.includes(s.stepId));
            if (firstIncomplete >= 0) {
              setCurrentStepIndex(firstIncomplete);
            }
          }
        }

        // Start (resume specific instance, or create a new one). Capture the
        // returned instanceId so all subsequent step/complete calls target it.
        const startResult = await WebSocketService.emit('workbook:activity:start', {
          sessionId: context?.sessionId ?? SessionStore.sessionId,
          activityId,
          instanceId: initialInstanceId || undefined
        });
        if (startResult?.instanceId) {
          setInstanceId(startResult.instanceId);
        }
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // R4 — Persistence Concept. Every state change (input edit, chip toggle,
  // slider drag, step navigation) is written to the active instance via
  // `workbook:state:save`. Drafts persist; resume returns to the exact state.
  // - Within-step changes are debounced (~500ms) so text typing doesn't spam.
  // - Step navigation triggers an immediate save (no debounce) before render.
  const saveStateNow = async (responses, stepIdx) => {
    const id = instanceIdRef.current;
    if (!id || !activityId || !WebSocketService.socket) return;
    try {
      await WebSocketService.emit('workbook:state:save', {
        sessionId: context?.sessionId ?? SessionStore.sessionId,
        instanceId: id,
        activityId,
        stepData: responses,
        currentStepIndex: stepIdx
      });
    } catch (err) {
      // Non-fatal — auto-save retries on next change.
      console.warn('workbook:state:save failed:', err?.message || err);
    }
  };

  const scheduleStateSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveStateNow(stepResponsesRef.current, currentStepIndexRef.current);
    }, 500);
  };

  // Save immediately on step navigation (skip the initial mount and skip when
  // instanceId isn't ready yet — the first persisted save happens on the first
  // user interaction or on the first step change after start completes).
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!instanceId) return;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveStateNow(stepResponsesRef.current, currentStepIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, instanceId]);

  // Flush any pending debounce when the activity unmounts (user closed the
  // modal mid-typing) so no edit is lost.
  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      saveStateNow(stepResponsesRef.current, currentStepIndexRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = activity?.steps?.[currentStepIndex];
  const totalSteps = activity?.steps?.length || 0;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleResponseChange = (valueOrUpdater) => {
    if (!currentStep) return;
    setStepResponses(prev => {
      const stepId = currentStep.stepId;
      const nextStepValue = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev[stepId])
        : valueOrUpdater;
      return { ...prev, [stepId]: nextStepValue };
    });
    scheduleStateSave();
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
    scheduleStateSave();
  };

  const saveCurrentStep = async () => {
    if (!currentStep || !WebSocketService.socket) return;

    try {
      setSaving(true);
      await WebSocketService.emit('workbook:step:complete', {
        sessionId: context?.sessionId ?? SessionStore.sessionId,
        activityId,
        instanceId,
        stepId: currentStep.stepId,
        stepData: stepResponses[currentStep.stepId]
      });
    } catch (error) {
      console.error('Error saving step:', error);
    } finally {
      setSaving(false);
    }
  };

  // After step navigation, brute-force every scrollable element back to top.
  // Two RAFs so it runs after React commits the new step content AND after
  // any layout settles (images loading, etc.).
  const resetEveryScroller = () => {
    if (typeof document === 'undefined') return;
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.scrollTop > 0) el.scrollTop = 0;
      if (el.scrollLeft > 0) el.scrollLeft = 0;
    }
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };
  const scrollToTopAfterRender = () => {
    requestAnimationFrame(() => {
      resetEveryScroller();
      requestAnimationFrame(resetEveryScroller);
    });
  };

  const fireComplete = async () => {
    try {
      await WebSocketService.emit('workbook:activity:complete', {
        sessionId: context?.sessionId ?? SessionStore.sessionId,
        activityId,
        instanceId
      });
    } catch (error) {
      console.error('Error completing activity:', error);
    }
  };

  const handleNext = async () => {
    await saveCurrentStep();

    const nextStep = activity?.steps?.[currentStepIndex + 1];
    const nextIsTerminal = nextStep?.terminal === true;

    if (isLastStep) {
      // No terminal step exists — fire complete and exit (legacy fallback).
      await fireComplete();
      onComplete({ action: 'complete' });
      return;
    }

    if (nextIsTerminal) {
      // Transitioning into the terminal "saved" step. Fire complete now —
      // the terminal step is the user's confirmation/farewell screen and
      // they leave it via the modal close button, not via Next.
      await fireComplete();
    }

    setCurrentStepIndex(prev => prev + 1);
    scrollToTopAfterRender();
  };

  const handlePrevious = () => {
    if (isFirstStep) {
      onComplete({ action: 'back' });
    } else {
      setCurrentStepIndex(prev => prev - 1);
      scrollToTopAfterRender();
    }
  };

  // R5: pre_mood / post_mood mood widgets (bind === 'pre_mood' | 'post_mood')
  // are lifted out of the step's content panel and rendered as separate blocks
  // above (pre) and below (post) the panel. This keeps "how are you feeling"
  // visually distinct from the activity content.
  const splitMoodComponents = (step) => {
    if (!step || !Array.isArray(step.components)) {
      return { pre: null, post: null, body: step };
    }
    let pre = null;
    let post = null;
    const body = [];
    for (const c of step.components) {
      if (c?.bind === 'pre_mood') pre = c;
      else if (c?.bind === 'post_mood') post = c;
      else body.push(c);
    }
    return { pre, post, body: { ...step, components: body } };
  };

  const renderStepContent = (stepOverride) => {
    const step = stepOverride || currentStep;
    if (!step) return null;
    const stepValue = stepResponses[step.stepId];

    // v2 composition step — dispatched first when the activity uses primitives.
    if (Array.isArray(step.components)) {
      return (
        <ComponentStep
          step={step}
          value={stepValue}
          onChange={handleResponseChange}
          allStepResponses={stepResponses}
          allSteps={activity?.steps || activity?.content?.steps}
          nav={{
            onPrevious: handlePrevious,
            onNext: handleNext,
            isFirstStep,
            isLastStep,
            saving,
          }}
        />
      );
    }
    // Fall through with the active currentStep for v1 dispatch below.

    // v1 legacy type-switch (backwards-compatible).
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
        return <ActionPlanStep step={currentStep} value={stepValue} onChange={handleResponseChange} allResponses={stepResponses} activity={activity} />;

      case 'likert-reflection':
        return <LikertReflectionStep step={currentStep} allResponses={stepResponses} />;

      case 'assessment-results': {
        // Hydrate `total` from the source step's items if not explicitly set,
        // so the "out of N" copy renders correctly.
        const sourceStep = activity?.steps?.find(s => s.stepId === currentStep.sourceStepId);
        const total = currentStep.total ?? sourceStep?.items?.length ?? null;
        const hydrated = total != null ? { ...currentStep, total } : currentStep;
        return <AssessmentResultsStep step={hydrated} allResponses={stepResponses} />;
      }

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

  // Pull pre/post mood widgets out of the current step's components so they
  // render OUTSIDE the content panel (R5).
  const { pre: preMoodEntry, post: postMoodEntry, body: bodyStep } = splitMoodComponents(currentStep);
  // Detect inline nav sentinel — if present, hide the fixed bottom nav row
  // because nav buttons render inline within the step content.
  const hasInlineNav = Array.isArray(currentStep?.components)
    && currentStep.components.some(c => c?.ref === 'InlineNavButtons');
  // Terminal "saved" step — Previous/Next are hidden; user closes the modal
  // to exit. Activity:complete already fired on the transition INTO this step.
  const isTerminalStep = currentStep?.terminal === true;
  const renderLiftedComponent = (entry) => {
    if (!entry) return null;
    const Component = PrimitivesByRef[entry.ref];
    if (!Component) return null;
    const props = entry.props || {};
    const childValue = entry.bind
      ? (stepResponses[currentStep.stepId] || {})[entry.bind]
      : undefined;
    const setter = (next) => {
      if (!entry.bind) return;
      // Read latest via ref so we don't clobber a parallel body update.
      const prev = stepResponsesRef.current[currentStep.stepId] || {};
      handleResponseChange({ ...prev, [entry.bind]: next });
    };
    return (
      <Component
        {...props}
        value={childValue ?? props.value}
        currentValue={childValue ?? props.currentValue ?? props.value}
        onChange={setter}
        onValueChanged={setter}
        onCommit={setter}
        onValueCommitted={setter}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <StitchedProgressBar progress={(currentStepIndex + 1) / totalSteps} steps={totalSteps} />
      <Text style={styles.stepCounter}>
        Step {currentStepIndex + 1} of {totalSteps}
      </Text>

      {/* Step content */}
      <Scroll key={currentStepIndex} style={styles.stepContent}>
        {preMoodEntry ? (
          <View style={styles.moodBlock}>
            {renderLiftedComponent(preMoodEntry)}
          </View>
        ) : null}

        {postMoodEntry ? (
          <View style={styles.moodBlock}>
            {renderLiftedComponent(postMoodEntry)}
          </View>
        ) : null}

        <MinkyPanel
          borderRadius={8}
          padding={16}
          paddingTop={16}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          {currentStep?.prompt ? (
            <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor('#2D2C2B') }]}>
              {Array.isArray(currentStep.prompt)
                ? currentStep.prompt[Math.floor(Math.random() * currentStep.prompt.length)]
                : currentStep.prompt}
            </Text>
          ) : null}

          <View style={styles.responseArea}>
            {renderStepContent(bodyStep)}
          </View>
        </MinkyPanel>
      </Scroll>

      {/* Navigation buttons (suppressed when the step renders inline nav itself) */}
      {!hasInlineNav && !isTerminalStep ? (
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
      ) : null}
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
  moodBlock: {
    marginVertical: 8,
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
