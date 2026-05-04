import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import HistoryStore from '../../stores/HistoryStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

const formatRelative = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
};

/**
 * HistoryLanding (Diary) — landing drop for the history flow.
 * Two sections: in-progress instances (resume) + completed sessions.
 */
const HistoryLanding = observer(({ onComplete }) => {
  const [inProgress, setInProgress] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!WebSocketService.socket) {
        setLoading(false);
        return;
      }
      try {
        const [progressList] = await Promise.all([
          WebSocketService.emit('workbook:progress:in-progress', {
            sessionId: SessionStore.sessionId
          }),
          HistoryStore.loadFromServer()
        ]);
        setInProgress(Array.isArray(progressList) ? progressList : []);
        setCompleted(HistoryStore.entries.filter(e => e.artifactDomain === 'workbook-activity'));
      } catch (err) {
        console.error('Diary load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleResume = (inst) => {
    onComplete({
      action: 'resumeActivity',
      activityId: inst.activityId,
      activityTitle: inst.activityTitle,
      instanceId: inst.instanceId
    });
  };

  const handleOpenInstance = (entry) => {
    onComplete({ action: 'openInstance', entryId: entry._id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.loadingText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
            Opening your diary…
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  const isEmpty = inProgress.length === 0 && completed.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.emptyTitle, { fontSize: FontSettingsStore.getScaledFontSize(16) }]}>
            Nothing here yet
          </Text>
          <Text style={[styles.emptyCopy, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            Your first completed activity will land in your diary. Anything you start and step away from will show up here too — pick up wherever you left off.
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.list}>
        <View style={styles.listContent}>
          {inProgress.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                IN PROGRESS
              </Text>
              {inProgress.map((inst) => {
                const stepLabel = inst.totalSteps
                  ? `Step ${Math.min(inst.stepsCompleted + 1, inst.totalSteps)} of ${inst.totalSteps}`
                  : `${inst.stepsCompleted} step${inst.stepsCompleted === 1 ? '' : 's'} done`;
                return (
                  <Pressable key={inst.instanceId} onPress={() => handleResume(inst)}>
                    <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(100, 130, 195, 0.25)">
                      <View style={styles.row}>
                        {inst.activityEmoji ? <Text style={styles.emoji}>{inst.activityEmoji}</Text> : null}
                        <View style={styles.rowText}>
                          <Text style={[styles.rowTitle, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
                            {inst.activityTitle}
                          </Text>
                          <Text style={[styles.rowMeta, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                            {stepLabel} · {formatRelative(inst.lastAccessedAt)}
                          </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                      </View>
                    </MinkyPanel>
                  </Pressable>
                );
              })}
            </>
          )}

          {completed.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { fontSize: FontSettingsStore.getScaledFontSize(12), marginTop: inProgress.length > 0 ? 16 : 0 }]}>
                PAST SESSIONS
              </Text>
              {completed.map((entry) => {
                const moodSummary = (entry.summaryFields || []).find(f => f.label === 'Mood after')?.value
                  || (entry.moodRating != null ? `${entry.moodRating}/10` : null);
                return (
                  <Pressable key={entry._id} onPress={() => handleOpenInstance(entry)}>
                    <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
                      <View style={styles.row}>
                        <View style={styles.rowText}>
                          <Text style={[styles.rowTitle, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
                            {entry.titleOrTheme || entry.sourceActivityId}
                          </Text>
                          <Text style={[styles.rowMeta, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                            {formatRelative(entry.savedAt)}{moodSummary ? ` · ${moodSummary}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                      </View>
                    </MinkyPanel>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  list: { flex: 1 },
  listContent: { gap: 8 },
  sectionHeader: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 24 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rowMeta: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  arrow: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 22,
    paddingHorizontal: 4,
  },
  emptyTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyCopy: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textAlign: 'center',
    lineHeight: 20,
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
});

export default HistoryLanding;
