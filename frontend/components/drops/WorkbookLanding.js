import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';

/**
 * WorkbookLanding Drop
 * Displays a grid of activity items (emoji placeholders)
 * for a specific bookshelf/workbook
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
    onComplete({
      action: 'selectActivity',
      activityId,
      bookshelfId
    });
  };

  const isActivityCompleted = (activityId) => {
    return progress.some(p => p.activityId === activityId && p.status === 'completed');
  };

  const isActivityInProgress = (activityId) => {
    return progress.some(p => p.activityId === activityId && p.status === 'in-progress');
  };

  const renderActivityGrid = () => {
    if (!workbook?.activities) return null;

    const activities = workbook.activities;
    const isMobile = uxStore.isMobile || uxStore.isPortrait;
    const columns = isMobile ? 3 : 3;
    const rows = [];

    for (let i = 0; i < activities.length; i += columns) {
      rows.push(activities.slice(i, i + columns));
    }

    return (
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((activity) => {
              const completed = isActivityCompleted(activity.activityId);
              const inProgress = isActivityInProgress(activity.activityId);

              return (
                <Pressable
                  key={activity.activityId}
                  style={[
                    styles.activityCell,
                    completed && styles.activityCompleted,
                    inProgress && styles.activityInProgress
                  ]}
                  onPress={() => handleActivityClick(activity.activityId)}
                >
                  <MinkyPanel
                    borderRadius={12}
                    padding={16}
                    paddingTop={16}
                    overlayColor={completed ? 'rgba(76, 175, 80, 0.3)' : inProgress ? 'rgba(255, 193, 7, 0.3)' : 'rgba(112, 68, 199, 0.2)'}
                  >
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <Text style={[styles.activityTitle, { fontSize: FontSettingsStore.getScaledFontSize(11), color: FontSettingsStore.getFontColor('#403F3E') }]}>
                      {activity.title}
                    </Text>
                    {completed && (
                      <Text style={styles.statusBadge}>Done</Text>
                    )}
                    {inProgress && !completed && (
                      <Text style={[styles.statusBadge, styles.inProgressBadge]}>Started</Text>
                    )}
                  </MinkyPanel>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
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

  return (
    <View style={styles.container}>
      <Text style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
        Choose an activity to begin
      </Text>

      {renderActivityGrid()}

      <View style={styles.progressInfo}>
        <Text style={[styles.progressText, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
          {progress.filter(p => p.status === 'completed').length} / {workbook?.activities?.length || 0} completed
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
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
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  activityCell: {
    flex: 1,
    maxWidth: 120,
    minWidth: 80,
  },
  activityCompleted: {
    opacity: 0.8,
  },
  activityInProgress: {
    opacity: 1,
  },
  activityEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 4,
  },
  inProgressBadge: {
    color: '#FF9800',
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
    marginTop: 8,
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
