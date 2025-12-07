import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import Button from '../Button';

/**
 * CreateWishingWellPost Drop
 * Form for creating a new positive message in the wishing well (free posts)
 */
const CreateWishingWellPost = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flowName = context?.flowName || 'wishingWell';

  // Get persisted form state scoped to this flow's new post
  const formKey = `${flowName}:newPost`;
  const content = FormStore.getField(formKey, 'content') || '';

  // Setter that updates FormStore
  const setContent = (value) => FormStore.setField(formKey, 'content', value);

  const handleSubmit = async () => {
    if (!content.trim()) {
      ErrorStore.addError('Please enter your message');
      return;
    }

    if (content.length > 500) {
      ErrorStore.addError('Message must be 500 characters or less');
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

      const result = await WebSocketService.emit(`${flowName}:posts:create`, payload);

      if (result.success) {
        // Reset form on successful submission
        FormStore.resetForm(formKey);

        // Success! Navigate to list
        onComplete({ action: 'submitted' });
      } else {
        ErrorStore.addError(result.error || 'Failed to create message');
      }
    } catch (error) {
      console.error('Error creating message:', error);
      ErrorStore.addError('Failed to create message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>
          Share a positive message with the community! Others can tip you hearts if your message resonates with them.
        </Text>
      </View>

      {/* Content Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>YOUR MESSAGE</Text>
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
      <Button
        onPress={handleSubmit}
        disabled={isSubmitting}
        variant="primary"
      >
        {isSubmitting ? 'POSTING...' : 'POST MESSAGE'}
      </Button>

      {/* Back Button */}
      {canGoBack && (
        <Button
          onPress={onBack}
          variant="cancel"
        >
          ← CANCEL
        </Button>
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
});

export default CreateWishingWellPost;
