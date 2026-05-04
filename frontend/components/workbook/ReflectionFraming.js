import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';

/**
 * ReflectionFraming — the warm "stay with what came up" header that precedes
 * the closing JournalStep on every save step (R2). Renders a paired title +
 * body, picked at mount from a rotating set of variations so the closing
 * voice doesn't go stale across sessions.
 *
 * Author can override by passing `variations: [{ title, body }]`. Otherwise
 * the 19 default variations bake in.
 */
const DEFAULT_VARIATIONS = [
  { title: 'Take a moment for yourself', body: 'Before you close this, pause for a second. Not to judge what you made, but to notice what came up for you while making it.' },
  { title: 'Give yourself a little space', body: 'Before you move on, give yourself a little space. What you made matters, but so does what you felt along the way.' },
  { title: 'Hold here a moment', body: "Before the next thing starts, stay where you are. Finishing matters, but so does what's still landing from the work you just did." },
  { title: 'Sit with what came up', body: 'Before you scroll on, sit with what came up. Not to figure it out, but to feel what the activity actually stirred.' },
  { title: 'Slow down for a beat', body: 'Before you move forward, slow down for a beat. Finishing matters, but so does noticing how the finish felt.' },
  { title: 'Catch up with yourself', body: 'Before you head back to the day, catch up with yourself. Not to perform calm, but to meet yourself where the activity left you.' },
  { title: 'Stay here a second longer', body: "Before you decide what's next, stay here. What you did matters, but so does what came up in the doing of it." },
  { title: 'Pay attention before it fades', body: 'Before this passes, pay attention to what the activity surfaced. Not to capture it perfectly, but to acknowledge it before it slips away.' },
  { title: 'The moment between things', body: 'Before you switch gears, pause briefly. Moving on matters, but so does the moment between finishing something and starting the next.' },
  { title: 'Check in before clicking out', body: 'Before you close the tab, check in. Not to grade what you made, but to notice where you actually are after making it.' },
  { title: 'A breath after the work', body: 'Before you keep going, give it a beat. The work matters, but so does the breath that comes after putting it down.' },
  { title: 'Register that it happened', body: 'Before the moment passes, look at what you just did. Not to hold on too tight, but to register that something real happened here.' },
  { title: 'Let it count', body: 'Before you reach for the next thing, soften. Showing up to do this matters, but so does letting yourself feel that you did.' },
  { title: 'Just notice', body: "Before you label what you made good or bad, just notice. Not to evaluate the work, but to observe what's actually present in you now." },
  { title: 'Leave some room', body: 'Before you tidy this up, leave room. A clean conclusion matters, but so does what the activity left a little unresolved.' },
  { title: 'Hold it gently', body: 'Before you set this aside, hold it gently. Not to overthink what came up, but to honor that something happened in you while you were doing it.' },
  { title: 'Linger a second', body: 'Before the day pulls you back, linger. Returning matters, but so does the version of you the activity left behind.' },
  { title: 'Notice the shift', body: 'Before you go, notice the shift. Where you started matters, but so does where the activity has brought you now.' },
];

const ReflectionFraming = observer(({ variations }) => {
  const pool = Array.isArray(variations) && variations.length > 0 ? variations : DEFAULT_VARIATIONS;
  // Lock the choice for this mount so it doesn't reshuffle while the user is reading.
  const choice = useMemo(() => pool[Math.floor(Math.random() * pool.length)], [pool]);

  return (
    <View style={styles.block}>
      <Text style={[
        styles.title,
        { fontSize: FontSettingsStore.getScaledFontSize(20), color: FontSettingsStore.getFontColor('#2D2C2B') },
      ]}>
        {choice.title}
      </Text>
      <Text style={[
        styles.body,
        { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#454342') },
      ]}>
        {choice.body}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  block: {
    paddingVertical: 4,
    gap: 6,
  },
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  body: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ReflectionFraming;
