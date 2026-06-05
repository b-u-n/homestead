// /activities-review/<reviewer>/  — slim per-reviewer activity browser.
// Renders only the activities tagged with the URL's reviewer (z / bonbon / fendi);
// no component catalog or demo prose. Same launcher plumbing as activities-demo
// (FlowEngine + WorkbookActivityDrop) so tapping a row opens the activity.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import WebSocketService from '../../services/websocket';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../../components/MinkyPanel';
import Scroll from '../../components/Scroll';
import FlowEngine from '../../components/FlowEngine';
import WorkbookActivityDrop from '../../components/drops/WorkbookActivity';
import WorkbookResumePickerDrop from '../../components/drops/WorkbookResumePicker';
import domain from '../../utils/domain';

const REVIEWERS = ['z', 'bonbon', 'fendi'] as const;

const activityReviewFlow = {
  name: 'activityReview',
  title: 'Activity',
  startAt: 'workbook:resume-picker',
  drops: {
    'workbook:resume-picker': {
      component: WorkbookResumePickerDrop,
      input: {},
      next: [
        {
          when: (output: any) => output.action === 'resume' || output.action === 'startFresh',
          goto: 'workbook:activity',
        },
      ],
    },
    'workbook:activity': {
      component: WorkbookActivityDrop,
      input: {},
      scrollContent: false,
      next: [],
    },
  },
};

const ActivityRow = ({ activity, onLaunch }: any) => (
  <View style={{ marginBottom: 8 }}>
    <Pressable onPress={() => onLaunch(activity)}>
      <MinkyPanel
        borderRadius={8}
        padding={12}
        paddingTop={12}
        overlayColor="rgba(112, 68, 199, 0.2)"
      >
        <View style={styles.row}>
          <Text style={styles.emoji}>{activity.emoji || '📝'}</Text>
          <Text
            style={[
              styles.title,
              {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
            numberOfLines={2}
          >
            {activity.title}
          </Text>
        </View>
      </MinkyPanel>
    </Pressable>
  </View>
);

export default function ActivitiesReview() {
  const params = useLocalSearchParams<{ reviewer: string }>();
  const reviewer = String(params?.reviewer || '').toLowerCase();
  const valid = (REVIEWERS as readonly string[]).includes(reviewer);

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<any>(null);

  // Per-reviewer activity browser is a workbook surface — flip the workbook
  // font + spacing bump on while this page is mounted so the list reads at
  // the same comfortable size as the activities themselves. Reference-counted.
  useEffect(() => {
    FontSettingsStore.setWorkbookActive(true);
    return () => FontSettingsStore.setWorkbookActive(false);
  }, []);

  // Ensure the shared demo account exists (so launching activities works the
  // same way as activities-demo).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${domain()}/api/accounts/ensure-demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data?.sessionId && !cancelled) setSessionId(data.sessionId);
      } catch (err) {
        console.error('[activities-review] ensure-demo failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!valid) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      if (!WebSocketService.socket) WebSocketService.connect();
      for (let i = 0; i < 50; i++) {
        if (cancelled) return;
        if (WebSocketService.socket?.connected) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      try {
        const res = await WebSocketService.emit('workbook:listByReviewer', { reviewer });
        if (cancelled) return;
        const list = res?.activities || res?.data?.activities || [];
        setActivities(list);
      } catch (err) {
        console.warn('[activities-review] listByReviewer failed:', (err as any)?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reviewer, valid]);

  if (!valid) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Unknown reviewer "{reviewer}". Expected one of: {REVIEWERS.join(', ')}.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Scroll contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>
          {loading ? (
            <Text style={styles.body}>Loading…</Text>
          ) : activities.length === 0 ? (
            <Text style={styles.body}>No activities tagged for {reviewer}.</Text>
          ) : (
            activities.map((a) => (
              <ActivityRow key={a.activityId} activity={a} onLaunch={setActiveActivity} />
            ))
          )}
        </View>
      </Scroll>

      <FlowEngine
        flowDefinition={{ ...activityReviewFlow, title: activeActivity?.title || 'Activity' }}
        visible={!!activeActivity}
        onClose={() => setActiveActivity(null)}
        initialContext={{
          sessionId: sessionId,
          flowParams: activeActivity ? { title: activeActivity.title } : {},
        }}
        initialParams={
          activeActivity ? { activityId: activeActivity.activityId } : {}
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8D4C8' },
  scrollContent: { paddingVertical: 16 },
  inner: { paddingHorizontal: 16, alignSelf: 'stretch', width: '100%' },
  heading: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    marginBottom: 14,
    textTransform: 'capitalize',
  },
  body: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 20 },
  title: { flex: 1, fontFamily: 'Comfortaa', fontWeight: '700' },
});
