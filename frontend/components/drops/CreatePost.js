import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import profileStore from '../../stores/ProfileStore';
import FormStore from '../../stores/FormStore';
import StitchedBorder from '../StitchedBorder';

const buttonBgImage = require('../../assets/images/button-bg.png');

/**
 * CreatePost Drop
 * Form for creating a new wish with heart bounty
 */
const CreatePost = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flowName = context?.flowName || 'wishingWell';
  const isFreePost = flowName === 'wishingWell'; // Wishing well posts are free

  // Get persisted form state scoped to this flow's new post
  const formKey = `${flowName}:newPost`;
  const content = FormStore.getField(formKey, 'content') || '';
  const hearts = FormStore.getField(formKey, 'hearts') || 1;
  const availableHearts = profileStore.hearts || 0;

  // Setters that update FormStore
  const setContent = (value) => FormStore.setField(formKey, 'content', value);
  const setHearts = (value) => FormStore.setField(formKey, 'hearts', value);

  const handleSubmit = async () => {
    if (!content.trim()) {
      ErrorStore.addError('Please enter your wish');
      return;
    }

    if (content.length > 500) {
      ErrorStore.addError('Wish must be 500 characters or less');
      return;
    }

    if (!isFreePost && hearts < 1) {
      ErrorStore.addError('Must offer at least 1 heart');
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        sessionId: SessionStore.sessionId,
        content: content.trim()
      };

      // Only include hearts for paid posts (weeping willow)
      if (!isFreePost) {
        payload.hearts = hearts;
      }

      const result = await WebSocketService.emit(`${flowName}:posts:create`, payload);

      if (result.success) {
        // Reset form on successful submission
        FormStore.resetForm(formKey);

        // Success! Navigate to list
        onComplete({ action: 'submitted' });
      } else {
        ErrorStore.addError(result.error || 'Failed to create wish');
      }
    } catch (error) {
      console.error('Error creating wish:', error);
      ErrorStore.addError('Failed to create wish');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>
          {isFreePost ? (
            `Share a positive message with the community! Other users can respond and you can tip them hearts if their response resonates with you.\n\nNo guaranteed responses, but we do our best to get through them all. Responding to others first tends to help. <3`
          ) : (
            `When you feel like you just need to talk, that's what we're here for. <3\n\nShare what's on your mind. Other users can respond to earn the hearts you offer. We'll do our best to get through them all.\n\nResponding to others first is the fastest way to get your own post noticed. <3`
          )}
        </Text>
      </View>

      {/* Heart Selector (only for paid posts - weeping willow) */}
      {!isFreePost && (
        <View style={styles.heartSelectorContainer}>
          <Text style={styles.label}>HEART BOUNTY</Text>
          <View style={styles.heartSelector}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((heartNum) => {
              const isSelected = heartNum <= hearts;
              const isAvailable = heartNum <= availableHearts;

              // Determine heart appearance
              let heartStyle = {};
              if (!isAvailable) {
                // Black/unavailable - use very low opacity and grayscale filter
                heartStyle = { opacity: 0.2 };
              } else if (isSelected) {
                // Red/selected - full color
                heartStyle = { opacity: 1 };
              } else {
                // White/available - medium opacity to appear lighter
                heartStyle = { opacity: 0.4 };
              }

              return (
                <Pressable
                  key={heartNum}
                  onPress={() => {
                    if (heartNum <= availableHearts) {
                      setHearts(heartNum);
                    }
                  }}
                  disabled={heartNum > availableHearts}
                  style={styles.heartIcon}
                >
                  <Text style={[styles.heartEmoji, heartStyle]}>❤️</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.heartHelp}>
            Heart bounty for responders: {hearts} ❤️
          </Text>
        </View>
      )}

      {/* Content Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>YOUR WISH</Text>
        {Platform.OS === 'web' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a hopeful wish or positive message..."
            maxLength={500}
            style={{
              ...styles.textInput,
              fontFamily: 'Comfortaa',
              resize: 'vertical',
              border: '2px solid rgba(92, 90, 88, 0.3)',
              outline: 'none',
              minHeight: 200,
            }}
          />
        ) : (
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Share a hopeful wish or positive message..."
            multiline
            maxLength={500}
            style={[styles.textInput, { minHeight: 200 }]}
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
              {isSubmitting ? 'POSTING...' : 'POST WISH'}
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
  explanationBox: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(179, 230, 255, 0.5)',
    backgroundColor: 'rgba(179, 230, 255, 0.1)',
  },
  explanationText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 20,
  },
  explanationBold: {
    fontWeight: '700',
  },
  heartSelectorContainer: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  heartSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(112, 68, 199, 0.2)',
    backgroundColor: 'rgba(112, 68, 199, 0.05)',
  },
  heartIcon: {
    padding: 4,
  },
  heartEmoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartHelp: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
  },
  inputContainer: {
    gap: 10,
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
});

export default CreatePost;
