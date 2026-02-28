import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import { resolveAvatarUrl } from '../../utils/domain';

const AdminReviewItem = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [queueItem, setQueueItem] = useState(null);
  const [shopItem, setShopItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState('');
  const [acting, setActing] = useState(false);

  const accumulated = accumulatedData?.['admin:dashboard'] || {};
  const queueId = accumulated.queueId || input?.queueId;
  const directItemId = accumulated.itemId || input?.itemId;
  const directRevisionIndex = accumulated.revisionIndex ?? input?.revisionIndex;

  useEffect(() => {
    loadItem();
  }, [queueId, directItemId]);

  const loadItem = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (queueId) {
        const result = await WebSocketService.emit('moderation:queue:get', {
          sessionId: SessionStore.sessionId,
          queueId,
        });
        if (result) {
          setQueueItem(result.queueItem);
          setShopItem(result.shopItem);
        }
      } else if (directItemId) {
        const result = await WebSocketService.emit('bazaar:submission:get', {
          itemId: directItemId,
        });
        if (result) {
          setShopItem(result);
        }
      }
    } catch (error) {
      console.error('Error loading item:', error);
      ErrorStore.addError(error.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleModAction = async (actionEvent) => {
    try {
      setActing(true);
      await WebSocketService.emit(actionEvent, {
        sessionId: SessionStore.sessionId,
        queueId,
        note: actionNote.trim() || undefined,
        itemId: shopItem?._id || directItemId,
      });
      onComplete({ action: 'actioned' });
    } catch (error) {
      console.error('Error:', error);
      ErrorStore.addError(error.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const handleEscalatedAction = async (approve) => {
    const event = approve ? 'admin:escalated:approveRevision' : 'admin:escalated:returnRevision';
    try {
      setActing(true);
      await WebSocketService.emit(event, {
        sessionId: SessionStore.sessionId,
        itemId: shopItem?._id || directItemId,
        revisionIndex: directRevisionIndex,
        note: actionNote.trim() || undefined,
      });
      onComplete({ action: 'actioned' });
    } catch (error) {
      console.error('Error:', error);
      ErrorStore.addError(error.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const handlePlatformAction = async (approve) => {
    const event = approve ? 'admin:submission:approveForPlatform' : 'admin:submission:returnForPlatform';
    try {
      setActing(true);
      await WebSocketService.emit(event, {
        sessionId: SessionStore.sessionId,
        itemId: shopItem?._id || directItemId,
        note: actionNote.trim() || undefined,
      });
      onComplete({ action: 'actioned' });
    } catch (error) {
      console.error('Error:', error);
      ErrorStore.addError(error.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.emptyText, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>Loading...</Text>
        </MinkyPanel>
      </View>
    );
  }

  if (!shopItem) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.emptyText, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>Item not found</Text>
        </MinkyPanel>
      </View>
    );
  }

  const isEscalated = shopItem.platformStatus === 'approved-for-platform' && directRevisionIndex !== undefined;
  const isPlatformRequest = shopItem.platformStatus === 'pending-platform-approval';
  const isQueueReview = !!queueItem;

  const approvedRevision = shopItem.currentApprovedRevisionIndex !== null && shopItem.currentApprovedRevisionIndex !== undefined
    ? shopItem.revisions[shopItem.currentApprovedRevisionIndex]
    : null;

  const escalatedRevision = directRevisionIndex !== undefined
    ? shopItem.revisions[directRevisionIndex]
    : null;

  const queueRevision = queueItem
    ? shopItem.revisions[queueItem.revisionIndex]
    : null;

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        {/* Item info */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.title, {
            fontSize: FontSettingsStore.getScaledFontSize(18),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            {shopItem.title}
          </Text>
          <Text style={[styles.meta, {
            fontSize: FontSettingsStore.getScaledFontSize(12),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            by {shopItem.user?.name} · {shopItem.storeType} · {shopItem.revisions.length} revisions
          </Text>
          {shopItem.description && (
            <Text style={[styles.description, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              {shopItem.description}
            </Text>
          )}
        </MinkyPanel>

        {/* Content display */}
        {(escalatedRevision || queueRevision) && (
          <>
          <View style={{ height: 12 }} />
          <MinkyPanel borderRadius={8} padding={14} paddingTop={14} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.panelLabel, {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]}>
              {isEscalated ? 'Escalated Revision' : 'Under Review'}
            </Text>
            {(escalatedRevision || queueRevision)?.contentUrl && (
              <img
                src={resolveAvatarUrl((escalatedRevision || queueRevision).contentUrl)}
                style={{
                  alignSelf: 'center',
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 10,
                  border: '2px dashed rgba(112, 68, 199, 0.5)',
                  display: 'block',
                }}
              />
            )}
            {(escalatedRevision || queueRevision)?.note && (
              <Text style={[styles.noteText, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Note: {(escalatedRevision || queueRevision).note}
              </Text>
            )}
          </MinkyPanel>
          </>
        )}

        {approvedRevision && (
          <>
          <View style={{ height: 12 }} />
          <MinkyPanel borderRadius={8} padding={14} paddingTop={14}>
            <Text style={[styles.panelLabel, {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]}>Current Approved Version</Text>
            {approvedRevision.contentUrl && (
              <img
                src={resolveAvatarUrl(approvedRevision.contentUrl)}
                style={{
                  alignSelf: 'center',
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 10,
                  border: '2px dashed rgba(112, 68, 199, 0.5)',
                  display: 'block',
                }}
              />
            )}
          </MinkyPanel>
          </>
        )}

        {/* Copyright info */}
        {shopItem?.copyright && (
          <>
            <View style={{ height: 12 }} />
            <MinkyPanel borderRadius={8} padding={14} paddingTop={14}>
              <Text style={[styles.panelLabel, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>Copyright</Text>
              <Text style={[styles.meta, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Attribution: {shopItem.copyright.attribution || 'username'}
                {shopItem.copyright.realName ? ` (${shopItem.copyright.realName})` : ''}
              </Text>
              {shopItem.copyright.authorizeAdvertising && (
                <Text style={[styles.meta, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#454342'),
                  marginTop: 4,
                }]}>
                  Advertising authorized
                </Text>
              )}
              {shopItem.copyright.attributionLink && (
                <Text style={[styles.meta, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#7044C7'),
                  marginTop: 4,
                }]}>
                  {shopItem.copyright.attributionLink}
                </Text>
              )}
            </MinkyPanel>
          </>
        )}

        {/* Revision history */}
        <View style={{ height: 12 }} />
        <MinkyPanel borderRadius={8} padding={14} paddingTop={14}>
          <Text style={[styles.panelLabel, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>All Revisions</Text>
          {shopItem.revisions.map((rev, idx) => (
            <View key={idx} style={styles.revisionItem}>
              <Text style={[styles.revisionText, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                #{idx + 1} — {rev.status}
                {rev.reviewedBy ? ` (by ${rev.reviewedBy.name})` : ''}
              </Text>
            </View>
          ))}
        </MinkyPanel>

        <View style={{ height: 12 }} />

        {/* Action panel */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.panelLabel, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Actions</Text>

          <TextInput
            style={[styles.noteInput, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]}
            placeholder="Note (optional)"
            placeholderTextColor="rgba(92, 90, 88, 0.5)"
            value={actionNote}
            onChangeText={setActionNote}
            multiline
            maxLength={1000}
          />

          <View style={styles.actionButtons}>
            {/* Queue review actions (same as mod) */}
            {isQueueReview && queueItem.contentType === 'bazaar-revision' && (
              <>
                <WoolButton variant="green" size="medium" onPress={() => handleModAction('moderation:revision:approve')} disabled={acting}>
                  Approve Revision
                </WoolButton>
                <WoolButton variant="secondary" size="medium" onPress={() => handleModAction('moderation:revision:return')} disabled={acting}>
                  Return Revision
                </WoolButton>
              </>
            )}

            {/* Escalated revision actions */}
            {isEscalated && (
              <>
                <WoolButton variant="green" size="medium" onPress={() => handleEscalatedAction(true)} disabled={acting}>
                  Approve Revision
                </WoolButton>
                <WoolButton variant="secondary" size="medium" onPress={() => handleEscalatedAction(false)} disabled={acting}>
                  Return Revision
                </WoolButton>
              </>
            )}

            {/* Platform approval actions */}
            {(isPlatformRequest || isQueueReview) && (
              <>
                <WoolButton variant="blue" size="medium" onPress={() => handlePlatformAction(true)} disabled={acting}>
                  Approve for Platform
                </WoolButton>
                <WoolButton variant="coral" size="medium" onPress={() => handlePlatformAction(false)} disabled={acting}>
                  Return for Platform
                </WoolButton>
              </>
            )}
          </View>
        </MinkyPanel>
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
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  meta: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  panelLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  noteText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.1)',
  },
  revisionText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'Comfortaa',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    minHeight: 50,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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

export default AdminReviewItem;
