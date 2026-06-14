import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
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
import Modal from '../Modal';

// Humanize a bind name for a default label when the recap declaration omits
// one. `evidence_for` → "Evidence for".
function humanizeBindName(bind) {
  if (typeof bind !== 'string' || !bind) return '';
  const spaced = bind.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Platform-meta binds excluded from auto-recap. These are bookkeeping/mood
// fields that don't belong as therapeutic context in the popup.
const RECAP_AUTO_EXCLUDE = new Set(['pre_mood', 'post_mood', 'journal']);

// Pick the most-human label for a (step, bind) pair by walking the source
// step's component definitions. Falls back to the step title, then a
// humanized bind name.
function deriveRecapLabel(sourceStep, bind) {
  if (sourceStep && Array.isArray(sourceStep.components)) {
    const c = sourceStep.components.find((x) => x && x.bind === bind);
    if (c) {
      const p = c.props || {};
      const label = p.guidingQuestionText || p.promptText || p.labelCopy || p.label;
      if (typeof label === 'string' && label.trim()) return label.trim();
    }
  }
  if (sourceStep?.title) return sourceStep.title;
  return humanizeBindName(bind);
}

// Is a stepResponse value "non-empty" enough to warrant inclusion in the
// auto-recap? Treats nulls, empty strings, empty arrays, and objects whose
// every leaf is empty as "nothing yet."
function isNonEmptyStepValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some((v) => {
      if (v == null) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true; // numbers, booleans
    });
  }
  return true;
}

// Build the auto-recap popup contents by REPLAYING each prior step's original
// components in read-only form. This is the default popup behavior when a
// step doesn't declare its own `recap`. Replay preserves the original
// authoring context — section headers, per-bind labels, specialized
// renderings (slider scales, chip pills) — instead of flattening everything
// to "bind_name: value" lines.
//
// For each prior step that has non-empty pool data, emit:
//   [step-title label, ...original components rewritten as read-only carries, section-divider]
//
// Skip rules:
//   - `pre_mood`, `post_mood`, `journal` binds are platform meta — excluded.
//   - Components with `carryFrom` are skipped — they're recap themselves and
//     would recurse (the user already sees those binds via the steps where
//     they were originally captured).
//   - `InlineNavButtons` and non-bind buttons are skipped — no nav inside the popup.
//   - Empty steps (no captured data yet) are skipped.
function buildAutoRecapComponents(currentStepId, allSteps, stepResponses) {
  if (!Array.isArray(allSteps) || !stepResponses) return [];
  const out = [];
  for (const step of allSteps) {
    if (step.stepId === currentStepId) break;
    const value = stepResponses[step.stepId];
    if (!isNonEmptyStepValue(value)) continue;

    // Section header — uses the step's title (or humanized stepId).
    out.push({
      ref: 'StaticTextContentBlock',
      props: { blockRole: 'named-point-row', text: step.title || humanizeBindName(step.stepId) },
    });

    // Replay each component in read-only form. Bind-carrying components get
    // a synthetic carryFrom so the renderer pulls the saved value. Static
    // decoration (labels, prose, dividers) passes through as-is so the
    // popup looks like the original step.
    for (const c of step.components || []) {
      if (!c || typeof c !== 'object') continue;
      if (c.ref === 'InlineNavButtons') continue;
      // Skip recap-of-recap: don't render components that themselves carry
      // from elsewhere — we replay each step's originals, not its carries.
      if (c.carryFrom) continue;
      // Drop platform-meta binds and any input that has no carriable value.
      if (c.bind && RECAP_AUTO_EXCLUDE.has(c.bind)) continue;
      // Buttons / nav-style components without binds add no value; skip them.
      if (!c.bind && c.ref && (c.ref === 'ButtonPrimarySaveCta'
        || c.ref === 'ButtonSecondaryAction'
        || c.ref === 'ButtonAddNewItem'
        || c.ref === 'ButtonExportShareAction'
        || c.ref === 'PerPersonShareReceiptButtons'
        || c.ref === 'JournalStep'
        || c.ref === 'ReflectionFraming'
        || c.ref === 'ReflectionPanel'
        || c.ref === 'QuickMoodMicroWidget')) continue;

      if (c.bind) {
        // Read-only replay: carry the saved value back through the same
        // primitive. Strip own setters via interactable=false; the renderer
        // already pulls value/currentValue via carryFrom.
        out.push({
          ...c,
          interactable: false,
          carryFrom: { stepId: step.stepId, bind: c.bind },
        });
      } else {
        // Static block (label, prose, divider, decorative) — pass through to
        // preserve the original layout context. These have no bind so they
        // render identically inline and in the popup.
        out.push(c);
      }
    }

    out.push({
      ref: 'StaticTextContentBlock',
      props: { blockRole: 'section-divider' },
    });
  }
  return out;
}

// Expand an explicit `recap: [...]` declaration into a synthetic step. Each
// entry becomes a [label, carryFrom] pair. Used when the author wants a
// compact, tightly-controlled popup instead of the full replay.
function expandExplicitRecapToStep(bodyStep, entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const components = [];
  for (const entry of entries) {
    if (!entry || !entry.stepId) continue;
    const label = entry.label || humanizeBindName(entry.bind || entry.stepId);
    components.push({
      ref: 'StaticTextContentBlock',
      props: { blockRole: 'named-point-row', text: label },
    });
    components.push({
      interactable: false,
      carryFrom: { stepId: entry.stepId, ...(entry.bind ? { bind: entry.bind } : {}) },
      ...(entry.ref ? { ref: entry.ref } : {}),
      ...(entry.props ? { props: entry.props } : {}),
    });
  }
  return { ...bodyStep, components };
}

// Resolve a step's recap (popup) contents. Three modes:
//   1. `step.recap === 'none'` → no popup.
//   2. `step.recap` is an array → explicit declaration, compact popup.
//   3. Otherwise → REPLAY the full prior-step history into the popup.
function resolveRecapStep(bodyStep, currentStepId, allSteps, stepResponses) {
  if (!bodyStep) return null;
  if (bodyStep.recap === 'none') return null;
  if (Array.isArray(bodyStep.recap)) return expandExplicitRecapToStep(bodyStep, bodyStep.recap);
  const replay = buildAutoRecapComponents(currentStepId, allSteps, stepResponses);
  if (replay.length === 0) return null;
  return { ...bodyStep, components: replay };
}

// Split a step's components into a "recap" set (R5 carry-overs that belong in
// the hidden popup) and the inline body (everything else, in author order).
//
// Recap-eligible = text-block `carryFrom` only (ref omitted, or explicitly
// `StaticTextContentBlock`). The popup is a textual recap surface — it
// renders strings, bullet lists, and key:value walls. Specialized refs
// (`ChipListReadonly`, `NumericRatingSlider`, `ChipValueBadgeReadonly`, etc.)
// are author-chosen visual components and MUST render inline at the position
// the author wrote them — they never get swept into the recap popup.
//
// The walk continues past specialized carries — it does NOT stop on the first
// one. This lets an author interleave specialized + text carries at the top
// of a step: specialized carries stay inline at their position, text carries
// get plucked into the popup. The author's only contract is "put your
// text-block recap blocks before the first non-carry/non-label/non-divider
// content (prose, inputs, etc.)" — anything past that boundary stays inline
// even if it's a text-block carry.
function splitRecap(components) {
  if (!Array.isArray(components) || components.length === 0) return { recap: [], body: components || [] };
  const isLabel = (c) => c?.ref === 'StaticTextContentBlock' && c?.props?.blockRole === 'named-point-row';
  const isDivider = (c) => c?.ref === 'StaticTextContentBlock' && c?.props?.blockRole === 'section-divider';
  const isRecapCarry = (c) => !!c?.carryFrom && (!c.ref || c.ref === 'StaticTextContentBlock');
  const isSpecializedCarry = (c) => !!c?.carryFrom && c?.ref && c.ref !== 'StaticTextContentBlock';

  // Walk the prefix of "recap-related" entries — text carries, specialized
  // carries, labels paired with either, and dividers. Anything outside that
  // (prose, inputs, decorative blocks) ends the recap region.
  let i = 0;
  while (i < components.length) {
    const c = components[i];
    const next = components[i + 1];
    if (isRecapCarry(c) || isSpecializedCarry(c)) { i += 1; continue; }
    if (isLabel(c) && (isRecapCarry(next) || isSpecializedCarry(next))) { i += 2; continue; }
    if (isDivider(c)) { i += 1; continue; }
    break;
  }
  if (i === 0) return { recap: [], body: components };

  // Within the prefix [0, i), pluck the text-block carries (and their
  // immediately-preceding labels) into `recap`. Everything else in the
  // prefix — specialized carries, their labels, unpaired dividers — stays in
  // `body` at its original position. Components from [i, end) always stay
  // in `body` unchanged.
  const recap = [];
  const body = [];
  let j = 0;
  while (j < i) {
    const c = components[j];
    const next = components[j + 1];
    if (isLabel(c) && j + 1 < i && isRecapCarry(next)) {
      recap.push(c, next);
      j += 2; continue;
    }
    if (isRecapCarry(c)) { recap.push(c); j += 1; continue; }
    body.push(c); j += 1;
  }
  for (let k = i; k < components.length; k += 1) body.push(components[k]);

  return recap.some(isRecapCarry) ? { recap, body } : { recap: [], body: components };
}

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
  accumulatedData,
  registerBackHandler,
  registerHeaderContent
}) => {
  const [activity, setActivity] = useState(null);
  const [progress, setProgress] = useState(null);
  // viewIndex (held in `currentStepIndex` for historical naming) is the
  // step the user is CURRENTLY LOOKING AT. It walks freely with back/forward
  // and is NEVER persisted on its own. The persisted resume position is the
  // high-water mark below.
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // highWaterMark is the FURTHEST step the user has reached. Monotonic:
  // advances only when the user moves forward past it; never decreases.
  // This is the value persisted as `progress.currentStepIndex` on the
  // backend and what the resume picker lands the user on. Backward nav is
  // a view-only operation that does not touch this.
  const [highWaterMark, setHighWaterMark] = useState(0);
  const [stepResponses, setStepResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Live instance ID for this run. Derived from input/accumulated data when
  // resuming a specific instance; otherwise filled in by workbook:activity:start
  // which creates a new instance.
  const [instanceId, setInstanceId] = useState(null);
  // Recap popup — opened by the floating top-right "Recap" button on steps
  // whose components begin with R5 carry-over blocks. Closes on step change.
  const [recapOpen, setRecapOpen] = useState(false);
  useEffect(() => { setRecapOpen(false); }, [currentStepIndex]);
  // Workbook copy reads as long-form prose — flip the FontSettingsStore
  // workbook bump on while this activity is mounted so the text reads larger
  // than the rest of the app. Reference-counted in the store, so nested
  // mounts (or stacked modals) don't prematurely turn it off.
  useEffect(() => {
    FontSettingsStore.setWorkbookActive(true);
    return () => FontSettingsStore.setWorkbookActive(false);
  }, []);
  // Persistence concept (R4): every state change persists. Keep refs to the
  // latest values so the debounced saver always reads the freshest state, and
  // a refs-mirror of instanceId so we don't capture a stale closure during
  // the load → start → first-render race.
  const stepResponsesRef = useRef({});
  const currentStepIndexRef = useRef(0);
  const highWaterMarkRef = useRef(0);
  const instanceIdRef = useRef(null);
  const saveTimerRef = useRef(null);
  stepResponsesRef.current = stepResponses;
  currentStepIndexRef.current = currentStepIndex;
  highWaterMarkRef.current = highWaterMark;
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

          // Resume position is the high-water mark — the furthest step the
          // user has reached. View starts there too. Clamp to a valid range
          // in case the activity definition shrank between sessions (steps
          // removed/reordered); do NOT write the clamped value back — let
          // the user re-walk and let normal forward-nav fix the persisted
          // value (no write-on-read). Fall back to first-incomplete for
          // legacy progress rows that predate currentStepIndex.
          const steps = result.activity.steps || [];
          let initialIndex = 0;
          if (typeof result.progress.currentStepIndex === 'number'
              && result.progress.currentStepIndex >= 0) {
            initialIndex = Math.min(result.progress.currentStepIndex, Math.max(steps.length - 1, 0));
          } else {
            const completedSteps = result.progress.completedSteps || [];
            const firstIncomplete = steps.findIndex(s => !completedSteps.includes(s.stepId));
            if (firstIncomplete >= 0) initialIndex = firstIncomplete;
          }
          setCurrentStepIndex(initialIndex);
          setHighWaterMark(initialIndex);
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
  // slider drag) is written to the active instance via `workbook:state:save`.
  // Drafts persist; resume returns to the exact state.
  //
  // The `currentStepIndex` field on the backend is a high-water mark, not a
  // current-position pointer. It is included in the payload ONLY when the
  // user advances forward past it (see handleNext). All other writes —
  // debounced typing saves, unmount flushes — carry stepData only, never
  // the index. Backward navigation does not persist anything.
  const saveState = async ({ stepData, stepIdx }) => {
    const id = instanceIdRef.current;
    if (!id || !activityId || !WebSocketService.socket) return;
    const payload = {
      sessionId: context?.sessionId ?? SessionStore.sessionId,
      instanceId: id,
      activityId,
      stepData,
    };
    if (typeof stepIdx === 'number') {
      payload.currentStepIndex = stepIdx;
    }
    try {
      await WebSocketService.emit('workbook:state:save', payload);
    } catch (err) {
      // Non-fatal — auto-save retries on next change.
      console.warn('workbook:state:save failed:', err?.message || err);
    }
  };

  // Debounced typing save — DATA ONLY. Must never carry the step index, or
  // typing into a field on a re-walked earlier step would poison the
  // persisted resume position with the current (lower) view index.
  const scheduleStateSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState({ stepData: stepResponsesRef.current });
    }, 500);
  };

  // Flush any pending debounce when the activity unmounts (user closed the
  // modal mid-typing) so no edit is lost. DATA ONLY — same reasoning as the
  // debounced save: closing while re-walking must not write the view index
  // back to the backend.
  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      saveState({ stepData: stepResponsesRef.current });
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

    const newIndex = currentStepIndex + 1;
    setCurrentStepIndex(newIndex);

    // High-water mark advances ONLY when the user crosses into new territory.
    // Re-walking forward through previously visited steps (newIndex still
    // <= highWaterMark) is a view operation — no persistence, no re-firing
    // completion. The save payload below is the only place the index is
    // ever written to the backend during normal navigation.
    if (newIndex > highWaterMark) {
      setHighWaterMark(newIndex);
      saveState({ stepData: stepResponsesRef.current, stepIdx: newIndex });
    }

    scrollToTopAfterRender();
  };

  const handlePrevious = () => {
    if (isFirstStep) {
      // At step 0, behave exactly like the modal-chrome Back button: hand off
      // to FlowEngine's `onBack` (goBackAtDepth), which pops the flow's history
      // at this depth — returning the user to whatever delivered them into the
      // activity (the activities history / diary landing, the resume-picker,
      // the bookshelf landing, etc.) rather than routing via action:'back'.
      onBack();
    } else {
      setCurrentStepIndex(prev => prev - 1);
      scrollToTopAfterRender();
    }
  };

  // Make the modal-chrome Back button behave like the in-flow "Previous"
  // button WHILE there are still earlier steps to walk back through. The
  // chrome's default would pop the flow's history (e.g. back to the
  // resume-picker), which is wrong when a user has resumed an instance and
  // is mid-flow inside the activity.
  //
  // Rule (per the latest spec): at any step index > 0 the chrome Back
  // ALWAYS decrements currentStepIndex by 1. Only at index 0 do we hand
  // off to FlowEngine (return `false`) so it pops its own history at this
  // depth — that sends the user back to the resume-picker / diary landing
  // / etc. — whichever drop delivered them into the activity.
  //
  // We read `currentStepIndex` via the already-maintained
  // `currentStepIndexRef` (mirrored every render at line ~57). The handler
  // is registered exactly ONCE on mount (empty deps + a ref to the latest
  // `registerBackHandler` prop) so the registered closure is stable and
  // can't be unregistered mid-flow by parent re-renders that recreate the
  // wrapper prop. Without this, FlowEngine re-renders churn the registration
  // every time, and any back-press landing in the cleanup→re-setup window
  // would silently fall back to popping flow history. The in-flow "Back"
  // button (handlePrevious) mirrors this exactly — at step 0 it calls
  // `onBack()` (the same goBackAtDepth this handler hands off to).
  const registerBackHandlerRef = useRef(registerBackHandler);
  registerBackHandlerRef.current = registerBackHandler;
  useEffect(() => {
    const register = registerBackHandlerRef.current;
    if (typeof register !== 'function') return undefined;
    register(() => {
      // Read the LIVE step index — not a captured value — at call time.
      if ((currentStepIndexRef.current || 0) === 0) {
        // Hand off to FlowEngine — pop flow history at this depth.
        return false;
      }
      setCurrentStepIndex(prev => prev - 1);
      scrollToTopAfterRender();
      return true;
    });
    return () => {
      const r = registerBackHandlerRef.current;
      if (typeof r === 'function') r(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hoist the step progress bar up into the modal chrome (between the back and
  // close buttons), replacing the title. Desktop only — on mobile the modal
  // renders no navbar (see Modal.js), so there the bar stays in-body (rendered
  // below). The registration node is rebuilt on every step/size change; a
  // separate unmount-only effect clears it so it doesn't outlive the activity.
  const registerHeaderContentRef = useRef(registerHeaderContent);
  registerHeaderContentRef.current = registerHeaderContent;
  const onMobileChrome = uxStore.isMobile;
  const activityTitle = activity?.title;
  useEffect(() => {
    const reg = registerHeaderContentRef.current;
    if (typeof reg !== 'function') return;
    if (onMobileChrome || !totalSteps) { reg(null); return; }
    reg(
      <View style={styles.headerChrome}>
        {activityTitle ? (
          <Text style={styles.headerTitle} numberOfLines={1}>{activityTitle}</Text>
        ) : null}
        <View style={styles.headerBarWrap}>
          <StitchedProgressBar
            progress={(currentStepIndex + 1) / totalSteps}
            steps={totalSteps}
            segmentHeight={13}
          />
        </View>
      </View>
    );
  }, [currentStepIndex, totalSteps, onMobileChrome, activityTitle]);
  useEffect(() => () => {
    const reg = registerHeaderContentRef.current;
    if (typeof reg === 'function') reg(null);
  }, []);

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
          activity={activity}
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
  // Recap popup resolution. The popup is independent of the inline body:
  //   - `step.recap === 'none'` → no popup.
  //   - `step.recap: [...]` → explicit list of pool reads.
  //   - otherwise → auto-populate from the pool (every prior step's binds,
  //     minus pre_mood/post_mood/journal). Pool empty → no popup.
  // Inline body is independent: if the step explicitly opts in/out of recap
  // (declares `recap`), `components` renders as-authored. If it doesn't, we
  // also run `splitRecap` on `components` to strip any legacy text-block
  // carryFrom blocks the author put at the prefix — they're already in the
  // auto-recap, so leaving them inline too would double-render.
  const allActivitySteps = activity?.steps || activity?.content?.steps;
  const recapStep = resolveRecapStep(bodyStep, currentStep?.stepId, allActivitySteps, stepResponses);
  const declaredRecap = bodyStep && (Array.isArray(bodyStep.recap) || bodyStep.recap === 'none');
  let bodyWithoutRecap;
  if (declaredRecap) {
    bodyWithoutRecap = bodyStep;
  } else {
    const { body: nonRecapComponents } = splitRecap(bodyStep?.components || []);
    bodyWithoutRecap = { ...bodyStep, components: nonRecapComponents };
  }
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

  // Pull scaled-spacing values once per render so chrome gaps/padding follow
  // the WORKBOOK_FONT_BUMP just like text does. (StyleSheet.create freezes
  // values at module load, so spacing has to be applied inline here.)
  const gapMd = FontSettingsStore.getScaledSpacing(12);
  const gapSm = FontSettingsStore.getScaledSpacing(8);
  const padLg = FontSettingsStore.getScaledSpacing(16);
  const padMd = FontSettingsStore.getScaledSpacing(10);

  return (
    <View style={[styles.container, { gap: gapMd }]}>
      {/* Progress indicator — on desktop this is hoisted into the modal chrome
          (see the registerHeaderContent effect). On mobile the modal has no
          navbar, so it stays in-body here. */}
      {onMobileChrome ? (
        <>
          <StitchedProgressBar progress={(currentStepIndex + 1) / totalSteps} steps={totalSteps} />
          <Text style={styles.stepCounter}>
            Step {currentStepIndex + 1} of {totalSteps}
          </Text>
        </>
      ) : null}

      {/* Sticky recap trigger — sits above the scroll so it doesn't move
          with the content. Shown only on steps that carry prior answers. */}
      {recapStep ? (
        <Pressable onPress={() => setRecapOpen(true)} style={[styles.stickyRecap, { marginBottom: gapSm }]}>
          <MinkyPanel
            borderRadius={8}
            padding={padMd}
            paddingTop={padMd}
            overlayColor="rgba(135, 180, 210, 0.5)"
          >
            <Text style={styles.stickyRecapText}>Open to see what you've found so far.</Text>
          </MinkyPanel>
        </Pressable>
      ) : null}

      {/* Step content */}
      <Scroll key={currentStepIndex} style={styles.stepContent}>
        {preMoodEntry ? (
          <View style={[styles.moodBlock, { marginVertical: gapSm }]}>
            {renderLiftedComponent(preMoodEntry)}
          </View>
        ) : null}

        {isTerminalStep ? (
          // Terminal "saved" farewell — render the SummaryOutputCard directly,
          // with no content panel, so it sits flat on the modal background
          // instead of a card-in-a-card.
          <View style={styles.responseArea}>
            {renderStepContent(bodyStep)}
          </View>
        ) : (
          <MinkyPanel
            borderRadius={8}
            padding={padLg}
            paddingTop={padLg}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            {currentStep?.prompt ? (
              <Text style={[styles.prompt, { fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor('#2D2C2B'), marginBottom: padLg }]}>
                {Array.isArray(currentStep.prompt)
                  ? currentStep.prompt[Math.floor(Math.random() * currentStep.prompt.length)]
                  : currentStep.prompt}
              </Text>
            ) : null}

            <View style={styles.responseArea}>
              {renderStepContent(bodyWithoutRecap)}
            </View>
          </MinkyPanel>
        )}

        {/* post_mood lifts BELOW the body panel — the rating happens after
            the reflection/journal lands, not before it. */}
        {postMoodEntry ? (
          <View style={[styles.moodBlock, { marginVertical: gapSm }]}>
            {renderLiftedComponent(postMoodEntry)}
          </View>
        ) : null}

        {/* Inline nav — sits at the end of the step content: Back bottom-left,
            Next bottom-right, so the user reaches them after reading the step.
            (The modal chrome back button still works too.) Suppressed on
            terminal steps and on steps that render their own inline nav. */}
        {!hasInlineNav && !isTerminalStep ? (
          <View style={[styles.inlineNavRow, { paddingTop: gapMd }]}>
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
      </Scroll>

      {recapStep ? (
        <Modal
          visible={recapOpen}
          onClose={() => setRecapOpen(false)}
          title={activity?.title}
          titleSize={16}
          modalSize={{ width: '76%', height: '76%' }}
          zIndex={2500}
          playSound={false}
        >
          <MinkyPanel
            borderRadius={8}
            padding={16}
            paddingTop={16}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            <ComponentStep
              step={recapStep}
              value={stepResponses[currentStep.stepId]}
              onChange={handleResponseChange}
              allStepResponses={stepResponses}
              allSteps={activity?.steps || activity?.content?.steps}
              nav={null}
            />
          </MinkyPanel>
        </Modal>
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
  stickyRecap: {
    marginBottom: 8,
  },
  stickyRecapText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    fontSize: 14,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
  inlineNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Modal-chrome header block: activity title above a shorter, narrower
  // progress bar. Title and bar are both centered.
  headerChrome: {
    width: '100%',
    alignItems: 'center',
  },
  // Bar runs ~28% shorter than the available header width.
  headerBarWrap: {
    width: '72%',
  },
  headerTitle: {
    marginBottom: 4,
    fontFamily: 'SuperStitch',
    fontSize: 28,
    color: 'rgba(64, 63, 62, 0.82)',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
