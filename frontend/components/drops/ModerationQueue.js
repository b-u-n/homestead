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

const CONTENT_TYPE_FILTERS = [
  { value: null, label: 'All' },
  { value: 'bazaar-revision', label: 'Revisions' },
  { value: 'bazaar-comment', label: 'Comments' },
];

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'flagged-for-admin', label: 'Flagged' },
  { value: 'approved', label: 'Approved' },
  { value: 'returned', label: 'Returned' },
];

const ModerationQueue = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentTypeFilter, setContentTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    loadQueue();

    if (WebSocketService.socket) {
      WebSocketService.socket.on('moderation:queueUpdated', loadQueue);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off('moderation:queueUpdated', loadQueue);
      }
    };
  }, [contentTypeFilter, statusFilter]);

  const loadQueue = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('moderation:queue:list', {
        sessionId: SessionStore.sessionId,
        contentType: contentTypeFilter,
        status: statusFilter,
      });
      setItems(result || []);
    } catch (error) {
      console.error('Error loading queue:', error);
      ErrorStore.addError(error.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const renderQueueItem = (item) => {
    const isEscalated = item.priority === 'escalated';

    return (
      <Pressable
        key={item._id}
        onPress={() => onComplete({ action: 'reviewItem', queueId: item._id })}
      >
        <MinkyPanel
          borderRadius={8}
          padding={12}
          paddingTop={12}
          overlayColor={isEscalated ? 'rgba(255, 111, 97, 0.15)' : undefined}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.refTitle, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]} numberOfLines={1}>
              {item.referenceTitle || 'Untitled'}
            </Text>
            {isEscalated && (
              <View style={styles.escalatedBadge}>
                <Text style={[styles.escalatedText, {
                  fontSize: FontSettingsStore.getScaledFontSize(10)
                }]}>Escalated</Text>
              </View>
            )}
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.typeBadge}>
              <Text style={[styles.typeText, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
                {item.contentType === 'bazaar-revision' ? 'Revision' : 'Comment'}
              </Text>
            </View>
            {item.itemType && (
              <View style={styles.itemTypeBadge}>
                <Text style={[styles.itemTypeText, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
                  {item.itemType}
                </Text>
              </View>
            )}
            <Text style={[styles.submitter, {
              fontSize: FontSettingsStore.getScaledFontSize(11),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              by {item.submittedBy?.name}
            </Text>
            <Text style={[styles.time, {
              fontSize: FontSettingsStore.getScaledFontSize(10),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </MinkyPanel>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <WoolButton variant="secondary" size="small" onPress={() => onComplete({ action: 'viewActionLog' })}>
            Action Log
          </WoolButton>
        </View>
        <View style={styles.filterRow}>
          {CONTENT_TYPE_FILTERS.map(f => (
            <WoolButton
              key={f.value || 'all'}
              variant="secondary"
              focused={contentTypeFilter === f.value}
              size="small"
              onPress={() => setContentTypeFilter(f.value)}
            >
              {f.label}
            </WoolButton>
          ))}
        </View>
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map(f => (
            <WoolButton
              key={f.value}
              variant="secondary"
              focused={statusFilter === f.value}
              size="small"
              onPress={() => setStatusFilter(f.value)}
            >
              {f.label}
            </WoolButton>
          ))}
        </View>
      </View>

      <ScrollBarView style={styles.scrollContainer}>
        {loading ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>Loading...</Text>
          </MinkyPanel>
        ) : items.length === 0 ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>Queue is empty</Text>
          </MinkyPanel>
        ) : (
          <View style={styles.queueList}>
            {items.map(renderQueueItem)}
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
  filters: {
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  queueList: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  refTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  escalatedBadge: {
    backgroundColor: 'rgba(255, 111, 97, 0.25)',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  escalatedText: {
    fontFamily: 'Comfortaa',
    color: '#D32F2F',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: {
    fontFamily: 'Comfortaa',
    color: '#7044C7',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemTypeBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemTypeText: {
    fontFamily: 'Comfortaa',
    color: '#1565C0',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  submitter: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  time: {
    fontFamily: 'Comfortaa',
    marginLeft: 'auto',
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

export default ModerationQueue;
