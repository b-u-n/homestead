import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Linking } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import ProfileStore from '../../stores/ProfileStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import AvatarStamp from '../AvatarStamp';
import Heart from '../Heart';
import { resolveAvatarUrl } from '../../utils/domain';
import { PLATFORM_ASSETS } from '../../constants/platformAssets';

const resolveAssetUri = (asset) => typeof asset === 'string' ? asset : (asset?.default || asset?.uri || asset);

const sanitizeUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.includes('://')) {
    return 'https://' + trimmed.split('://').slice(1).join('://');
  }
  return 'https://' + trimmed;
};

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

const BazaarItemDetail = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  const itemId = accumulatedData?.['mapSpritesStall:shop']?.itemId
    || accumulatedData?.['mailbox:list']?.itemId
    || input?.itemId;

  useEffect(() => {
    loadItem();

    if (WebSocketService.socket) {
      WebSocketService.socket.on('bazaar:submissionUpdated', handleUpdate);
      WebSocketService.socket.on('bazaar:newPurchase', handleUpdate);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off('bazaar:submissionUpdated', handleUpdate);
        WebSocketService.socket.off('bazaar:newPurchase', handleUpdate);
      }
    };
  }, [itemId]);

  const handleUpdate = (data) => {
    if (data.itemId === itemId) {
      loadItem();
    }
  };

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

  const handlePurchase = async () => {
    if (!WebSocketService.socket) return;

    try {
      setPurchasing(true);
      const result = await WebSocketService.emit('bazaar:submission:purchase', {
        sessionId: SessionStore.sessionId,
        itemId
      });
      if (result) {
        if (result.buyerBalance) {
          if (result.buyerBalance.hearts !== undefined) ProfileStore.setHearts(result.buyerBalance.hearts);
          if (result.buyerBalance.heartBank !== undefined) ProfileStore.setHeartBank(result.buyerBalance.heartBank);
        }
        loadItem();
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      ErrorStore.addError(error.message || 'Failed to purchase item');
    } finally {
      setPurchasing(false);
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

  if (!item) {
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

  const approvedRevision = item.currentApprovedRevisionIndex !== null
    ? item.revisions[item.currentApprovedRevisionIndex]
    : null;

  const platformAsset = item.platformAssetId
    ? PLATFORM_ASSETS.find(a => a.id === item.platformAssetId)
    : null;

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        {/* Image + Replaces comparison */}
        {approvedRevision?.contentUrl && (
          <>
            {platformAsset ? (
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>Current</Text>
                  {platformAsset.image ? (
                    <img
                      src={resolveAssetUri(platformAsset.image)}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        border: '2px dashed rgba(112, 68, 199, 0.5)',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      border: '2px dashed rgba(112, 68, 199, 0.5)',
                      backgroundColor: 'rgba(112, 68, 199, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={[styles.comparisonPlaceholderText, {
                        fontSize: FontSettingsStore.getScaledFontSize(16),
                        color: FontSettingsStore.getFontColor('#7044C7')
                      }]}>{platformAsset.name.charAt(0)}</Text>
                    </div>
                  )}
                  <Text style={[styles.comparisonName, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]} numberOfLines={1}>{platformAsset.name}</Text>
                </View>
                <Text style={[styles.comparisonArrow, {
                  fontSize: FontSettingsStore.getScaledFontSize(20),
                  color: FontSettingsStore.getFontColor('#7044C7')
                }]}>→</Text>
                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>Upgrade</Text>
                  <img
                    src={resolveAvatarUrl(approvedRevision.contentUrl)}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      border: '2px dashed rgba(112, 68, 199, 0.5)',
                      objectFit: 'contain',
                    }}
                  />
                </View>
              </View>
            ) : (
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
            )}
            <View style={{ height: 12 }} />
          </>
        )}

        {/* Title + Info */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.title, {
              fontSize: FontSettingsStore.getScaledFontSize(20),
              color: FontSettingsStore.getFontColor('#2D2C2B'),
              flex: 1,
            }]}>
              {item.title}
            </Text>
            <View style={[styles.getRow, { marginRight: 12 }]}>
              <Heart size={16} />
              <Text style={[styles.priceText, {
                fontSize: FontSettingsStore.getScaledFontSize(15),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                {item.price}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.description, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              {item.description}
            </Text>
          )}

          <View style={styles.artistRow}>
            <AvatarStamp
              avatarUrl={item.user?.avatar}
              avatarColor={item.user?.color || '#7044C7'}
              size={36}
              borderRadius={5}
            />
            <Text style={[styles.artistName, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#2D2C2B')
            }]}>
              {item.user?.name}
            </Text>
            <View style={{ flex: 1 }} />
            <WoolButton variant="cyan" size="small" onPress={handlePurchase} disabled={purchasing}>
              {purchasing ? '...' : 'Get'}
            </WoolButton>
          </View>

          {item.platformStatus === 'approved-for-platform' && (
            <View style={styles.platformBadge}>
              <Text style={[styles.platformBadgeText, {
                fontSize: FontSettingsStore.getScaledFontSize(11)
              }]}>
                Platform Approved
              </Text>
            </View>
          )}

          {/* Attribution */}
          {item.copyright && item.copyright.attribution !== 'none' && (
            <View style={styles.attributionSection}>
              <Text style={[styles.attributionHeader, {
                fontSize: FontSettingsStore.getScaledFontSize(12),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                Attribution
              </Text>
              {item.copyright.attribution === 'real-name' && item.copyright.realName ? (
                <Text style={[styles.attributionText, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  Artist: {item.copyright.realName}
                </Text>
              ) : item.copyright.attribution === 'username' ? (
                <Text style={[styles.attributionText, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  Artist: {item.user?.name}
                </Text>
              ) : null}
              {item.copyright.attributionLink && (
                <View style={styles.attributionRow}>
                  <Text style={[styles.attributionText, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    Website:{' '}
                  </Text>
                  <Text
                    style={[styles.attributionLink, {
                      fontSize: FontSettingsStore.getScaledFontSize(11),
                      color: FontSettingsStore.getFontColor('#7044C7')
                    }]}
                    onPress={() => Linking.openURL(sanitizeUrl(item.copyright.attributionLink))}
                  >
                    {item.copyright.attributionLink}
                  </Text>
                </View>
              )}
              {item.copyright.contactInfo && (
                <View style={styles.attributionRow}>
                  <Text style={[styles.attributionText, {
                    fontSize: FontSettingsStore.getScaledFontSize(11),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    Contact:{' '}
                  </Text>
                  <Text
                    style={[styles.attributionLink, {
                      fontSize: FontSettingsStore.getScaledFontSize(11),
                      color: FontSettingsStore.getFontColor('#7044C7')
                    }]}
                    onPress={() => Linking.openURL('mailto:' + item.copyright.contactInfo)}
                  >
                    {item.copyright.contactInfo}
                  </Text>
                </View>
              )}
            </View>
          )}
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

          <Text style={[styles.commentGuidance, {
            fontSize: FontSettingsStore.getScaledFontSize(12),
            lineHeight: FontSettingsStore.getScaledSpacing(18),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Start with something you like, share any thoughts, and end on something positive.
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
                      lineHeight: FontSettingsStore.getScaledSpacing(18),
                      color: FontSettingsStore.getFontColor('#2D2C2B')
                    }]}>
                      {comment.content}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Comment input */}
          <View style={styles.commentInputRow}>
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
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  comparisonItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  comparisonLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  comparisonPlaceholderText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  comparisonName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  comparisonArrow: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  getRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  platformBadgeText: {
    fontFamily: 'Comfortaa',
    color: '#2E7D32',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
  commentGuidance: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginTop: 8,
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
  attributionSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.1)',
    gap: 3,
  },
  attributionHeader: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  attributionText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  attributionLink: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textDecorationLine: 'underline',
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

export default BazaarItemDetail;
