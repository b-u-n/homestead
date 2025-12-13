import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import profileStore from '../../stores/ProfileStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import AvatarStamp from '../AvatarStamp';
import Heart from '../Heart';

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
  const responsesScrollRef = useRef(null);

  const flowName = context?.flowName || 'wishingWell';
  const postId = input[`${flowName}:list`]?.postId || input['wishingWell:list']?.postId || input['weepingWillow:list']?.postId || input.postId;

  // Get persisted form state scoped to this specific post
  const formKey = `response:${postId}`;
  const content = FormStore.getField(formKey, 'content') || '';
  const setContent = (value) => FormStore.setField(formKey, 'content', value);

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

    if (content.length > 500) {
      ErrorStore.addError('Response must be 500 characters or less');
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

  // Response cards component (used in both layouts)
  const ResponseCards = () => (
    <>
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
                  <Text style={styles.firstBadgeText}>First Response</Text>
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
                  size={isMobile ? 40 : 56}
                  borderRadius={6}
                />
                <View style={styles.responseContent}>
                  <Text style={styles.responseAuthor}>{response.user?.name}</Text>
                  <Text style={styles.responseText}>{response.content}</Text>
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
          <Text style={styles.emptyText}>Be the first to help!</Text>
        </MinkyPanel>
      )}
    </>
  );

  // Post card and form component (used in both layouts)
  const PostAndForm = () => (
    <>
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
            <Text style={styles.heartsBadgeText}>{post.hearts}</Text>
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
              size={isMobile ? 36 : 48}
              borderRadius={6}
            />
            <Text style={[styles.authorName, isMobile && { fontSize: 14 }]}>{post.user?.name}</Text>
          </View>
          <Text style={[styles.postContent, isMobile && { fontSize: 13, lineHeight: 18 }]}>{post.content}</Text>
        </MinkyPanel>
      </View>

      {isFirstResponse && (
        <View style={styles.rewardBox}>
          <Text style={styles.rewardText}>First response earns </Text>
          <Text style={styles.rewardBold}>{post.hearts}</Text>
          <Heart size={14} />
          <Text style={styles.rewardText}>!</Text>
        </View>
      )}

      <View style={[styles.inputContainer, isMobile && { flex: 0 }]}>
        {Platform.OS === 'web' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a thoughtful response..."
            maxLength={500}
            style={{
              fontFamily: 'Comfortaa',
              fontSize: isMobile ? 13 : 14,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(92, 90, 88, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              outline: 'none',
              resize: 'none',
              width: '100%',
              minHeight: isMobile ? 80 : 60,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15), inset -1px 0 0 rgba(0, 0, 0, 0.15)',
            }}
          />
        ) : (
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write a thoughtful response..."
            multiline
            maxLength={500}
            style={styles.textInput}
          />
        )}
        <Text style={styles.charCount}>{content.length}/500</Text>
      </View>

      <WoolButton
        onPress={handleSubmit}
        disabled={isSubmitting}
        variant="purple"
      >
        {isSubmitting ? 'SENDING...' : 'SEND RESPONSE'}
      </WoolButton>
    </>
  );

  // Mobile layout - vertical with scroll
  if (isMobile) {
    return (
      <ScrollView
        style={styles.mobileContainer}
        contentContainerStyle={styles.mobileContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Original post and form first on mobile */}
        <View style={styles.mobileSection}>
          <PostAndForm />
        </View>

        {/* Responses section */}
        <View style={styles.mobileSection}>
          <Text style={styles.panelTitle}>Responses</Text>
          <ResponseCards />
        </View>
      </ScrollView>
    );
  }

  // Desktop layout - horizontal with side-by-side panels
  return (
    <View style={styles.container}>
      {/* LEFT PANEL - Responses list with independent scroll */}
      <View style={styles.leftPanel}>
        <Text style={styles.panelTitle}>Responses</Text>
        <ScrollView
          ref={responsesScrollRef}
          style={styles.responsesScroll}
          contentContainerStyle={styles.responsesContent}
          showsVerticalScrollIndicator={false}
        >
          <ResponseCards />
        </ScrollView>
      </View>

      {/* RIGHT PANEL - Original post and response form */}
      <View style={styles.rightPanel}>
        <PostAndForm />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 15,
  },
  // Mobile styles
  mobileContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mobileContent: {
    flexDirection: 'column',
    gap: 20,
    paddingBottom: 20,
  },
  mobileSection: {
    gap: 10,
  },
  // Desktop styles
  leftPanel: {
    flex: 1,
  },
  rightPanel: {
    flex: 1,
    gap: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontFamily: 'ChubbyTrail',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.82)',
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
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    flexShrink: 0,
  },
  rewardText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlign: 'center',
  },
  rewardBold: {
    fontWeight: '700',
    color: '#7044C7',
  },
  inputContainer: {
    flex: 1,
    gap: 4,
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlignVertical: 'top',
    minHeight: 60,
    // Emboss effect
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
    flexShrink: 0,
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
