import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';
import { resolveAvatarUrl } from '../../utils/domain';

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

const VISIBILITY_BADGES = {
  visible: { label: 'Visible', color: 'rgba(76, 175, 80, 0.2)', textColor: '#2E7D32' },
  pending: { label: 'Pending Review', color: 'rgba(158, 158, 158, 0.25)', textColor: '#616161' },
  removed: { label: 'Removed', color: 'rgba(255, 152, 0, 0.2)', textColor: '#E65100' },
};

const MailboxList = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('bazaar:comments:mine', {
        sessionId: SessionStore.sessionId
      });
      setComments(result || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      ErrorStore.addError(error.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const renderComment = (entry) => {
    const badge = entry.comment.removed ? VISIBILITY_BADGES.removed
      : entry.comment.visible ? VISIBILITY_BADGES.visible
      : VISIBILITY_BADGES.pending;

    return (
      <Pressable
        key={entry.comment._id}
        onPress={() => onComplete({ action: 'viewItem', itemId: entry.itemId, itemTitle: entry.itemTitle })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <View style={styles.cardRow}>
            {entry.contentUrl && (
              <View style={styles.thumbnailFrame}>
                <Image
                  source={{ uri: resolveAvatarUrl(entry.contentUrl) }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.thumbnailHighlight} pointerEvents="none" />
                <View style={styles.thumbnailStitch} pointerEvents="none" />
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={[styles.itemTitle, {
                  fontSize: FontSettingsStore.getScaledFontSize(14),
                  color: FontSettingsStore.getFontColor('#2D2C2B')
                }]} numberOfLines={1}>
                  {entry.itemTitle}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.color }]}>
                  <Text style={[styles.badgeText, {
                    fontSize: FontSettingsStore.getScaledFontSize(10),
                    color: badge.textColor
                  }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>
              <Text style={[styles.commentPreview, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                lineHeight: FontSettingsStore.getScaledSpacing(17),
                color: FontSettingsStore.getFontColor('#454342')
              }]} numberOfLines={2}>
                {entry.comment.content}
              </Text>
              <Text style={[styles.timeText, {
                fontSize: FontSettingsStore.getScaledFontSize(10),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                {formatTimeAgo(entry.comment.createdAt)}
              </Text>
            </View>
          </View>
        </MinkyPanel>
      </Pressable>
    );
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
        ) : comments.length === 0 ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Your mailbox is empty. Leave comments on items in the shop and they'll show up here!
            </Text>
          </MinkyPanel>
        ) : (
          <View style={styles.commentList}>
            {comments.map(renderComment)}
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
  commentList: {
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnailFrame: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  thumbnailHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  thumbnailStitch: {
    position: 'absolute',
    top: -0.5,
    left: -0.5,
    right: -0.5,
    bottom: -0.5,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(112, 68, 199, 0.5)',
    borderRadius: 5,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  commentPreview: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  timeText: {
    fontFamily: 'Comfortaa',
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

export default MailboxList;
