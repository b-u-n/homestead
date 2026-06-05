import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { observer } from 'mobx-react-lite';

/**
 * decorative-illustration-or-backdrop — non-interactive visual asset.
 *
 * Renders a single emoji-glyph or asset (caller can override via children) at varied scales
 * and animations. Distinct from charts/canvases — this is purely ambient/decorative.
 */
const METAPHOR_GLYPHS = {
  'nature-landscape': '🏔',
  'lotus-zen': '🪷',
  'object-totem': '🏺',
  'creature-silhouette': '🐻',
  'abstract-geometric': '◯',
  'seasonal-weather': '❄',
  'letter-paper': '✉',
};

const DecorativeIllustrationOrBackdrop = observer(({
  assetRole = 'central-anchor-icon',
  metaphorFamily = 'lotus-zen',
  animation = 'static',
  loopConfig = { duration: 4000 },
  glyph: glyphProp,
  size = 64,
  children,
  onAssetRendered,
  onAnimationCompleted,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const glyph = glyphProp || METAPHOR_GLYPHS[metaphorFamily] || '◯';

  useEffect(() => {
    onAssetRendered && onAssetRendered({ assetRole, animation });
    if (animation === 'static') return;

    let loop;
    const dur = loopConfig?.duration || 4000;

    if (animation === 'pulse' || animation === 'flash') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    } else if (animation === 'drift') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    } else if (animation === 'cycle' || animation === 'morph') {
      loop = Animated.loop(
        Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })
      );
    }

    loop?.start();
    return () => loop?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation]);

  const animStyle = (() => {
    if (animation === 'pulse' || animation === 'flash') {
      return { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }) }] };
    }
    if (animation === 'drift') {
      return { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) }] };
    }
    if (animation === 'cycle') {
      return { transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] };
    }
    return {};
  })();

  if (assetRole === 'full-screen-backdrop') {
    return (
      <View style={[styles.backdrop, { backgroundColor: 'rgba(112, 68, 199, 0.08)' }]}>
        <Animated.View style={[styles.center, animStyle]}>
          <Text style={{ fontSize: size * 1.5, opacity: 0.35 }}>{children || glyph}</Text>
        </Animated.View>
      </View>
    );
  }

  if (assetRole === 'per-row-glyph') {
    return (
      <Animated.View style={[styles.inlineGlyph, animStyle]}>
        <Text style={{ fontSize: size * 0.4 }}>{children || glyph}</Text>
      </Animated.View>
    );
  }

  // Default: central-anchor-icon, ambient-animation-layer, morphing-figure-overlay
  return (
    <View style={styles.iconWrap}>
      <Animated.View style={[styles.center, animStyle]}>
        <Text style={{ fontSize: size }}>{children || glyph}</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    width: '100%',
    minHeight: 120,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
  inlineGlyph: { width: 24, alignItems: 'center', justifyContent: 'center' },
});

export default DecorativeIllustrationOrBackdrop;
