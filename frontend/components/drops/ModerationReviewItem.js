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

const ModerationReviewItem = observer(({
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
  const [flagReason, setFlagReason] = useState('');

  const queueId = accumulatedData?.['moderation:queue']?.queueId || input?.queueId;

  useEffect(() => {
    loadItem();
  }, [queueId]);

  const loadItem = async () => {
    if (!WebSocketService.socket || !queueId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('moderation:queue:get', {
        sessionId: SessionStore.sessionId,
        queueId,
      });
      if (result) {
        setQueueItem(result.queueItem);
        setShopItem(result.shopItem);
      }
    } catch (error) {
      console.error('Error loading item:', error);
      ErrorStore.addError(error.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionEvent) => {
    try {
      setActing(true);
      await WebSocketService.emit(actionEvent, {
        sessionId: SessionStore.sessionId,
        queueId,
        note: actionNote.trim() || undefined,
        reason: flagReason.trim() || undefined,
        itemId: shopItem?._id,
      });
      onComplete({ action: 'actioned' });
    } catch (error) {
      console.error('Error performing action:', error);
      ErrorStore.addError(error.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (loading || !queueItem) {
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.emptyText, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>{loading ? 'Loading...' : 'Item not found'}</Text>
        </MinkyPanel>
      </View>
    );
  }

  const isRevision = queueItem.contentType === 'bazaar-revision';
  const isComment = queueItem.contentType === 'bazaar-comment';

  const revision = isRevision && shopItem
    ? shopItem.revisions[queueItem.revisionIndex]
    : null;

  const previousApproved = shopItem?.currentApprovedRevisionIndex !== null && shopItem?.currentApprovedRevisionIndex !== undefined
    ? shopItem.revisions[shopItem.currentApprovedRevisionIndex]
    : null;

  const comment = isComment && shopItem
    ? shopItem.comments[queueItem.commentIndex]
    : null;

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.title, {
            fontSize: FontSettingsStore.getScaledFontSize(18),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            {queueItem.referenceTitle || 'Review Item'}
          </Text>
          <Text style={[styles.metaText, {
            fontSize: FontSettingsStore.getScaledFontSize(12),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            {isRevision ? `Revision ${queueItem.revisionIndex + 1}` : 'Comment'} · by {queueItem.submittedBy?.name} · {queueItem.itemType}
          </Text>
        </MinkyPanel>

        {/* Revision content */}
        {isRevision && revision && (
          <>
            <View style={{ height: 12 }} />
            <MinkyPanel borderRadius={8} padding={14} paddingTop={14} overlayColor="rgba(112, 68, 199, 0.2)">
              <Text style={[styles.panelLabel, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>New Revision</Text>
              {revision.contentUrl && (
                <img
                  src={resolveAvatarUrl(revision.contentUrl)}
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
              {revision.textContent && (
                <Text style={[styles.textContent, {
                  fontSize: FontSettingsStore.getScaledFontSize(13),
                  color: FontSettingsStore.getFontColor('#2D2C2B')
                }]}>
                  {revision.textContent}
                </Text>
              )}
              {revision.note && (
                <Text style={[styles.noteText, {
                  fontSize: FontSettingsStore.getScaledFontSize(12),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  Note: {revision.note}
                </Text>
              )}
            </MinkyPanel>

            {/* Previous approved for comparison */}
            {previousApproved && (
              <>
                <View style={{ height: 12 }} />
                <MinkyPanel borderRadius={8} padding={14} paddingTop={14}>
                  <Text style={[styles.panelLabel, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#2D2C2B')
                  }]}>Previously Approved</Text>
                  {previousApproved.contentUrl && (
                    <img
                      src={resolveAvatarUrl(previousApproved.contentUrl)}
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
          </>
        )}

        {/* Comment content */}
        {isComment && comment && (
          <>
            {/* Show the item's image for context */}
            {previousApproved?.contentUrl && (
              <>
                <View style={{ height: 12 }} />
                <img
                  src={resolveAvatarUrl(previousApproved.contentUrl)}
                  style={{
                    alignSelf: 'center',
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 10,
                    border: '2px dashed rgba(112, 68, 199, 0.5)',
                    display: 'block',
                  }}
                />
              </>
            )}
            <View style={{ height: 12 }} />
            <MinkyPanel borderRadius={8} padding={14} paddingTop={14}>
              <Text style={[styles.panelLabel, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>Comment Content</Text>
              <Text style={[styles.textContent, {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                lineHeight: FontSettingsStore.getScaledSpacing(20),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                {comment.content}
              </Text>
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
              <Text style={[styles.metaText, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Attribution: {shopItem.copyright.attribution || 'username'}
                {shopItem.copyright.realName ? ` (${shopItem.copyright.realName})` : ''}
              </Text>
              {shopItem.copyright.authorizeAdvertising && (
                <Text style={[styles.metaText, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#454342'),
                  marginTop: 4,
                }]}>
                  Advertising authorized
                </Text>
              )}
              {shopItem.copyright.attributionLink && (
                <Text style={[styles.metaText, {
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
        {shopItem?.revisions?.length > 0 && (
          <>
            <View style={{ height: 12 }} />
            <MinkyPanel borderRadius={8} padding={14} paddingTop={14}>
              <Text style={[styles.panelLabel, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>Revision History</Text>
              {shopItem.revisions.map((rev, idx) => (
                <View key={idx} style={styles.revisionItem}>
                  <Text style={[styles.metaText, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#2D2C2B')
                  }]}>
                    #{idx + 1} — {rev.status}
                    {rev.reviewedBy ? ` (by ${rev.reviewedBy.name})` : ''}
                  </Text>
                </View>
              ))}
            </MinkyPanel>
          </>
        )}

        <View style={{ height: 12 }} />

        {/* Action note input */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.actionLabel, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Note (for returns/flags)</Text>
          <TextInput
            style={[styles.noteInput, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]}
            placeholder="Reason or feedback..."
            placeholderTextColor="rgba(92, 90, 88, 0.5)"
            value={actionNote}
            onChangeText={setActionNote}
            multiline
            maxLength={1000}
          />

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            {isRevision && (
              <>
                <WoolButton variant="green" size="medium" onPress={() => handleAction('moderation:revision:approve')} disabled={acting}>
                  Approve
                </WoolButton>

                <WoolButton variant="secondary" size="medium" onPress={() => handleAction('moderation:revision:return')} disabled={acting || !actionNote.trim()}>
                  Return
                </WoolButton>
              </>
            )}

            {isComment && (
              <>
                <WoolButton variant="green" size="medium" onPress={() => handleAction('moderation:comment:approve')} disabled={acting}>
                  Approve
                </WoolButton>

                <WoolButton variant="secondary" size="medium" onPress={() => handleAction('moderation:comment:return')} disabled={acting}>
                  Remove
                </WoolButton>
              </>
            )}

            <WoolButton variant="coral" size="medium" onPress={() => handleAction('moderation:item:flag')} disabled={acting}>
              Flag for Admin
            </WoolButton>

            {isRevision && shopItem?.shopStatus === 'in-shop' && (
              <WoolButton variant="blue" size="medium" onPress={() => handleAction('moderation:item:requestPlatformApproval')} disabled={acting}>
                Request Platform Approval
              </WoolButton>
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
  metaText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.1)',
  },
  panelLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  textContent: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
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
  actionLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 8,
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
    minHeight: 60,
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

export default ModerationReviewItem;
