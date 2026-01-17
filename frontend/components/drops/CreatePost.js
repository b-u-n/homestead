import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import profileStore from '../../stores/ProfileStore';
import FormStore from '../../stores/FormStore';
import uxStore from '../../stores/UXStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import Heart from '../Heart';
import Scrollbar from '../Scrollbar';

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
  const [scrollMetrics, setScrollMetrics] = useState({ offset: 0, visible: 0, content: 0 });
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  const flowName = context?.flowName || 'wishingWell';
  const isFreePost = flowName === 'wishingWell'; // Wishing well posts are free

  // Get persisted form state scoped to this flow's new post
  const formKey = `${flowName}:newPost`;
  const content = FormStore.getField(formKey, 'content') || '';
  const hearts = FormStore.getField(formKey, 'hearts') || 3;
  const availableHearts = profileStore.hearts || 0;

  // Setters that update FormStore
  const setContent = (value) => FormStore.setField(formKey, 'content', value);
  const setHearts = (value) => FormStore.setField(formKey, 'hearts', value);

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
      ErrorStore.addError('Please enter your wish');
      return;
    }

    if (content.length > 5000) {
      ErrorStore.addError('Wish must be 5000 characters or less');
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

  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  const formContent = (
    <MinkyPanel
      borderRadius={10}
      padding={isMobile ? 12 : 16}
      paddingTop={isMobile ? 12 : 16}
      overlayColor="rgba(112, 68, 199, 0.2)"
    >
      {/* Explanation */}
      <Text style={[
        styles.explanationText,
        {
          fontSize: FontSettingsStore.getScaledFontSize(isMobile ? 12 : 13),
          lineHeight: FontSettingsStore.getScaledSpacing(isMobile ? 18 : 20),
          color: FontSettingsStore.getFontColor('#403F3E'),
        }
      ]}>
        {isFreePost ? (
          `Share a positive message with the community! Other users can respond and you can tip them hearts if their response resonates with you.`
        ) : (
          `When you feel like you just need to talk, that's what we're here for. Share what's on your mind. Other users can respond to earn the hearts you offer.`
        )}
      </Text>

      {/* Heart Selector (only for paid posts - weeping willow) */}
      {!isFreePost && (
        <View style={styles.heartSelectorContainer}>
          <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(12), color: FontSettingsStore.getFontColor('#403F3E') }]}>HEART BOUNTY</Text>
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
            <Text style={[styles.heartHelp, { fontSize: FontSettingsStore.getScaledFontSize(11), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.85)') }]}>Heart bounty for responders: {hearts}</Text>
            <Heart size={FontSettingsStore.getScaledFontSize(14)} />
          </View>
        </View>
      )}

      {/* Content Input */}
      <View style={[styles.inputContainer, isMobile && { flex: 0 }]}>
        {Platform.OS === 'web' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isFreePost ? "Share a hopeful wish or positive message..." : "What's on your mind?"}
            maxLength={5000}
            style={{
              fontFamily: 'Comfortaa',
              fontSize: FontSettingsStore.getScaledFontSize(isMobile ? 13 : 14),
              color: FontSettingsStore.getFontColor('#403F3E'),
              padding: FontSettingsStore.getScaledSpacing(10),
              borderRadius: 8,
              border: '1px solid rgba(92, 90, 88, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              outline: 'none',
              resize: 'none',
              width: '100%',
              minHeight: FontSettingsStore.getScaledSpacing(isMobile ? 100 : 120),
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
            placeholder={isFreePost ? "Share a hopeful wish or positive message..." : "What's on your mind?"}
            multiline
            maxLength={5000}
            style={styles.textInput}
          />
        )}
        <Text style={[styles.charCount, { fontSize: FontSettingsStore.getScaledFontSize(11), color: FontSettingsStore.getFontColor('rgba(64, 63, 62, 0.6)') }]}>{content.length}/5000</Text>
      </View>

      {/* Submit Button */}
      <WoolButton
        onPress={handleSubmit}
        disabled={isSubmitting}
        variant="purple"
      >
        {isSubmitting ? 'POSTING...' : (isFreePost ? 'POST WISH' : 'ASK FOR HELP')}
      </WoolButton>
    </MinkyPanel>
  );

  // Mobile: wrap in ScrollView for proper scrolling
  if (isMobile) {
    return (
      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
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
          {formContent}
        </ScrollView>
        <Scrollbar
          contentHeight={scrollMetrics.content}
          visibleHeight={scrollMetrics.visible}
          scrollOffset={scrollMetrics.offset}
          onScroll={(offset) => scrollRef.current?.scrollTo({ y: offset, animated: false })}
          thumbColor="rgba(112, 68, 199, 0.5)"
          trackColor="rgba(112, 68, 199, 0.15)"
          style={{ marginLeft: 4 }}
        />
      </View>
    );
  }

  // Desktop: simple container
  return (
    <View style={styles.container}>
      {formContent}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  explanationText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    lineHeight: 20,
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
    fontSize: 12,
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
  heartHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heartHelp: {
    fontSize: 11,
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
});

export default CreatePost;
