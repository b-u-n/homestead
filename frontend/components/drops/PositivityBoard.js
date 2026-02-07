import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
import AvatarStamp from '../AvatarStamp';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import Heart from '../Heart';
import HeartPaymentModal from '../HeartPaymentModal';
import Scrollbar from '../Scrollbar';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

/**
 * PositivityBoard Drop
 * Single-screen positivity board for Wishing Well.
 * Shows sort buttons, scrollable post list with accordion expand,
 * inline replies, compose box at bottom, and tipping via HeartPaymentModal.
 */
const PositivityBoard = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack,
  flowName: propFlowName,
  dropId
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('date-desc');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [selectedPostForTip, setSelectedPostForTip] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({ offset: 0, visible: 0, content: 0 });
  const scrollRef = useRef(null);

  const flowName = context?.flowName || propFlowName || 'wishingWell';
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  // Compose form persistence
  const composeFormKey = `${flowName}:newPost`;
  const composeContent = FormStore.getField(composeFormKey, 'content') || '';
  const setComposeContent = (value) => FormStore.setField(composeFormKey, 'content', value);

  useEffect(() => {
    loadPosts();

    if (WebSocketService.socket) {
      WebSocketService.socket.on(`${flowName}:newPost`, loadPosts);
      WebSocketService.socket.on(`${flowName}:postUpdated`, loadPosts);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off(`${flowName}:newPost`, loadPosts);
        WebSocketService.socket.off(`${flowName}:postUpdated`, loadPosts);
      }
    };
  }, [sort]);

  const loadPosts = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit(`${flowName}:posts:get`, { sort });
      setPosts(result || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      ErrorStore.addError(error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostToggle = (postId) => {
    setExpandedPostId(prev => prev === postId ? null : postId);
  };

  const handleTipPress = (post) => {
    setSelectedPostForTip(post);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = async (paymentData) => {
    const { amount, source } = paymentData;

    try {
      await WebSocketService.emit(`${flowName}:posts:tip`, {
        sessionId: SessionStore.sessionId,
        postId: selectedPostForTip._id,
        amount,
        source
      });

      setIsPaymentModalOpen(false);
      setSelectedPostForTip(null);
      loadPosts();
    } catch (error) {
      console.error('Error tipping:', error);
      ErrorStore.addError(error.message || 'Failed to tip');
    }
  };

  const handleSubmitPost = async () => {
    if (!composeContent.trim()) {
      ErrorStore.addError('Please enter your message');
      return;
    }

    if (composeContent.length > 500) {
      ErrorStore.addError('Message must be 500 characters or less');
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    try {
      setIsSubmittingPost(true);
      await WebSocketService.emit(`${flowName}:posts:create`, {
        sessionId: SessionStore.sessionId,
        content: composeContent.trim()
      });

      FormStore.resetForm(composeFormKey);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      ErrorStore.addError(error.message || 'Failed to create message');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleSubmitReply = async (postId) => {
    const replyFormKey = `response:${postId}`;
    const replyContent = FormStore.getField(replyFormKey, 'content') || '';

    if (!replyContent.trim()) {
      ErrorStore.addError('Please enter your response');
      return;
    }

    if (replyContent.length > 5000) {
      ErrorStore.addError('Response must be 5000 characters or less');
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    try {
      setIsSubmittingReply(true);
      await WebSocketService.emit(`${flowName}:posts:addResponse`, {
        sessionId: SessionStore.sessionId,
        postId,
        content: replyContent.trim()
      });

      FormStore.resetForm(replyFormKey);
      loadPosts();
    } catch (error) {
      console.error('Error submitting response:', error);
      ErrorStore.addError(error.message || 'Failed to submit response');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderResponse = (response, index) => {
    const avatarSize = isMobile ? 28 : 36;

    return (
      <View key={response._id || index} style={styles.responseItem}>
        <AvatarStamp
          avatarUrl={response.user?.avatar}
          avatarColor="#7044C7"
          size={avatarSize}
          borderRadius={5}
        />
        <View style={styles.responseContent}>
          <View style={styles.responseHeader}>
            <Text style={[styles.responseName, { fontSize: FontSettingsStore.getScaledFontSize(13), color: FontSettingsStore.getFontColor('#403F3E') }]}>
              {response.user?.name}
            </Text>
            <Text style={[styles.responseTime, { fontSize: FontSettingsStore.getScaledFontSize(11), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
              {formatTimeAgo(response.createdAt)}
            </Text>
          </View>
          <Text style={[styles.responseText, { fontSize: FontSettingsStore.getScaledFontSize(13), lineHeight: FontSettingsStore.getScaledSpacing(18), color: FontSettingsStore.getFontColor('#403F3E') }]}>
            {response.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderExpandedContent = (post) => {
    const replyFormKey = `response:${post._id}`;
    const replyContent = FormStore.getField(replyFormKey, 'content') || '';
    const setReplyContent = (value) => FormStore.setField(replyFormKey, 'content', value);
    const responses = post.responses || [];

    return (
      <View style={styles.expandedSection}>
        {/* Tip button */}
        <View style={styles.tipRow}>
          <WoolButton
            onPress={() => handleTipPress(post)}
            variant="purple"
            size="small"
          >
            Tip Hearts
          </WoolButton>
        </View>

        {/* Responses */}
        <View style={styles.responsesSection}>
          <Text style={[styles.responsesTitle, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.82)') }]}>
            Responses
          </Text>
          {responses.length > 0 ? (
            responses.map(renderResponse)
          ) : (
            <Text style={[styles.noResponses, { fontSize: FontSettingsStore.getScaledFontSize(13), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
              No responses yet
            </Text>
          )}
        </View>

        {/* Inline reply input */}
        <View style={styles.replyInputContainer}>
          {Platform.OS === 'web' ? (
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a kind response..."
              maxLength={5000}
              style={{
                fontFamily: 'Comfortaa',
                fontSize: FontSettingsStore.getScaledFontSize(13),
                padding: 8,
                borderRadius: 6,
                border: '1px solid rgba(92, 90, 88, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                outline: 'none',
                resize: 'none',
                width: '100%',
                minHeight: isMobile ? 60 : 70,
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            />
          ) : (
            <TextInput
              value={replyContent}
              onChangeText={setReplyContent}
              placeholder="Write a kind response..."
              multiline
              maxLength={5000}
              style={[styles.replyTextInput, { minHeight: isMobile ? 60 : 70 }]}
            />
          )}
          <View style={styles.replyFooter}>
            <Text style={[styles.charCount, { fontSize: FontSettingsStore.getScaledFontSize(10), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
              {replyContent.length}/5000
            </Text>
            <WoolButton
              onPress={() => handleSubmitReply(post._id)}
              disabled={isSubmittingReply || !replyContent.trim()}
              variant="purple"
              size="small"
            >
              {isSubmittingReply ? 'Sending...' : 'Send'}
            </WoolButton>
          </View>
        </View>
      </View>
    );
  };

  const renderPost = (post) => {
    const isExpanded = expandedPostId === post._id;
    const hasResponses = post.responses && post.responses.length > 0;

    return (
      <View
        key={post._id}
        style={styles.postWrapper}
      >
        <MinkyPanel
          borderRadius={8}
          padding={12}
          paddingTop={12}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          <Pressable onPress={() => handlePostToggle(post._id)}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <AvatarStamp
                  avatarUrl={post.user?.avatar}
                  avatarColor={post.user?.color}
                  size={32}
                  borderRadius={5}
                />
                <Text style={[styles.authorName, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#403F3E') }]}>
                  {post.user?.name}
                </Text>
              </View>
              <View style={styles.heartsRow}>
                <Text style={[styles.hearts, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#403F3E') }]}>
                  {post.totalTips || 0}
                </Text>
                <Heart size={FontSettingsStore.getScaledFontSize(16)} />
              </View>
            </View>

            {/* Post Content */}
            <Text
              style={[styles.postContent, { fontSize: FontSettingsStore.getScaledFontSize(15), lineHeight: FontSettingsStore.getScaledSpacing(21), color: FontSettingsStore.getFontColor('#403F3E') }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {post.content}
            </Text>

            {/* Post Footer */}
            <View style={styles.postFooter}>
              <Text style={[styles.date, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.85)') }]}>
                {formatTimeAgo(post.createdAt)}
              </Text>
              <Text style={[styles.responseCount, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.85)') }]}>
                {hasResponses ? `${post.responses.length} response${post.responses.length > 1 ? 's' : ''}` : 'No responses yet'}
              </Text>
            </View>
          </Pressable>

          {/* Expanded content */}
          {isExpanded && renderExpandedContent(post)}
        </MinkyPanel>
      </View>
    );
  };

  const sortOptions = [
    { value: 'date-desc', label: 'Newest' },
    { value: 'date-asc', label: 'Oldest' },
    { value: 'value-desc', label: 'Most Hearts' },
    { value: 'value-asc', label: 'Least Hearts' },
  ];

  return (
    <View style={styles.container}>
      {/* Sort Buttons */}
      {isMobile ? (
        <View style={styles.sortGrid}>
          {[
            [sortOptions[0], sortOptions[1]],
            [sortOptions[2], sortOptions[3]],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.sortGridRow}>
              {row.map((s) => (
                <WoolButton
                  key={s.value}
                  onPress={() => setSort(s.value)}
                  variant="purple"
                  size="small"
                  focused={sort === s.value}
                  style={{ flex: 1 }}
                >
                  {s.label}
                </WoolButton>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.sortButtons}>
          {sortOptions.map((s) => (
            <WoolButton
              key={s.value}
              onPress={() => setSort(s.value)}
              variant="purple"
              size="small"
              focused={sort === s.value}
            >
              {s.label}
            </WoolButton>
          ))}
        </View>
      )}

      {/* Scrollable Post List */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollRef}
          style={styles.postsList}
          contentContainerStyle={styles.postsListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => setScrollMetrics({
            offset: e.nativeEvent.contentOffset.y,
            visible: e.nativeEvent.layoutMeasurement.height,
            content: e.nativeEvent.contentSize.height,
          })}
          onLayout={(e) => setScrollMetrics(prev => ({
            ...prev,
            visible: e.nativeEvent.layout.height,
          }))}
          onContentSizeChange={(w, h) => setScrollMetrics(prev => ({
            ...prev,
            content: h,
          }))}
          scrollEventThrottle={16}
        >
          {loading ? (
            <MinkyPanel
              borderRadius={8}
              padding={FontSettingsStore.getScaledSpacing(20)}
              paddingTop={FontSettingsStore.getScaledSpacing(20)}
              overlayColor="rgba(112, 68, 199, 0.2)"
            >
              <Text style={[styles.statusText, { fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
                Loading posts...
              </Text>
            </MinkyPanel>
          ) : posts.length === 0 ? (
            <MinkyPanel
              borderRadius={8}
              padding={FontSettingsStore.getScaledSpacing(20)}
              paddingTop={FontSettingsStore.getScaledSpacing(20)}
              overlayColor="rgba(112, 68, 199, 0.2)"
            >
              <Text style={[styles.statusText, { fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
                No wishes yet. Be the first to share something positive!
              </Text>
            </MinkyPanel>
          ) : (
            posts.map(renderPost)
          )}
        </ScrollView>
        <Scrollbar
          contentHeight={scrollMetrics.content}
          visibleHeight={scrollMetrics.visible}
          scrollOffset={scrollMetrics.offset}
          onScroll={(offset) => scrollRef.current?.scrollTo({ y: offset, animated: false })}
          thumbOverlayColor="rgba(135, 180, 210, 0.5)"
          overlayColor="rgba(112, 68, 199, 0.25)"
          style={{ marginLeft: 4 }}
        />
      </View>

      {/* Compose Box (pinned at bottom) */}
      <MinkyPanel
        borderRadius={8}
        padding={10}
        paddingTop={10}
        overlayColor="rgba(112, 68, 199, 0.2)"
      >
        <View style={styles.composeRow}>
          {Platform.OS === 'web' ? (
            <textarea
              value={composeContent}
              onChange={(e) => setComposeContent(e.target.value)}
              placeholder="Share something positive..."
              maxLength={500}
              style={{
                fontFamily: 'Comfortaa',
                fontSize: FontSettingsStore.getScaledFontSize(14),
                padding: 8,
                borderRadius: 6,
                border: '1px solid rgba(92, 90, 88, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                outline: 'none',
                resize: 'none',
                flex: 1,
                minHeight: isMobile ? 40 : 50,
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            />
          ) : (
            <TextInput
              value={composeContent}
              onChangeText={setComposeContent}
              placeholder="Share something positive..."
              multiline
              maxLength={500}
              style={[styles.composeTextInput, { minHeight: isMobile ? 40 : 50 }]}
            />
          )}
          <View style={styles.composeActions}>
            <Text style={[styles.charCount, { fontSize: FontSettingsStore.getScaledFontSize(10), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
              {composeContent.length}/500
            </Text>
            <WoolButton
              onPress={handleSubmitPost}
              disabled={isSubmittingPost || !composeContent.trim()}
              variant="purple"
              size="small"
            >
              {isSubmittingPost ? 'Posting...' : 'Post'}
            </WoolButton>
          </View>
        </View>
      </MinkyPanel>

      {/* Heart Payment Modal */}
      <HeartPaymentModal
        visible={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPostForTip(null);
        }}
        onComplete={handlePaymentComplete}
        paymentInfo={{
          recipient: selectedPostForTip?.user?.name,
          purpose: 'Tip for post'
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  // Sort buttons
  sortGrid: {
    gap: 6,
  },
  sortGridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  // Post list
  scrollWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  postsList: {
    flex: 1,
  },
  postsListContent: {
    gap: 10,
    paddingBottom: 4,
    paddingRight: 8,
    overflow: 'visible',
  },
  postWrapper: {
    overflow: 'visible',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hearts: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  postContent: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    lineHeight: 21,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.85)',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  responseCount: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.85)',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  // Expanded section
  expandedSection: {
    marginTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.15)',
    paddingTop: 10,
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  responsesSection: {
    gap: 8,
  },
  responsesTitle: {
    fontSize: 14,
    fontFamily: 'SuperStitch',
    color: 'rgba(64, 63, 62, 0.82)',
    opacity: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  noResponses: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  responseItem: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.1)',
  },
  responseContent: {
    flex: 1,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  responseName: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  responseTime: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
  },
  responseText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    lineHeight: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  // Reply input
  replyInputContainer: {
    gap: 4,
  },
  replyTextInput: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  replyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Compose box
  composeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  composeTextInput: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  composeActions: {
    alignItems: 'center',
    gap: 4,
  },
  charCount: {
    fontSize: 10,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'right',
  },
});

export default PositivityBoard;
