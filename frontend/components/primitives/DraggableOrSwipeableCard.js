import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * draggable-or-swipeable-card — drag/swipe gesture-driven card or chip.
 *
 * Uses PanResponder (built-in) — no extra deps. The full drag-between-containers and continuous-
 * plane behaviors require a parent that listens for drop targets; the card emits drag-start/end
 * with absolute screen coords so the caller can hit-test against zones.
 */
const SWIPE_THRESHOLD = 80;

const DraggableOrSwipeableCard = observer(({
  itemId,
  primaryText,
  label,
  primitiveKind = 'item-card',
  gesturePrimary = 'swipe-left-right-binary',
  isTopCard = true,
  leftBucketLabel = 'No',
  rightBucketLabel = 'Yes',
  payloadKind = 'strategy-text',
  hasAccessibilityButtonFallback = true,
  onDragStart,
  onDragEnd,
  onDropTarget,
  onPositionChanged,
  onSwipeLeft,
  onSwipeRight,
  onSwipeNext,
  onSwipePrev,
  onTapToOpenEdit,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
  };

  const flyOff = (direction) => {
    Animated.timing(pan, {
      toValue: { x: direction > 0 ? 600 : -600, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTopCard,
      onMoveShouldSetPanResponder: (_, g) => isTopCard && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onPanResponderGrant: (e) => {
        setDragging(true);
        onDragStart && onDragStart({ itemId, position: { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } });
      },
      onPanResponderMove: (e, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
        onPositionChanged && onPositionChanged({ itemId, dx: g.dx, dy: g.dy });
      },
      onPanResponderRelease: (e, g) => {
        setDragging(false);
        const endPos = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        onDragEnd && onDragEnd({ itemId, position: endPos, dx: g.dx, dy: g.dy });

        if (gesturePrimary === 'swipe-left-right-binary') {
          if (g.dx > SWIPE_THRESHOLD) {
            onSwipeRight && onSwipeRight(itemId);
            flyOff(1);
            return;
          }
          if (g.dx < -SWIPE_THRESHOLD) {
            onSwipeLeft && onSwipeLeft(itemId);
            flyOff(-1);
            return;
          }
        } else if (gesturePrimary === 'swipe-next-prev-browse' || gesturePrimary === 'swipe-advance-step') {
          if (g.dx < -SWIPE_THRESHOLD) {
            onSwipeNext && onSwipeNext(itemId);
            flyOff(-1);
            return;
          }
          if (g.dx > SWIPE_THRESHOLD) {
            onSwipePrev && onSwipePrev(itemId);
            flyOff(1);
            return;
          }
        } else if (gesturePrimary === 'drag-onto-drop-target' || gesturePrimary === 'drag-between-containers') {
          onDropTarget && onDropTarget({ itemId, position: endPos, dx: g.dx, dy: g.dy });
        }

        reset();
      },
    })
  ).current;

  const rotation = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const isChip = primitiveKind === 'label-only-chip';

  const cardBody = (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        isChip ? styles.chipWrap : styles.cardWrap,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: rotation }],
          opacity: dragging ? 0.85 : 1,
        },
      ]}
    >
      <Pressable onPress={() => onTapToOpenEdit && onTapToOpenEdit(itemId)}>
        {isChip ? (
          <MinkyPanel borderRadius={14} padding={6} paddingTop={6} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.chipLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              {label || primaryText}
            </Text>
          </MinkyPanel>
        ) : (
          <MinkyPanel borderRadius={12} padding={14} paddingTop={14} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.cardText, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
              {primaryText}
            </Text>
            {label ? (
              <Text style={[styles.cardSub, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                {label}
              </Text>
            ) : null}
          </MinkyPanel>
        )}
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={isChip ? styles.chipOuter : styles.cardOuter}>
      {cardBody}
      {hasAccessibilityButtonFallback && (gesturePrimary === 'swipe-left-right-binary' || gesturePrimary === 'swipe-next-prev-browse') ? (
        <View style={styles.fallbackRow}>
          <Pressable onPress={() => { onSwipeLeft ? onSwipeLeft(itemId) : onSwipePrev && onSwipePrev(itemId); flyOff(-1); }}>
            <Text style={[styles.fallbackBtn, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              ← {leftBucketLabel}
            </Text>
          </Pressable>
          <Pressable onPress={() => { onSwipeRight ? onSwipeRight(itemId) : onSwipeNext && onSwipeNext(itemId); flyOff(1); }}>
            <Text style={[styles.fallbackBtn, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              {rightBucketLabel} →
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  cardOuter: { gap: 6 },
  cardWrap: { },
  chipOuter: { alignSelf: 'flex-start' },
  chipWrap: { },
  cardText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardSub: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chipLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fallbackRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  fallbackBtn: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    paddingVertical: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default DraggableOrSwipeableCard;
