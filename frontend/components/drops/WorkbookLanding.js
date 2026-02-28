import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

/**
 * WorkbookLanding Drop
 * Single-column list of activities for a bookshelf.
 * Each row: emoji + title on left, stitched checkbox on right.
 */
const WorkbookLanding = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [workbook, setWorkbook] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const bookshelfId = context?.flowParams?.bookshelfId || input?.bookshelfId || 'default';

  useEffect(() => {
    loadWorkbook();
  }, [bookshelfId]);

  const loadWorkbook = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('workbook:load', {
        bookshelfId,
        sessionId: SessionStore.sessionId
      });

      if (result?.workbook) {
        setWorkbook(result.workbook);
        setProgress(result.progress || []);
      }
    } catch (error) {
      console.error('Error loading workbook:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activityId) => {
    const activity = activities.find(a => a.activityId === activityId);
    onComplete({
      action: 'selectActivity',
      activityId,
      activityTitle: activity?.title,
      bookshelfId
    });
  };

  const isActivityCompleted = (activityId) => {
    return progress.some(p => p.activityId === activityId && p.status === 'completed');
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
          <Text style={[styles.loadingText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
            Loading activities...
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  const activities = workbook?.activities || [];
  const completedCount = progress.filter(p => p.status === 'completed').length;

  return (
    <View style={styles.container}>
      <Text style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
        Choose an activity to begin
      </Text>

      <ScrollBarView style={styles.list}>
        <View style={styles.listContent}>
          {activities.map((activity) => {
            const completed = isActivityCompleted(activity.activityId);

            return (
              <Pressable
                key={activity.activityId}
                onPress={() => handleActivityClick(activity.activityId)}
              >
                <MinkyPanel
                  borderRadius={8}
                  padding={12}
                  paddingTop={12}
                  overlayColor="rgba(112, 68, 199, 0.2)"
                >
                  <View style={styles.activityRow}>
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <Text
                      style={[
                        styles.activityTitle,
                        {
                          fontSize: FontSettingsStore.getScaledFontSize(14),
                          color: FontSettingsStore.getFontColor('#2D2C2B'),
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {activity.title}
                    </Text>
                    <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
                      {completed && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                    </View>
                  </View>
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>
      </ScrollBarView>

      <View style={styles.progressInfo}>
        <Text style={[styles.progressText, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
          {completedCount} / {activities.length} completed
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  checkmark: {
    color: '#2D2C2B',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default WorkbookLanding;
