import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import profileStore from '../../stores/ProfileStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import AvatarStamp from '../AvatarStamp';

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
          {responses.length > 0 ? (
            responses.map((response, index) => (
              <MinkyPanel
                key={response._id || index}
                borderRadius={8}
                padding={0}
                paddingTop={0}
                overlayColor={hexToRgba(response.responderColor, 0.15)}
                borderColor={hexToRgba(response.responderColor, 0.5)}
                style={styles.responseCard}
              >
                <View style={styles.responseInner}>
                  <AvatarStamp
                    avatarUrl={response.responderAvatar}
                    avatarColor={response.responderColor}
                    size={56}
                    borderRadius={6}
                  />
                  <View style={styles.responseContent}>
                    <View style={styles.responseHeader}>
                      <Text style={styles.responseAuthor}>{response.responderName}</Text>
                      {index === 0 && <Text style={styles.firstBadge}>1ST</Text>}
                    </View>
                    <Text style={styles.responseText}>{response.content}</Text>
                  </View>
                </View>
              </MinkyPanel>
            ))
          ) : (
            <MinkyPanel
              borderRadius={8}
              padding={20}
              paddingTop={20}
              overlayColor="rgba(112, 68, 199, 0.1)"
            >
              <Text style={styles.emptyText}>Be the first to help!</Text>
            </MinkyPanel>
          )}
        </ScrollView>
      </View>

      {/* RIGHT PANEL - Original post and response form */}
      <View style={styles.rightPanel}>
        <MinkyPanel
          borderRadius={10}
          padding={12}
          paddingTop={12}
          overlayColor={hexToRgba(post.authorColor, 0.2)}
          borderColor={hexToRgba(post.authorColor, 0.5)}
        >
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <AvatarStamp
                avatarUrl={post.authorAvatar}
                avatarColor={post.authorColor}
                size={48}
                borderRadius={6}
              />
              <Text style={styles.authorName}>{post.authorName}</Text>
            </View>
            <Text style={styles.hearts}>❤️ {post.hearts}</Text>
          </View>
          <Text style={styles.postContent}>{post.content}</Text>
        </MinkyPanel>

        {isFirstResponse && (
          <View style={styles.rewardBox}>
            <Text style={styles.rewardText}>
              🎉 First response earns <Text style={styles.rewardBold}>{post.hearts} hearts!</Text>
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          {Platform.OS === 'web' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a thoughtful response..."
              maxLength={500}
              style={{
                fontFamily: 'Comfortaa',
                fontSize: 14,
                padding: 10,
                borderRadius: 8,
                border: '1px solid rgba(92, 90, 88, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                outline: 'none',
                resize: 'none',
                flex: 1,
                minHeight: 60,
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
    color: '#403F3E',
    textAlign: 'center',
    marginBottom: 8,
    flexShrink: 0,
  },
  responsesScroll: {
    flex: 1,
  },
  responsesContent: {
    gap: 10,
    paddingBottom: 4,
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
    gap: 8,
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  hearts: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  postContent: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 22,
  },
  rewardBox: {
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
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  responseAuthor: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    flex: 1,
  },
  firstBadge: {
    fontSize: 10,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#7044C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  responseText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 20,
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
