import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

const STATUS_BADGES = {
  'pending': { label: 'Pending Review', color: 'rgba(158, 158, 158, 0.25)', textColor: '#616161' },
  'in-shop': { label: 'In Shop', color: 'rgba(112, 68, 199, 0.2)', textColor: '#7044C7' },
  'pending-platform-approval': { label: 'Pending Platform Approval', color: 'rgba(33, 150, 243, 0.2)', textColor: '#1565C0' },
  'approved-for-platform': { label: 'On Platform', color: 'rgba(76, 175, 80, 0.2)', textColor: '#2E7D32' },
  'returned': { label: 'Returned for Changes', color: 'rgba(255, 152, 0, 0.2)', textColor: '#E65100' },
};

function getItemStatuses(item) {
  const statuses = [];
  const latestRevision = item.revisions[item.revisions.length - 1];

  // Shop/platform status first
  if (item.platformStatus === 'approved-for-platform') statuses.push('approved-for-platform');
  else if (item.platformStatus === 'pending-platform-approval') statuses.push('pending-platform-approval');
  else if (item.shopStatus === 'in-shop') statuses.push('in-shop');

  // Latest revision status if it's not approved (i.e. pending or returned)
  if (latestRevision?.status === 'pending') statuses.push('pending');
  else if (latestRevision?.status === 'returned') statuses.push('returned');

  if (statuses.length === 0) statuses.push('pending');
  return statuses;
}

const BazaarMySubmissions = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('bazaar:submissions:mine', {
        sessionId: SessionStore.sessionId
      });
      setSubmissions(result || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      ErrorStore.addError(error.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const renderSubmission = (item) => {
    const statuses = getItemStatuses(item);

    return (
      <Pressable
        key={item._id}
        onPress={() => onComplete({ action: 'viewSubmission', itemId: item._id, itemTitle: item.title })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <View style={styles.cardHeader}>
            <Text style={[styles.itemTitle, {
              fontSize: FontSettingsStore.getScaledFontSize(15),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.badgeRow}>
              {statuses.map(status => {
                const badge = STATUS_BADGES[status] || STATUS_BADGES['pending'];
                return (
                  <View key={status} style={[styles.statusBadge, { backgroundColor: badge.color }]}>
                    <Text style={[styles.statusText, {
                      fontSize: FontSettingsStore.getScaledFontSize(10),
                      color: badge.textColor
                    }]}>
                      {badge.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.cardMeta}>
            <Text style={[styles.metaText, {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              {item.storeType}{item.revisions.length > 1 ? ` · ${item.revisions.length - 1} revision${item.revisions.length - 1 !== 1 ? 's' : ''}` : ''}
            </Text>
            {item.shopStatus === 'in-shop' && (
              <Text style={[styles.metaText, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                {item.purchaseCount} sold · {item.price} hearts
              </Text>
            )}
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
        ) : submissions.length === 0 ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              No submissions yet. Head to the Drawing Board to get started!
            </Text>
          </MinkyPanel>
        ) : (
          <View style={styles.submissionList}>
            {submissions.map(renderSubmission)}
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
  submissionList: {
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  itemTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardMeta: {
    gap: 2,
  },
  metaText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
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

export default BazaarMySubmissions;
