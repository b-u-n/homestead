import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
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

const TABS = [
  { key: 'new', label: 'New' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'platform', label: 'Platform' },
  { key: 'actions', label: 'Actions' },
];

const AdminDashboard = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    loadData();

    if (WebSocketService.socket) {
      WebSocketService.socket.on('admin:queueUpdated', loadData);
      WebSocketService.socket.on('moderation:queueUpdated', loadData);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off('admin:queueUpdated', loadData);
        WebSocketService.socket.off('moderation:queueUpdated', loadData);
      }
    };
  }, []);

  const loadData = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('admin:queue:list', {
        sessionId: SessionStore.sessionId,
      });
      setData(result || {});
    } catch (error) {
      console.error('Error loading admin data:', error);
      ErrorStore.addError(error.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const renderNewSubmissions = () => {
    const items = data?.newSubmissions || [];
    if (items.length === 0) return renderEmpty('No new submissions');

    return items.map(item => (
      <Pressable
        key={item._id}
        onPress={() => onComplete({ action: 'reviewItem', queueId: item._id })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.cardTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>{item.referenceTitle}</Text>
          <Text style={[styles.cardMeta, {
            fontSize: FontSettingsStore.getScaledFontSize(11),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            by {item.submittedBy?.name} · {item.itemType} · {formatTimeAgo(item.createdAt)}
          </Text>
        </MinkyPanel>
      </Pressable>
    ));
  };

  const renderFlagged = () => {
    const items = data?.flagged || [];
    if (items.length === 0) return renderEmpty('No flagged items');

    return items.map(item => (
      <Pressable
        key={item._id}
        onPress={() => onComplete({ action: 'reviewItem', queueId: item._id })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(255, 111, 97, 0.15)">
          <Text style={[styles.cardTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>{item.referenceTitle}</Text>
          <Text style={[styles.cardMeta, {
            fontSize: FontSettingsStore.getScaledFontSize(11),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Flagged by {item.flaggedBy?.[item.flaggedBy.length - 1]?.user?.name || 'moderator'} · {formatTimeAgo(item.createdAt)}
          </Text>
          {item.flaggedBy?.[item.flaggedBy.length - 1]?.reason && (
            <Text style={[styles.flagReason, {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#D32F2F')
            }]}>
              "{item.flaggedBy[item.flaggedBy.length - 1].reason}"
            </Text>
          )}
        </MinkyPanel>
      </Pressable>
    ));
  };

  const renderEscalated = () => {
    const items = data?.escalated || [];
    if (items.length === 0) return renderEmpty('No escalated items');

    return items.map((entry, idx) => (
      <Pressable
        key={entry.item._id || idx}
        onPress={() => onComplete({
          action: 'reviewItem',
          itemId: entry.item._id,
          revisionIndex: entry.pendingRevisions[0]?.revisionIndex
        })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.15)">
          <Text style={[styles.cardTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>{entry.item.title}</Text>
          <Text style={[styles.cardMeta, {
            fontSize: FontSettingsStore.getScaledFontSize(11),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Platform-approved · {entry.pendingRevisions.length} pending revision{entry.pendingRevisions.length !== 1 ? 's' : ''}
          </Text>
        </MinkyPanel>
      </Pressable>
    ));
  };

  const renderPlatformApproval = () => {
    const items = data?.platformApproval || [];
    if (items.length === 0) return renderEmpty('No items pending platform approval');

    return items.map(item => (
      <Pressable
        key={item._id}
        onPress={() => onComplete({ action: 'reviewItem', itemId: item._id })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(33, 150, 243, 0.12)">
          <Text style={[styles.cardTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>{item.title}</Text>
          <Text style={[styles.cardMeta, {
            fontSize: FontSettingsStore.getScaledFontSize(11),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            by {item.user?.name} · Requested for platform
          </Text>
        </MinkyPanel>
      </Pressable>
    ));
  };

  const renderActions = () => {
    const items = data?.recentActions || [];
    if (items.length === 0) return renderEmpty('No recent actions');

    return items.map((action, idx) => (
      <MinkyPanel key={action._id || idx} borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
        <View style={styles.actionHeader}>
          <Text style={[styles.actionActor, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>{action.actor?.name}</Text>
          <Text style={[styles.actionTime, {
            fontSize: FontSettingsStore.getScaledFontSize(10),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>{formatTimeAgo(action.createdAt)}</Text>
        </View>
        <Text style={[styles.actionType, {
          fontSize: FontSettingsStore.getScaledFontSize(12),
          color: FontSettingsStore.getFontColor('#7044C7')
        }]}>{action.actionType}</Text>
        {action.note && (
          <Text style={[styles.actionNote, {
            fontSize: FontSettingsStore.getScaledFontSize(11),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>"{action.note}"</Text>
        )}
      </MinkyPanel>
    ));
  };

  const renderEmpty = (message) => (
    <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
      <Text style={[styles.emptyText, {
        fontSize: FontSettingsStore.getScaledFontSize(14),
        color: FontSettingsStore.getFontColor('#454342')
      }]}>{message}</Text>
    </MinkyPanel>
  );

  const renderTabContent = () => {
    if (loading) return renderEmpty('Loading...');

    switch (activeTab) {
      case 'new': return renderNewSubmissions();
      case 'flagged': return renderFlagged();
      case 'escalated': return renderEscalated();
      case 'platform': return renderPlatformApproval();
      case 'actions': return renderActions();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <WoolButton variant="secondary" size="small" onPress={() => onComplete({ action: 'viewActionLog' })}>
          Full Log
        </WoolButton>
        {TABS.map(tab => (
          <WoolButton
            key={tab.key}
            variant="secondary"
            focused={activeTab === tab.key}
            size="small"
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </WoolButton>
        ))}
      </View>

      <ScrollBarView style={styles.scrollContainer}>
        <View style={styles.contentList}>
          {renderTabContent()}
        </View>
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  contentList: {
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardMeta: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  flagReason: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionActor: {
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
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
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

export default AdminDashboard;
