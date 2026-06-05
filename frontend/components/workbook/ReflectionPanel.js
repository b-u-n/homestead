import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import ScrollBarView from '../ScrollBarView';

/**
 * LikertReflectionStep
 * Generates personalized reflection text based on a previous likert step's responses.
 * Each reflection can be a string or an array of strings (picks one randomly).
 *
 * Props from step definition:
 *   step.sourceStepId: 'assessment'
 *   step.items: same items array as the likert step
 *   step.reflections: {
 *     [itemId]: {
 *       1: ['variation 1', 'variation 2', ...] or 'single string',
 *       2: [...],
 *       3: [...]
 *     }
 *   }
 *
 * allResponses: full stepResponses object from WorkbookActivity
 */
const LikertReflectionStep = observer(({ step, allResponses, onValueChanged, value }) => {
  const items = step.items || [];
  const reflections = step.reflections || {};
  const sourceStepValue = allResponses?.[step.sourceStepId] || {};

  // Three ways to derive the reflection-lookup key from a source value, in
  // order of which fires first (only one applies per panel):
  //
  // 1. Presence-of-label (e.g. binary-screener) — when `sourceBind` points at
  //    an array of selected labels, an item is "scored 1" if its id appears in
  //    that array. `reflections[itemId][1]` is the variation set.
  //
  // 2. scoreBands (e.g. readiness-to-change) — when the source value is a
  //    numeric slider (0–100) and the activity wants the variation keyed by
  //    range, `step.scoreBands` declares the bands and the matching `key`
  //    becomes the lookup. `reflections[itemId][bandKey]` is the variation set.
  //
  // 3. scaleFactor (e.g. PHQ-9 0–5 → 0–3) — when source and reflection scales
  //    differ in granularity, `sourceScaleMax` / `reflectionScaleMax` map the
  //    raw integer to the coarser key via rounding.
  //
  // Default (no extra config): the raw integer score is the lookup key.

  const sourceBindValue = step.sourceBind
    ? sourceStepValue?.[step.sourceBind]
    : sourceStepValue;
  const isPresenceMode = step.sourceBind && Array.isArray(sourceBindValue);
  const scoreBands = Array.isArray(step.scoreBands) ? step.scoreBands : null;
  const sourceScaleMax = step.sourceScaleMax;
  const reflectionScaleMax = step.reflectionScaleMax;
  const scaleFactor = (sourceScaleMax && reflectionScaleMax && sourceScaleMax > reflectionScaleMax)
    ? (reflectionScaleMax / sourceScaleMax)
    : 1;

  const keyForScore = (rawScore) => {
    if (scoreBands) {
      // Find the first matching band (inclusive ranges).
      const band = scoreBands.find(b =>
        typeof rawScore === 'number'
        && rawScore >= (b.min ?? -Infinity)
        && rawScore <= (b.max ?? Infinity)
      );
      return band ? band.key : null;
    }
    if (typeof rawScore === 'number' && scaleFactor !== 1) {
      // Round (not floor) so the middle of the source scale lands on the
      // middle of the reflection scale instead of biasing low.
      return Math.round(rawScore * scaleFactor);
    }
    return rawScore;
  };

  // Pick random variations once per render (stable via useMemo keyed on the
  // resolved source value, not the whole step blob).
  const sentences = useMemo(() => {
    const result = [];
    for (const item of items) {
      let entry;
      if (isPresenceMode) {
        // Score 1 if the item's id is present in the selected-labels array.
        if (sourceBindValue.includes(item.id)) {
          entry = reflections[item.id]?.[1];
        }
      } else {
        // Numeric / scaled / banded path. Source value comes from either the
        // explicit sourceBind or the per-item id in the step value (the
        // PHQ-9 / GAD-7 pattern).
        const rawScore = step.sourceBind ? sourceBindValue : sourceStepValue?.[item.id];
        const key = keyForScore(rawScore);
        // For PHQ-9/GAD-7-style activities, a raw score of 0 means "not at
        // all" — skip the item. For scoreBands mode, every band (including a
        // low band that starts at 0) is a meaningful reflection — always fire
        // when a band matches.
        const meaningful = scoreBands
          ? true
          : (typeof rawScore !== 'number' || rawScore > 0);
        if (key != null && meaningful) {
          entry = reflections[item.id]?.[key];
        }
      }
      if (entry) {
        if (Array.isArray(entry)) {
          result.push(entry[Math.floor(Math.random() * entry.length)]);
        } else {
          result.push(entry);
        }
      }
    }
    return result;
  }, [JSON.stringify(sourceBindValue), JSON.stringify(sourceStepValue)]);

  // Emit the generated reflection as a bound value so subsequent steps can
  // carry it forward via `carryFrom`. Stable via useMemo above — only fires
  // when source scores change. Don't overwrite a non-empty stored value
  // (preserves what was emitted on first render across re-renders).
  const generated = sentences.join(' ');
  useEffect(() => {
    if (onValueChanged && generated && generated !== value) {
      onValueChanged(generated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated]);

  // The score-total readout is meaningful only for the PHQ-9/GAD-7-style
  // numeric-per-item case. Skip for presence-mode and scoreBands-mode panels,
  // where summing labels or band-keys is nonsensical.
  const showScoreTotal = !isPresenceMode && !scoreBands && !step.sourceBind;
  const total = showScoreTotal
    ? Object.values(sourceStepValue).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
    : 0;
  const scoreReadout = step.scoreReadoutTemplate
    ? step.scoreReadoutTemplate.replace('{total}', String(total))
    : `Your anxiety level: ${total} / 21`;

  return (
    <ScrollBarView style={styles.container}>
      <View style={styles.content}>
        {sentences.length > 0 ? (
          <Text
            style={[
              styles.reflectionText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(15),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            {sentences.join(' ')}
          </Text>
        ) : (
          <Text
            style={[
              styles.reflectionText,
              {
                fontSize: FontSettingsStore.getScaledFontSize(15),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
          >
            You rated everything at zero — that's a really good sign. Even on days that feel fine, it takes something to pause and check in with yourself like this.
          </Text>
        )}

        {showScoreTotal ? (
          <Text
            style={[
              styles.scoreNote,
              {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#454342'),
              },
            ]}
          >
            {scoreReadout}
          </Text>
        ) : null}
      </View>
    </ScrollBarView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
  },
  reflectionText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 15,
    color: '#2D2C2B',
    lineHeight: 26,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scoreNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 13,
    color: '#454342',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default LikertReflectionStep;
