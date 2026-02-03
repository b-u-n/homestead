import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import profileStore from '../../stores/ProfileStore';
import FormStore from '../../stores/FormStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import Heart from '../Heart';
import SoundManager from '../../services/SoundManager';

/**
 * CreateWeepingWillowPost Drop
 * Form for creating a new post with heart bounty (paid posts)
 */
const CreateWeepingWillowPost = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const flowName = context?.flowName || 'weepingWillow';

  // Get persisted form state scoped to this flow's new post
  const formKey = `${flowName}:newPost`;
  const content = FormStore.getField(formKey, 'content') || '';
  const hearts = FormStore.getField(formKey, 'hearts') || 3;
  const availableHearts = profileStore.hearts || 0;

  // Setters that update FormStore
  const setContent = (value) => FormStore.setField(formKey, 'content', value);
  const setHearts = (value) => FormStore.setField(formKey, 'hearts', value);

  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  // Auto-resize textarea on mount and when content changes
  useEffect(() => {
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = (textareaRef.current.scrollHeight + 8) + 'px';
        }
      });
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      ErrorStore.addError('Please enter your message');
      return;
    }

    if (content.length > 5000) {
      ErrorStore.addError('Message must be 5000 characters or less');
      return;
    }

    if (hearts < 1) {
      ErrorStore.addError('Must offer at least 1 heart');
      return;
    }

    if (hearts > availableHearts) {
      ErrorStore.addError(`Not enough hearts. You have ${availableHearts}, need ${hearts}`);
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('Not connected to server');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        sessionId: SessionStore.sessionId,
        content: content.trim(),
        hearts: hearts
      };

      const result = await WebSocketService.emit(`${flowName}:posts:create`, payload);

      // Update hearts from server response
      if (result.hearts !== undefined) {
        profileStore.setHearts(result.hearts);
      }
      if (result.heartBank !== undefined) {
        profileStore.setHeartBank(result.heartBank);
      }

      // Reset form on successful submission
      FormStore.resetForm(formKey);

      // Success! Navigate to list
      onComplete({ action: 'submitted' });
    } catch (error) {
      console.error('Error creating post:', error);
      // Use the actual error message from WebSocket response
      ErrorStore.addError(error.message || 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <MinkyPanel
      borderRadius={10}
      padding={16}
      paddingTop={16}
      overlayColor="rgba(112, 68, 199, 0.2)"
    >
        {/* Explanation */}
        <Text style={styles.explanationText}>
          When you feel like you just need to talk, that's what we're here for. Share what's on your mind. Other users can respond to earn the hearts you offer.
        </Text>

        {/* Heart Selector */}
        <View style={styles.heartSelectorContainer}>
          {isMobile ? (
            // Mobile: 3x3 grid
            <View style={styles.heartGrid}>
              {[0, 1, 2].map(row => (
                <View key={row} style={styles.heartGridRow}>
                  {[1, 2, 3].map(col => {
                    const heartNum = row * 3 + col;
                    const isSelected = heartNum <= hearts;
                    const isAvailable = heartNum <= availableHearts;

                    let heartStyle = {};
                    if (!isAvailable) {
                      heartStyle = { opacity: 0.2 };
                    } else if (isSelected) {
                      heartStyle = { opacity: 1 };
                    } else {
                      heartStyle = { opacity: 0.4 };
                    }

                    return (
                      <Pressable
                        key={heartNum}
                        onPress={() => {
                          if (heartNum <= availableHearts) {
                            setHearts(heartNum);
                            SoundManager.play('heart');
                          }
                        }}
                        disabled={heartNum > availableHearts}
                        style={[styles.heartIcon, heartStyle]}
                      >
                        <Heart size={24} />
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : (
            // Desktop: single row
            <View style={styles.heartSelector}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((heartNum) => {
                const isSelected = heartNum <= hearts;
                const isAvailable = heartNum <= availableHearts;

                let heartStyle = {};
                if (!isAvailable) {
                  heartStyle = { opacity: 0.2 };
                } else if (isSelected) {
                  heartStyle = { opacity: 1 };
                } else {
                  heartStyle = { opacity: 0.4 };
                }

                return (
                  <Pressable
                    key={heartNum}
                    onPress={() => {
                      if (heartNum <= availableHearts) {
                        setHearts(heartNum);
                        SoundManager.play('heart');
                      }
                    }}
                    disabled={heartNum > availableHearts}
                    style={[styles.heartIcon, heartStyle]}
                  >
                    <Heart size={28} />
                  </Pressable>
                );
              })}
            </View>
          )}
          <View style={styles.heartHelpRow}>
            <Text style={styles.heartHelp}>Heart bounty for responders: {hearts}</Text>
            <Heart size={21} />
          </View>
        </View>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          {Platform.OS === 'web' ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={5000}
              style={{
                fontFamily: 'Comfortaa',
                fontSize: 21,
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
              placeholder="What's on your mind?"
              multiline
              maxLength={5000}
              style={styles.textInput}
            />
          )}
          <Text style={styles.charCount}>{content.length}/5000</Text>
        </View>

        {/* Submit Button */}
        <WoolButton
          onPress={handleSubmit}
          disabled={isSubmitting}
          variant="purple"
        >
          {isSubmitting ? 'SENDING...' : 'SEND REQUEST'}
        </WoolButton>
    </MinkyPanel>
  );

  return formContent;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  explanationText: {
    fontSize: 20,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    lineHeight: 30,
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heartSelectorContainer: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heartSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  heartGrid: {
    alignItems: 'center',
    gap: 4,
  },
  heartGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  heartIcon: {
    padding: 2,
  },
  heartEmoji: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heartHelp: {
    fontSize: 17,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
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
    fontSize: 21,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlignVertical: 'top',
    minHeight: 284,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  charCount: {
    fontSize: 15,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'right',
  },
});

export default CreateWeepingWillowPost;
