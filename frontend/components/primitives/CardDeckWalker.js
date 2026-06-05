import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder, Animated } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

// Horizontal-drag threshold (px) past which a swipe-classify fires.
const SWIPE_THRESHOLD = 80;

/**
 * CardDeckWalker — walks the user one-at-a-time through chips picked in a
 * prior step, presenting each as a "card" with N action buttons (one per
 * destination bucket). Tapping a button assigns that chip to the bucket and
 * advances to the next card.
 *
 * Built for activity-categorization-sort step 3 (up vs down) and any flow
 * where the user needs to classify each picked item without seeing all of
 * them at once. The card framing reduces decision fatigue when there are
 * many chips.
 *
 * Authoring shape:
 *   {
 *     "ref": "CardDeckWalker",
 *     "bind": "classifications",     // object: { [chipId]: bucketId }
 *     "props": {
 *       "sourceStepId": "pick-step",
 *       "sourceBind": "picked",      // array of chip IDs
 *       "buckets": [
 *         { "id": "up", "label": "Lifts me up" },
 *         { "id": "down", "label": "Weighs me down" }
 *       ],
 *       "skipLabel": "Not sure yet",
 *       "completionMessage": "All sorted — you can go back to any card with the dots above."
 *     }
 *   }
 *
 * Value shape: `{ [chipId]: bucketId }`. Chips not yet classified are absent.
 *
 * Renderer-injected props consumed (see activities/v2/_SCHEMA.md):
 *   - `selectedChipIds`: array of chip IDs to walk; injected by ComponentStep
 *     when the entry's `props.sourceStepId` / `props.sourceBind` resolve to
 *     an array.
 *
 * Downstream carryFrom: use `carryFrom.filterByValue: "<bucketId>"` to pull
 * only the chips classified into one bucket (returns an array of chip IDs).
 */
const CardDeckWalker = observer(({
  selectedChipIds,
  presetChips = [],
  buckets = [],
  skipLabel = 'Skip for now',
  completionMessage = 'All sorted.',
  // Gesture mode: 'tap' (default — bucket buttons only) or 'hold-and-swipe'
  // (drag the card left/right past SWIPE_THRESHOLD to classify into the
  // matching bucket; buckets stay available as buttons too for accessibility).
  // Hold-and-swipe assumes exactly 2 buckets: index 0 = left, index 1 = right.
  gestureMode = 'tap',
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
}) => {
  const swipeEnabled = gestureMode === 'hold-and-swipe' && buckets.length === 2;
  const translateX = useRef(new Animated.Value(0)).current;
  const [dragX, setDragX] = useState(0); // drives the side-hint label opacity
  const classifications = currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)
    ? currentValue : {};

  const chipIds = Array.isArray(selectedChipIds) ? selectedChipIds : [];
  // Map chipId → label (prefer presetChips, fall back to ID)
  const labelMap = new Map(presetChips.map(c => [c.id || c.label, c.label || c.id]));
  const labelFor = (id) => labelMap.get(id) || id;

  // First unclassified card; if all are classified, show completion state.
  const firstUnclassifiedIdx = chipIds.findIndex(id => !(id in classifications));
  const [idx, setIdx] = useState(firstUnclassifiedIdx === -1 ? Math.max(chipIds.length - 1, 0) : firstUnclassifiedIdx);

  const commit = (next) => {
    if (!interactable || disabled) return;
    onValueChanged && onValueChanged(next);
    onValueCommitted && onValueCommitted(next);
  };

  const setBucket = (chipId, bucketId) => {
    const next = { ...classifications, [chipId]: bucketId };
    commit(next);
    // Auto-advance to the next unclassified card
    let nextIdx = idx + 1;
    while (nextIdx < chipIds.length && chipIds[nextIdx] in next) nextIdx++;
    if (nextIdx < chipIds.length) setIdx(nextIdx);
    else setIdx(chipIds.length); // landed past the end = completion view
  };

  const skipForNow = () => {
    let nextIdx = idx + 1;
    while (nextIdx < chipIds.length && chipIds[nextIdx] in classifications) nextIdx++;
    setIdx(nextIdx < chipIds.length ? nextIdx : chipIds.length);
  };

  const goTo = (i) => setIdx(Math.max(0, Math.min(chipIds.length, i)));

  // Hold-and-swipe gesture handler. Lives at top level (vs. inside the card
  // render branch) so React doesn't recreate the responder on every render.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => { translateX.setValue(0); setDragX(0); },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
        setDragX(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        const chipId = chipIds[idx];
        if (Math.abs(g.dx) > SWIPE_THRESHOLD && chipId && buckets.length === 2) {
          // Snap off-screen in the swipe direction, then assign and reset.
          Animated.timing(translateX, {
            toValue: g.dx > 0 ? 320 : -320,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setBucket(chipId, buckets[g.dx > 0 ? 1 : 0].id);
            translateX.setValue(0);
            setDragX(0);
          });
        } else {
          // Spring back to center.
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 8 }).start();
          setDragX(0);
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
        setDragX(0);
      },
    })
  ).current;

  if (chipIds.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          Pick a few in the previous step and they'll come up here, one at a time.
        </Text>
      </View>
    );
  }

  const onCompletionView = idx >= chipIds.length;
  const classifiedCount = chipIds.filter(id => id in classifications).length;

  return (
    <View style={styles.wrapper}>
      {/* Progress dots — tappable to revisit any card */}
      <View style={styles.dotsRow}>
        {chipIds.map((id, i) => {
          const isCurrent = i === idx && !onCompletionView;
          const isClassified = id in classifications;
          return (
            <Pressable key={i} onPress={() => goTo(i)} style={styles.dotHit}>
              <View
                style={[
                  styles.dot,
                  isCurrent && styles.dotCurrent,
                  isClassified && styles.dotClassified,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.progressLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
        {classifiedCount} of {chipIds.length} sorted
      </Text>

      {onCompletionView ? (
        <MinkyPanel
          borderRadius={12}
          padding={20}
          paddingTop={20}
          overlayColor="rgba(160, 200, 140, 0.45)"
        >
          <Text style={[styles.completionText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {completionMessage}
          </Text>
        </MinkyPanel>
      ) : (
        <>
          {/* The card — wrapped in Animated.View when swipe-enabled, plain
              MinkyPanel otherwise. Side hints (the two bucket labels in a
              soft tint on each side) fade in based on drag direction so the
              user can see what their swipe will commit to. */}
          {swipeEnabled ? (
            <View style={styles.cardStage}>
              {/* Side hints */}
              <Text
                style={[
                  styles.sideHint,
                  styles.sideHintLeft,
                  { fontSize: FontSettingsStore.getScaledFontSize(11), opacity: Math.max(0, Math.min(1, -dragX / SWIPE_THRESHOLD)) },
                ]}
                numberOfLines={1}
              >
                ◀ {buckets[0]?.label}
              </Text>
              <Text
                style={[
                  styles.sideHint,
                  styles.sideHintRight,
                  { fontSize: FontSettingsStore.getScaledFontSize(11), opacity: Math.max(0, Math.min(1, dragX / SWIPE_THRESHOLD)) },
                ]}
                numberOfLines={1}
              >
                {buckets[1]?.label} ▶
              </Text>
              <Animated.View
                {...panResponder.panHandlers}
                style={[styles.cardAnimWrap, { transform: [{ translateX }] }]}
              >
                <MinkyPanel
                  borderRadius={12}
                  padding={20}
                  paddingTop={20}
                  overlayColor="rgba(135, 180, 210, 0.55)"
                >
                  <Text style={[styles.cardLabel, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
                    {labelFor(chipIds[idx])}
                  </Text>
                </MinkyPanel>
              </Animated.View>
            </View>
          ) : (
            <MinkyPanel
              borderRadius={12}
              padding={20}
              paddingTop={20}
              overlayColor="rgba(135, 180, 210, 0.55)"
            >
              <Text style={[styles.cardLabel, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
                {labelFor(chipIds[idx])}
              </Text>
            </MinkyPanel>
          )}

          {/* Bucket actions */}
          <View style={styles.bucketsRow}>
            {buckets.map((bucket) => {
              const isCurrent = classifications[chipIds[idx]] === bucket.id;
              return (
                <Pressable
                  key={bucket.id}
                  onPress={() => setBucket(chipIds[idx], bucket.id)}
                  disabled={disabled || !interactable}
                  style={styles.bucketCell}
                >
                  <MinkyPanel
                    borderRadius={10}
                    padding={12}
                    paddingTop={12}
                    overlayColor={isCurrent ? 'rgba(160, 200, 140, 0.6)' : 'rgba(112, 68, 199, 0.25)'}
                    borderColor={isCurrent ? 'rgba(45, 44, 43, 0.85)' : undefined}
                  >
                    <Text
                      style={[styles.bucketLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
                      numberOfLines={2}
                    >
                      {bucket.label}
                    </Text>
                  </MinkyPanel>
                </Pressable>
              );
            })}
          </View>

          {/* Skip */}
          {skipLabel ? (
            <Pressable onPress={skipForNow} style={styles.skipHit}>
              <Text style={[styles.skipText, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                {skipLabel}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 },
  dotHit: { padding: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(92, 90, 88, 0.25)',
  },
  dotCurrent: {
    backgroundColor: 'rgba(112, 68, 199, 0.7)',
    transform: [{ scale: 1.25 }],
  },
  dotClassified: {
    backgroundColor: 'rgba(160, 200, 140, 0.7)',
  },
  progressLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
  },
  cardStage: {
    position: 'relative',
    paddingHorizontal: 8,
  },
  cardAnimWrap: {
    // PanResponder reads transforms here; the MinkyPanel sits inside.
  },
  sideHint: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#5C5A58',
    textShadowColor: 'rgba(255, 255, 255, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sideHintLeft: { left: 0 },
  sideHintRight: { right: 0 },
  cardLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bucketsRow: { flexDirection: 'row', gap: 8 },
  bucketCell: { flexBasis: 0, flexGrow: 1 },
  bucketLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  skipHit: { alignSelf: 'center', paddingVertical: 4 },
  skipText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    fontStyle: 'italic',
  },
  completionText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textAlign: 'center',
  },
  empty: { padding: 12 },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default CardDeckWalker;
