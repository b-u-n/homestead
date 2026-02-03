import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import profileStore from '../../stores/ProfileStore';
import uxStore from '../../stores/UXStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import AvatarStamp from '../AvatarStamp';
import Heart from '../Heart';
import Scrollbar from '../Scrollbar';

// Helper to convert hex color to rgba
const hexToRgba = (hexColor, opacity = 0.15) => {
  if (!hexColor) return `rgba(112, 68, 199, ${opacity})`;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * RespondToPost Drop
 * Form for responding to a wish
 */
const RespondToPost = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [post, setPost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileScrollMetrics, setMobileScrollMetrics] = useState({ offset: 0, visible: 0, content: 0 });
  const [responsesScrollMetrics, setResponsesScrollMetrics] = useState({ offset: 0, visible: 0, content: 0 });
  const [rightPanelScrollMetrics, setRightPanelScrollMetrics] = useState({ offset: 0, visible: 0, content: 0 });
  const mobileScrollRef = useRef(null);
  const responsesScrollRef = useRef(null);
  const rightPanelScrollRef = useRef(null);
  const textareaRef = useRef(null);

  const flowName = context?.flowName || 'wishingWell';
  const postId = input[`${flowName}:list`]?.postId || input['wishingWell:list']?.postId || input['weepingWillow:list']?.postId || input.postId;

  // Get persisted form state scoped to this specific post
  const formKey = `response:${postId}`;
  const content = FormStore.getField(formKey, 'content') || '';
  const setContent = (value) => FormStore.setField(formKey, 'content', value);

  // Auto-resize textarea on mount and when content changes
  useEffect(() => {
    if (Platform.OS === 'web' && !loading) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = (textareaRef.current.scrollHeight + 8) + 'px';
        }
      });
    }
  }, [content, loading]);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    if (!WebSocketService.socket || !postId) {
      setLoading(false);
      return;
    }

    try {
      const posts = await WebSocketService.emit(`${flowName}:posts:get`, {});
      const foundPost = (posts || []).find(p => p._id === postId);
      if (foundPost) {
        setPost(foundPost);
      } else {
        ErrorStore.addError('Post not found');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      ErrorStore.addError(error.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      ErrorStore.addError('Please enter your response');
      return;
    }

    if (content.length > 5000) {
      ErrorStore.addError('Response must be 5000 characters or less');
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    try {
      setIsSubmitting(true);

      const flowName = context?.flowName || 'wishingWell';
      const result = await WebSocketService.emit(`${flowName}:posts:addResponse`, {
        sessionId: SessionStore.sessionId,
        postId,
        content: content.trim()
      });

      if (result.hearts !== undefined) {
        profileStore.setHearts(result.hearts);
      }
      if (result.heartBank !== undefined) {
        profileStore.setHeartBank(result.heartBank);
      }

      FormStore.resetForm(formKey);
      await loadPost();

      setTimeout(() => {
        if (responsesScrollRef.current) {
          responsesScrollRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error submitting response:', error);
      ErrorStore.addError(error.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
        {canGoBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← BACK</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const isFirstResponse = !post.firstResponderId;
  const responses = post.responses || [];
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  // Mobile layout - everything in single scroll container
  if (isMobile) {
    return (
      <View style={styles.mobileScrollWrapper}>
        <ScrollView
          ref={mobileScrollRef}
          style={styles.mobileContainer}
          contentContainerStyle={styles.mobileContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => setMobileScrollMetrics({
            offset: e.nativeEvent.contentOffset.y,
            visible: e.nativeEvent.layoutMeasurement.height,
            content: e.nativeEvent.contentSize.height,
          })}
          onLayout={(e) => setMobileScrollMetrics(prev => ({
            ...prev,
            visible: e.nativeEvent.layout.height,
          }))}
          onContentSizeChange={(w, h) => setMobileScrollMetrics(prev => ({
            ...prev,
            content: h,
          }))}
          scrollEventThrottle={16}
        >
        {/* Post card */}
        <View style={styles.postCardWrapper}>
          <MinkyPanel
            borderRadius={6}
            padding={4}
            paddingTop={4}
            overlayColor="rgba(112, 68, 199, 0.2)"
            borderInset={-1}
            style={styles.heartsBadge}
          >
            <View style={styles.badgeContent}>
              <Heart size={12} />
              <Text style={[styles.heartsBadgeText, { fontSize: FontSettingsStore.getScaledFontSize(11), color: FontSettingsStore.getFontColor('#403F3E') }]}>{post.hearts}</Text>
            </View>
          </MinkyPanel>
          <MinkyPanel
            borderRadius={10}
            padding={12}
            paddingTop={12}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            <View style={styles.postHeader}>
              <AvatarStamp
                avatarUrl={post.user?.avatar}
                avatarColor="#7044C7"
                size={36}
                borderRadius={6}
              />
              <Text style={[styles.authorName, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}>{post.user?.name}</Text>
            </View>
            <Text style={[styles.postContent, { fontSize: FontSettingsStore.getScaledFontSize(13), lineHeight: FontSettingsStore.getScaledSpacing(18), color: FontSettingsStore.getFontColor('#403F3E') }]}>{post.content}</Text>
          </MinkyPanel>
        </View>

        {/* Reward box */}
        {isFirstResponse && (
          <View style={styles.rewardBoxWrapper}>
            <MinkyPanel
              borderRadius={6}
              padding={8}
              paddingTop={8}
              overlayColor="rgba(112, 68, 199, 0.2)"
            >
              <View style={styles.rewardBoxContent}>
                <Text style={[styles.rewardText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}>First response earns </Text>
                <Text style={[styles.rewardBold, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#7044C7') }]}>{post.hearts}</Text>
                <Heart size={14} />
                <Text style={[styles.rewardText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}>!</Text>
              </View>
            </MinkyPanel>
          </View>
        )}

        {/* Input */}
        <View style={styles.mobileInputContainer}>
          {Platform.OS === 'web' ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a thoughtful response..."
              maxLength={5000}
              style={{
                fontFamily: 'Comfortaa',
                fontSize: 14,
                padding: 10,
                borderRadius: 8,
                border: '1px solid rgba(92, 90, 88, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                outline: 'none',
                resize: 'none',
                width: '100%',
                minHeight: 120,
                boxSizing: 'border-box',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15), inset -1px 0 0 rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          ) : (
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write a thoughtful response..."
              multiline
              maxLength={5000}
              style={styles.textInput}
            />
          )}
          <Text style={styles.charCount}>{content.length}/5000</Text>
        </View>

        {/* Submit button */}
        <WoolButton
          onPress={handleSubmit}
          disabled={isSubmitting}
          variant="purple"
        >
          {isSubmitting ? 'SENDING...' : 'SEND RESPONSE'}
        </WoolButton>

        {/* Responses title */}
        <Text style={[styles.panelTitle, { marginTop: 16, fontSize: FontSettingsStore.getScaledFontSize(22), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.82)') }]}>Responses</Text>

        {/* Response cards */}
        {responses.length > 0 ? (
          responses.map((response, index) => (
            <View key={response._id || index} style={styles.responseCardWrapper}>
              {index === 0 && (
                <MinkyPanel
                  borderRadius={6}
                  padding={4}
                  paddingTop={4}
                  overlayColor="rgba(112, 68, 199, 0.2)"
                  borderInset={-1}
                  style={styles.firstBadge}
                >
                  <View style={styles.badgeContent}>
                    <Heart size={12} />
                    <Text style={[styles.firstBadgeText, { fontSize: FontSettingsStore.getScaledFontSize(10), color: FontSettingsStore.getFontColor('#403F3E') }]}>First Response</Text>
                  </View>
                </MinkyPanel>
              )}
              <MinkyPanel
                borderRadius={8}
                padding={0}
                paddingTop={0}
                overlayColor="rgba(112, 68, 199, 0.2)"
                style={styles.responseCard}
              >
                <View style={styles.responseInner}>
                  <AvatarStamp
                    avatarUrl={response.user?.avatar}
                    avatarColor="#7044C7"
                    size={40}
                    borderRadius={6}
                  />
                  <View style={styles.responseContent}>
                    <Text style={[styles.responseAuthor, { fontSize: FontSettingsStore.getScaledFontSize(15), color: FontSettingsStore.getFontColor('#403F3E') }]}>{response.user?.name}</Text>
                    <Text style={[styles.responseText, { fontSize: FontSettingsStore.getScaledFontSize(15), lineHeight: FontSettingsStore.getScaledSpacing(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>{response.content}</Text>
                  </View>
                </View>
              </MinkyPanel>
            </View>
          ))
        ) : (
          <MinkyPanel
            borderRadius={8}
            padding={20}
            paddingTop={20}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(13), color: FontSettingsStore.getFontColor('#5C5A58') }]}>Be the first to help!</Text>
          </MinkyPanel>
        )}
        </ScrollView>
        <Scrollbar
          contentHeight={mobileScrollMetrics.content}
          visibleHeight={mobileScrollMetrics.visible}
          scrollOffset={mobileScrollMetrics.offset}
          onScroll={(offset) => mobileScrollRef.current?.scrollTo({ y: offset, animated: false })}
          thumbOverlayColor="rgba(135, 180, 210, 0.5)"
          overlayColor="rgba(112, 68, 199, 0.25)"
          style={{ marginLeft: 4 }}
        />
      </View>
    );
  }

  // Desktop layout - horizontal with side-by-side panels
  return (
    <View style={styles.container}>
      {/* LEFT PANEL - Responses list with independent scroll */}
      <View style={styles.leftPanel}>
        <Text style={[styles.panelTitle, { fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.82)') }]}>Responses</Text>
        <View style={styles.responsesScrollWrapper}>
          <ScrollView
            ref={responsesScrollRef}
            style={styles.responsesScroll}
            contentContainerStyle={styles.responsesContent}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => setResponsesScrollMetrics({
              offset: e.nativeEvent.contentOffset.y,
              visible: e.nativeEvent.layoutMeasurement.height,
              content: e.nativeEvent.contentSize.height,
            })}
            onLayout={(e) => setResponsesScrollMetrics(prev => ({
              ...prev,
              visible: e.nativeEvent.layout.height,
            }))}
            onContentSizeChange={(w, h) => setResponsesScrollMetrics(prev => ({
              ...prev,
              content: h,
            }))}
            scrollEventThrottle={16}
          >
          {responses.length > 0 ? (
            responses.map((response, index) => (
              <View key={response._id || index} style={styles.responseCardWrapper}>
                {index === 0 && (
                  <MinkyPanel
                    borderRadius={6}
                    padding={4}
                    paddingTop={4}
                    overlayColor="rgba(112, 68, 199, 0.2)"
                    borderInset={-1}
                    style={styles.firstBadge}
                  >
                    <View style={styles.badgeContent}>
                      <Heart size={12} />
                      <Text style={[styles.firstBadgeText, { fontSize: FontSettingsStore.getScaledFontSize(10), color: FontSettingsStore.getFontColor('#403F3E') }]}>First Response</Text>
                    </View>
                  </MinkyPanel>
                )}
                <MinkyPanel
                  borderRadius={8}
                  padding={0}
                  paddingTop={0}
                  overlayColor="rgba(112, 68, 199, 0.2)"
                  style={styles.responseCard}
                >
                  <View style={styles.responseInner}>
                    <AvatarStamp
                      avatarUrl={response.user?.avatar}
                      avatarColor="#7044C7"
                      size={56}
                      borderRadius={6}
                    />
                    <View style={styles.responseContent}>
                      <Text style={[styles.responseAuthor, { fontSize: FontSettingsStore.getScaledFontSize(15), color: FontSettingsStore.getFontColor('#403F3E') }]}>{response.user?.name}</Text>
                      <Text style={[styles.responseText, { fontSize: FontSettingsStore.getScaledFontSize(15), lineHeight: FontSettingsStore.getScaledSpacing(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>{response.content}</Text>
                    </View>
                  </View>
                </MinkyPanel>
              </View>
            ))
          ) : (
            <MinkyPanel
              borderRadius={8}
              padding={20}
              paddingTop={20}
              overlayColor="rgba(112, 68, 199, 0.2)"
            >
              <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(13), color: FontSettingsStore.getFontColor('#5C5A58') }]}>Be the first to help!</Text>
            </MinkyPanel>
          )}
          </ScrollView>
          <Scrollbar
            contentHeight={responsesScrollMetrics.content}
            visibleHeight={responsesScrollMetrics.visible}
            scrollOffset={responsesScrollMetrics.offset}
            onScroll={(offset) => responsesScrollRef.current?.scrollTo({ y: offset, animated: false })}
            thumbOverlayColor="rgba(135, 180, 210, 0.5)"
            overlayColor="rgba(112, 68, 199, 0.25)"
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      {/* RIGHT PANEL - Original post and response form */}
      <View style={styles.rightPanel}>
        <View style={styles.rightPanelScrollWrapper}>
          <ScrollView
            ref={rightPanelScrollRef}
            style={styles.rightPanelScroll}
            contentContainerStyle={styles.rightPanelScrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => setRightPanelScrollMetrics({
              offset: e.nativeEvent.contentOffset.y,
              visible: e.nativeEvent.layoutMeasurement.height,
              content: e.nativeEvent.contentSize.height,
            })}
            onLayout={(e) => setRightPanelScrollMetrics(prev => ({
              ...prev,
              visible: e.nativeEvent.layout.height,
            }))}
            onContentSizeChange={(w, h) => setRightPanelScrollMetrics(prev => ({
              ...prev,
              content: h,
            }))}
            scrollEventThrottle={16}
          >
            <View style={styles.postCardWrapper}>
              <MinkyPanel
                borderRadius={6}
                padding={4}
                paddingTop={4}
                overlayColor="rgba(112, 68, 199, 0.2)"
                borderInset={-1}
                style={styles.heartsBadge}
              >
                <View style={styles.badgeContent}>
                  <Heart size={12} />
                  <Text style={[styles.heartsBadgeText, { fontSize: FontSettingsStore.getScaledFontSize(11), color: FontSettingsStore.getFontColor('#403F3E') }]}>{post.hearts}</Text>
                </View>
              </MinkyPanel>
              <MinkyPanel
                borderRadius={10}
                padding={12}
                paddingTop={12}
                overlayColor="rgba(112, 68, 199, 0.2)"
              >
                <View style={styles.postHeader}>
                  <AvatarStamp
                    avatarUrl={post.user?.avatar}
                    avatarColor="#7044C7"
                    size={48}
                    borderRadius={6}
                  />
                  <Text style={[styles.authorName, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#403F3E') }]}>{post.user?.name}</Text>
                </View>
                <Text style={[styles.postContent, { fontSize: FontSettingsStore.getScaledFontSize(15), lineHeight: FontSettingsStore.getScaledSpacing(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>{post.content}</Text>
              </MinkyPanel>
            </View>

            {isFirstResponse && (
              <View style={styles.rewardBoxWrapper}>
                <MinkyPanel
                  borderRadius={6}
                  padding={8}
                  paddingTop={8}
                  overlayColor="rgba(112, 68, 199, 0.2)"
                >
                  <View style={styles.rewardBoxContent}>
                    <Text style={[styles.rewardText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}>First response earns </Text>
                    <Text style={[styles.rewardBold, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#7044C7') }]}>{post.hearts}</Text>
                    <Heart size={14} />
                    <Text style={[styles.rewardText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#403F3E') }]}>!</Text>
                  </View>
                </MinkyPanel>
              </View>
            )}

            <View style={styles.inputContainer}>
              {Platform.OS === 'web' ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write a thoughtful response..."
                  maxLength={5000}
                  style={{
                    fontFamily: 'Comfortaa',
                    fontSize: 14,
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid rgba(92, 90, 88, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    outline: 'none',
                    resize: 'none',
                    width: '100%',
                    minHeight: 120,
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15), inset -1px 0 0 rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden',
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
              ) : (
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write a thoughtful response..."
                  multiline
                  maxLength={5000}
                  style={styles.textInput}
                />
              )}
              <Text style={styles.charCount}>{content.length}/5000</Text>
            </View>

            <WoolButton
              onPress={handleSubmit}
              disabled={isSubmitting}
              variant="purple"
            >
              {isSubmitting ? 'SENDING...' : 'SEND RESPONSE'}
            </WoolButton>
          </ScrollView>
          <Scrollbar
            contentHeight={rightPanelScrollMetrics.content}
            visibleHeight={rightPanelScrollMetrics.visible}
            scrollOffset={rightPanelScrollMetrics.offset}
            onScroll={(offset) => rightPanelScrollRef.current?.scrollTo({ y: offset, animated: false })}
            thumbOverlayColor="rgba(135, 180, 210, 0.5)"
            overlayColor="rgba(112, 68, 199, 0.25)"
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  // Mobile styles
  mobileScrollWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileContainer: {
    flex: 1,
  },
  mobileContent: {
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 20,
  },
  mobileInputContainer: {
    gap: 4,
  },
  mobileSection: {
    gap: 10,
  },
  postAndFormContainer: {
    gap: 10,
  },
  // Desktop styles
  leftPanel: {
    flex: 1,
  },
  responsesScrollWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  rightPanel: {
    flex: 1,
  },
  rightPanelScrollWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  rightPanelScroll: {
    flex: 1,
  },
  rightPanelScrollContent: {
    gap: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontFamily: 'SuperStitch',
    color: 'rgba(64, 63, 62, 0.82)',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  responsesScroll: {
    flex: 1,
  },
  responsesContent: {
    gap: 10,
    paddingBottom: 4,
    paddingTop: 8,
    paddingRight: 8,
    overflow: 'visible',
  },
  postCardWrapper: {
    position: 'relative',
    overflow: 'visible',
    marginTop: 8,
    marginRight: 8,
  },
  heartsBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  heartsBadgeText: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
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
  postContent: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rewardBoxWrapper: {
    marginLeft: 24,
    marginRight: 24,
  },
  rewardBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rewardBold: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inputContainer: {
    flex: 1,
    gap: 4,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlignVertical: 'top',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  charCount: {
    fontSize: 10,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  responseCard: {
    marginBottom: 0,
  },
  responseInner: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  responseContent: {
    flex: 1,
    justifyContent: 'center',
  },
  responseCardWrapper: {
    position: 'relative',
    overflow: 'visible',
    marginTop: 8,
    marginRight: 8,
  },
  firstBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  firstBadgeText: {
    fontSize: 10,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  responseAuthor: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(64, 63, 62, 0.3)',
    borderStyle: 'dashed',
    paddingBottom: 4,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default RespondToPost;
