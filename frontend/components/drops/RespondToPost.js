import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, Image, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import StitchedBorder from '../StitchedBorder';

const buttonBgImage = require('../../assets/images/button-bg.png');

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

  // Get persisted form state
  const content = FormStore.getField('respondToPost', 'content') || '';
  const setContent = (value) => FormStore.setField('respondToPost', 'content', value);

  const postId = input['wishingWell:list']?.postId || input.postId;

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    if (!WebSocketService.socket || !postId) {
      setLoading(false);
      return;
    }

    try {
      // Get all posts and find the one we need
      const flowName = context?.flowName || 'wishingWell';
      const result = await WebSocketService.emit(`${flowName}:posts:get`, {});

      if (result.success) {
        const foundPost = result.data.find(p => p._id === postId);
        if (foundPost) {
          setPost(foundPost);
        } else {
          ErrorStore.addError('Post not found');
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
      ErrorStore.addError('Failed to load post');
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

      if (result.success) {
        // Reset form on successful submission
        FormStore.resetForm('respondToPost');

        // Success! Go back to list
        onComplete({ action: 'submitted' });
      } else {
        ErrorStore.addError(result.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      ErrorStore.addError('Failed to submit response');
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

  const isFirstResponse = !post.firstResponderSessionId;

  return (
    <View style={styles.container}>
      {/* Original Post */}
      <View style={styles.originalPost}>
        <Text style={styles.sectionTitle}>RESPONDING TO:</Text>

        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              {post.authorAvatar ? (
                <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>?</Text>
                </View>
              )}
              <Text style={styles.authorName}>{post.authorName}</Text>
            </View>
            <Text style={styles.hearts}>❤️ {post.hearts}</Text>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>
        </View>

        {/* Reward Info */}
        {isFirstResponse && (
          <View style={styles.rewardBox}>
            <Text style={styles.rewardText}>
              🎉 <Text style={styles.rewardBold}>Be the first to respond</Text> and earn <Text style={styles.rewardBold}>{post.hearts} hearts!</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Response Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>YOUR RESPONSE</Text>
        {Platform.OS === 'web' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a thoughtful response..."
            maxLength={500}
            style={{
              ...styles.textInput,
              fontFamily: 'Comfortaa',
              resize: 'vertical',
              border: '2px solid rgba(92, 90, 88, 0.3)',
              outline: 'none',
              minHeight: 150,
            }}
          />
        ) : (
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write a thoughtful response..."
            multiline
            maxLength={500}
            style={[styles.textInput, { minHeight: 150 }]}
          />
        )}
        <Text style={styles.charCount}>{content.length}/500</Text>
      </View>

      {/* Submit Button */}
      <Pressable
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {/* Background texture */}
        {Platform.OS === 'web' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '40%',
              borderRadius: 8,
              pointerEvents: 'none',
              opacity: 0.8,
            }}
          />
        )}
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={buttonBgImage}
            style={styles.buttonBgImage}
            imageStyle={{ opacity: 0.8, borderRadius: 6 }}
            resizeMode="repeat"
          />
        )}
        <View style={styles.submitButtonOverlay}>
          <StitchedBorder paddingHorizontal={26} paddingVertical={11}>
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'SENDING...' : 'SEND RESPONSE'}
            </Text>
          </StitchedBorder>
        </View>
      </Pressable>

      {/* Back Button */}
      {canGoBack && (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← CANCEL</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  originalPost: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  postCard: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(179, 230, 255, 0.5)',
    backgroundColor: 'rgba(179, 230, 255, 0.15)',
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  hearts: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  postContent: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 20,
  },
  rewardBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(112, 68, 199, 0.5)',
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
  },
  rewardText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlign: 'center',
    lineHeight: 20,
  },
  rewardBold: {
    fontWeight: '700',
    color: '#7044C7',
  },
  inputContainer: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  textInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'right',
  },
  submitButton: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  submitButtonOverlay: {
    width: '100%',
    backgroundColor: 'rgba(112, 68, 199, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  backButton: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
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
