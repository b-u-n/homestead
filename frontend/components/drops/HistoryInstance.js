import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import Scroll from '../Scroll';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

const renderValue = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');
  }
  return String(value);
};

/**
 * HistoryInstance — read-only detail view of one completed activity instance.
 * Loads the HistoryEntry by entryId, renders mood-delta block + each step's
 * saved values as labeled prose blocks.
 */
const HistoryInstance = observer(({ input, accumulatedData }) => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const landingData = accumulatedData?.['history:landing'];
  const entryId = landingData?.entryId || input?.entryId;

  useEffect(() => {
    const load = async () => {
      if (!WebSocketService.socket || !entryId) {
        setLoading(false);
        return;
      }
      try {
        const data = await WebSocketService.emit('history:get', {
          sessionId: SessionStore.sessionId,
          entryId
        });
        if (data) setEntry(data);
      } catch (err) {
        console.error('Error loading entry:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entryId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.loadingText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
            Loading…
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.notFoundText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
            Couldn't load that entry.
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  const summary = Array.isArray(entry.summaryFields) ? entry.summaryFields : [];
  const preMoodEntry = summary.find(f => f.label === 'Mood before');
  const moodAfterEntry = summary.find(f => f.label === 'Mood after');
  const reflectionEntry = summary.find(f => f.label === 'Reflection');

  // Pull pre/post values as numbers when possible for the delta display.
  const parseFirstNumber = (s) => {
    if (typeof s !== 'string') return null;
    const m = s.match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : null;
  };
  const preMood = parseFirstNumber(preMoodEntry?.value);
  // moodAfterEntry.value is "5/10 → 7/10" or "7/10". Take the LAST number.
  const postMatches = moodAfterEntry?.value && [...moodAfterEntry.value.matchAll(/(\d+(?:\.\d+)?)/g)];
  const postMood = postMatches && postMatches.length ? Number(postMatches[postMatches.length - 1][1]) : null;

  const stepData = entry.artifactSnapshot && typeof entry.artifactSnapshot === 'object' ? entry.artifactSnapshot : {};
  const stepEntries = Object.entries(stepData);

  return (
    <View style={styles.container}>
      <Scroll style={styles.scroll}>
        <View style={styles.scrollContent}>
          <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
              {entry.titleOrTheme || entry.sourceActivityId}
            </Text>
            <Text style={[styles.date, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
              Saved {formatDate(entry.savedAt)}
            </Text>
          </MinkyPanel>

          {(preMood != null || postMood != null) && (
            <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(100, 130, 195, 0.25)">
              <Text style={[styles.sectionHeader, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                MOOD
              </Text>
              {preMood != null && postMood != null ? (
                <Text style={[styles.moodLine, { fontSize: FontSettingsStore.getScaledFontSize(16) }]}>
                  Before {preMood}/10 → After {postMood}/10
                </Text>
              ) : (
                <Text style={[styles.moodLine, { fontSize: FontSettingsStore.getScaledFontSize(16) }]}>
                  {preMood != null ? `Before ${preMood}/10` : `After ${postMood}/10`}
                </Text>
              )}
            </MinkyPanel>
          )}

          {reflectionEntry && (
            <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
              <Text style={[styles.sectionHeader, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                REFLECTION
              </Text>
              <Text style={[styles.bodyText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                {reflectionEntry.value}
              </Text>
            </MinkyPanel>
          )}

          {stepEntries.length > 0 && (
            <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
              <Text style={[styles.sectionHeader, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                YOUR ANSWERS
              </Text>
              {stepEntries.map(([stepId, value]) => {
                const rendered = renderValue(value);
                if (!rendered) return null;
                return (
                  <View key={stepId} style={styles.answerRow}>
                    <Text style={[styles.answerLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                      {stepId}
                    </Text>
                    <Text style={[styles.answerValue, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                      {rendered}
                    </Text>
                  </View>
                );
              })}
            </MinkyPanel>
          )}
        </View>
      </Scroll>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  scroll: { flex: 1 },
  scrollContent: { gap: 12 },
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  date: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionHeader: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    letterSpacing: 0.8,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  moodLine: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bodyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    lineHeight: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  answerRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
    gap: 4,
  },
  answerLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  answerValue: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    lineHeight: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
  },
  notFoundText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
  },
});

export default HistoryInstance;
