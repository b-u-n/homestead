import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import AvatarStamp from '../AvatarStamp';
import Heart from '../Heart';
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

const REVISION_STATUS = {
  'pending': { label: 'Pending', color: '#9E9E9E' },
  'approved': { label: 'Approved', color: '#4CAF50' },
  'returned': { label: 'Returned', color: '#FF9800' },
  'superseded': { label: 'Superseded', color: '#BDBDBD' },
};

const BazaarSubmissionDetail = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revising, setRevising] = useState(false);
  const [revisionImagePreview, setRevisionImagePreview] = useState(null);
  const [revisionImageData, setRevisionImageData] = useState(null);
  const [commenting, setCommenting] = useState(false);
  const fileInputRef = useRef(null);
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  const itemId = accumulatedData?.['drawingBoard:mySubmissions']?.itemId || input?.itemId;

  const [revisionNote, setRevisionNote] = useState('');
  const [commentContent, setCommentContent] = useState('');

  const webInputStyle = {
    fontFamily: 'Comfortaa',
    fontSize: FontSettingsStore.getScaledFontSize(14),
    color: FontSettingsStore.getFontColor('#2D2C2B'),
    padding: 8,
    borderRadius: 6,
    border: '1px solid rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  };

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    if (!WebSocketService.socket || !itemId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('bazaar:submission:get', { itemId });
      setItem(result || null);
    } catch (error) {
      console.error('Error loading item:', error);
      ErrorStore.addError(error.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionImagePick = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      ErrorStore.addError('Image must be 5MB or less');
      return;
    }

    if (file.type !== 'image/png' && file.type !== 'image/gif') {
      ErrorStore.addError('Please select a PNG or GIF file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setRevisionImagePreview(e.target.result);
      setRevisionImageData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRevision = async () => {
    if (!revisionImageData) {
      ErrorStore.addError('Please select an image for the revision');
      return;
    }

    try {
      setRevising(true);
      await WebSocketService.emit('bazaar:submission:revise', {
        sessionId: SessionStore.sessionId,
        itemId,
        content: revisionImageData,
        note: revisionNote.trim() || undefined,
      });

      setRevisionNote('');
      setRevisionImagePreview(null);
      setRevisionImageData(null);
      loadItem();
    } catch (error) {
      console.error('Error submitting revision:', error);
      ErrorStore.addError(error.message || 'Failed to submit revision');
    } finally {
      setRevising(false);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) {
      ErrorStore.addError('Please enter a comment');
      return;
    }

    try {
      setCommenting(true);
      await WebSocketService.emit('bazaar:submission:comment', {
        sessionId: SessionStore.sessionId,
        itemId,
        content: commentContent.trim()
      });
      setCommentContent('');
    } catch (error) {
      console.error('Error commenting:', error);
      ErrorStore.addError(error.message || 'Failed to submit comment');
    } finally {
      setCommenting(false);
    }
  };

  if (loading || !item) {
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

  const approvedRevision = item.currentApprovedRevisionIndex !== null
    ? item.revisions[item.currentApprovedRevisionIndex]
    : null;

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        {/* Current approved content */}
        {approvedRevision?.contentUrl && (
          <>
            <img
              src={resolveAvatarUrl(approvedRevision.contentUrl)}
              style={{
                alignSelf: 'center',
                maxWidth: '100%',
                maxHeight: 240,
                borderRadius: 10,
                border: '2px dashed rgba(112, 68, 199, 0.5)',
                display: 'block',
              }}
            />
            <View style={{ height: 12 }} />
          </>
        )}

        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.title, {
            fontSize: FontSettingsStore.getScaledFontSize(20),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            {item.title}
          </Text>

          {item.description && (
            <Text style={[styles.description, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              {item.description}
            </Text>
          )}

          <View style={styles.statsRow}>
            <Text style={[styles.statText, {
              fontSize: FontSettingsStore.getScaledFontSize(12),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              {item.storeType}
            </Text>
            {item.shopStatus === 'in-shop' && (
              <>
                <Text style={[styles.statText, {
                  fontSize: FontSettingsStore.getScaledFontSize(12),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  · {item.purchaseCount} sold
                </Text>
                <View style={styles.priceRow}>
                  <Heart size={14} />
                  <Text style={[styles.statText, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#2D2C2B')
                  }]}>
                    {item.price}
                  </Text>
                </View>
              </>
            )}
          </View>
        </MinkyPanel>

        <View style={{ height: 12 }} />

        {/* Revision history */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(15),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Revision History
          </Text>

          {item.revisions.map((rev, idx) => {
            const statusInfo = REVISION_STATUS[rev.status] || REVISION_STATUS['pending'];
            return (
              <View key={idx} style={styles.revisionItem}>
                <View style={styles.revisionHeader}>
                  <Text style={[styles.revisionNum, {
                    fontSize: FontSettingsStore.getScaledFontSize(13),
                    color: FontSettingsStore.getFontColor('#2D2C2B')
                  }]}>
                    {idx === 0 ? 'Original' : `Revision ${idx}`}
                  </Text>
                  <View style={[styles.revisionBadge, { backgroundColor: statusInfo.color + '33' }]}>
                    <Text style={[styles.revisionBadgeText, {
                      fontSize: FontSettingsStore.getScaledFontSize(10),
                      color: statusInfo.color
                    }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                  <Text style={[styles.revisionTime, {
                    fontSize: FontSettingsStore.getScaledFontSize(10),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    {formatTimeAgo(rev.createdAt)}
                  </Text>
                </View>

                {rev.contentUrl && (
                  <img
                    src={resolveAvatarUrl(rev.contentUrl)}
                    style={{
                      alignSelf: 'center',
                      maxWidth: '100%',
                      maxHeight: 120,
                      borderRadius: 6,
                      border: '2px dashed rgba(112, 68, 199, 0.5)',
                      display: 'block',
                      marginTop: 8,
                    }}
                  />
                )}

                {rev.note && (
                  <Text style={[styles.revisionNote, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    Note: {rev.note}
                  </Text>
                )}

                {rev.reviewNote && (
                  <Text style={[styles.reviewNote, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#E65100')
                  }]}>
                    Reviewer: {rev.reviewNote}
                  </Text>
                )}
              </View>
            );
          })}
        </MinkyPanel>

        <View style={{ height: 12 }} />

        {/* Submit revision */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(15),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Submit Revision
          </Text>

          {revisionImagePreview && (
            <img
              src={revisionImagePreview}
              style={{
                alignSelf: 'center',
                maxWidth: '100%',
                maxHeight: 140,
                borderRadius: 10,
                border: '2px dashed rgba(112, 68, 199, 0.5)',
                display: 'block',
                marginBottom: 10,
              }}
            />
          )}

          <View style={styles.pickButtonRow}>
            <WoolButton variant="blue" size="small" onPress={handleRevisionImagePick}>
              {revisionImagePreview ? 'Change Image' : 'Choose Image'}
            </WoolButton>
          </View>

          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}

          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Note for reviewer (optional)"
              maxLength={1000}
              style={webInputStyle}
            />
          ) : (
            <TextInput
              style={[styles.input, {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}
              placeholder="Note for reviewer (optional)"
              placeholderTextColor="rgba(92, 90, 88, 0.5)"
              value={revisionNote}
              onChangeText={setRevisionNote}
              maxLength={1000}
            />
          )}

          <View style={styles.submitRow}>
            <WoolButton
              variant="purple"
              size="medium"
              onPress={handleSubmitRevision}
              disabled={revising || !revisionImageData}
            >
              {revising ? 'Submitting...' : 'Submit Revision'}
            </WoolButton>
          </View>
        </MinkyPanel>

        <View style={{ height: 12 }} />

        {/* Comments */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(15),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Comments
          </Text>

          {item.comments && item.comments.length > 0 ? (
            <View style={styles.commentList}>
              {item.comments.map((comment, idx) => (
                <View key={comment._id || idx} style={styles.commentItem}>
                  <AvatarStamp
                    avatarUrl={comment.user?.avatar}
                    avatarColor={comment.user?.color || '#7044C7'}
                    size={isMobile ? 24 : 30}
                    borderRadius={4}
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentName, {
                        fontSize: FontSettingsStore.getScaledFontSize(12),
                        color: FontSettingsStore.getFontColor('#2D2C2B')
                      }]}>
                        {comment.user?.name}
                      </Text>
                      <Text style={[styles.commentTime, {
                        fontSize: FontSettingsStore.getScaledFontSize(10),
                        color: FontSettingsStore.getFontColor('#454342')
                      }]}>
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.commentText, {
                      fontSize: FontSettingsStore.getScaledFontSize(13),
                      color: FontSettingsStore.getFontColor('#2D2C2B')
                    }]}>
                      {comment.content}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noComments, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              No comments yet
            </Text>
          )}

          <View style={styles.commentInputRow}>
            {Platform.OS === 'web' ? (
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
                maxLength={5000}
                style={{ ...webInputStyle, flex: 1, minHeight: 40, maxHeight: 100, resize: 'none' }}
              />
            ) : (
              <TextInput
                style={[styles.commentInput, {
                  fontSize: FontSettingsStore.getScaledFontSize(13),
                  color: FontSettingsStore.getFontColor('#2D2C2B')
                }]}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(92, 90, 88, 0.5)"
                value={commentContent}
                onChangeText={setCommentContent}
                multiline
                maxLength={5000}
              />
            )}
            <WoolButton
              variant="blue"
              size="small"
              onPress={handleComment}
              disabled={commenting || !commentContent.trim()}
            >
              {commenting ? '...' : 'Send'}
            </WoolButton>
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
  description: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  sectionTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.1)',
  },
  revisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  revisionNum: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionBadge: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  revisionBadgeText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionTime: {
    fontFamily: 'Comfortaa',
    marginLeft: 'auto',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  reviewNote: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pickButtonRow: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'Comfortaa',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
  },
  submitRow: {
    alignSelf: 'center',
    marginTop: 12,
  },
  commentList: {
    gap: 10,
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 8,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  commentName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  commentTime: {
    fontFamily: 'Comfortaa',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  commentText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  noComments: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'Comfortaa',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    minHeight: 40,
    maxHeight: 100,
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

export default BazaarSubmissionDetail;
