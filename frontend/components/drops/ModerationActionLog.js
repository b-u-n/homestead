import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const ACTION_LABELS = {
  'approve-revision': 'Approved revision',
  'return-revision': 'Returned revision',
  'flag-for-admin': 'Flagged for admin',
  'approve-comment': 'Approved comment',
  'return-comment': 'Removed comment',
  'request-platform-approval': 'Requested platform approval',
  'approve-for-platform': 'Approved for platform',
  'return-for-platform': 'Returned for platform',
};

const ModerationActionLog = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('moderation:actions:list', {
        sessionId: SessionStore.sessionId,
      });
      setActions(result || []);
    } catch (error) {
      console.error('Error loading actions:', error);
      ErrorStore.addError(error.message || 'Failed to load action log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        {loading ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>Loading...</Text>
          </MinkyPanel>
        ) : actions.length === 0 ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>No actions yet</Text>
          </MinkyPanel>
        ) : (
          <View style={styles.actionList}>
            {actions.map((action, idx) => (
              <MinkyPanel key={action._id || idx} borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
                <View style={styles.actionHeader}>
                  <Text style={[styles.actorName, {
                    fontSize: FontSettingsStore.getScaledFontSize(13),
                    color: FontSettingsStore.getFontColor('#2D2C2B')
                  }]}>
                    {action.actor?.name}
                  </Text>
                  <Text style={[styles.actionTime, {
                    fontSize: FontSettingsStore.getScaledFontSize(10),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    {formatTimeAgo(action.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.actionType, {
                  fontSize: FontSettingsStore.getScaledFontSize(12),
                  color: FontSettingsStore.getFontColor('#7044C7')
                }]}>
                  {ACTION_LABELS[action.actionType] || action.actionType}
                </Text>
                {action.note && (
                  <Text style={[styles.actionNote, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    "{action.note}"
                  </Text>
                )}
              </MinkyPanel>
            ))}
          </View>
        )}
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  actionList: {
    gap: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actorName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionTime: {
    fontFamily: 'Comfortaa',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionType: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default ModerationActionLog;
