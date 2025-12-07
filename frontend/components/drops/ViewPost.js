import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import WebSocketService from '../../services/websocket';
import ErrorStore from '../../stores/ErrorStore';
import Scroll from '../Scroll';
import AvatarStamp from '../AvatarStamp';

/**
 * ViewPost Drop
 * Shows a single post with all responses - used for deep linking from notifications
 */
const ViewPost = ({
  input,
  context,
  onComplete,
  onBack
}) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get postId from input params (passed via deep link) or context
  const postId = input?.postId || context?.postId;

  useEffect(() => {
    if (postId) {
      loadPost();
    } else {
      setLoading(false);
    }

    const flowName = context?.flowName || 'weepingWillow';

    // Listen for real-time updates to this post
    const handlePostUpdated = (data) => {
      if (data.postId === postId) {
        loadPost();
      }
    };

    if (WebSocketService.socket) {
      WebSocketService.socket.on(`${flowName}:postUpdated`, handlePostUpdated);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off(`${flowName}:postUpdated`, handlePostUpdated);
      }
    };
  }, [postId, context]);

  const loadPost = async () => {
    if (!WebSocketService.socket || !postId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const flowName = context?.flowName || 'weepingWillow';

      // Fetch all posts and find the one we need
      // TODO: Add a dedicated endpoint for fetching a single post
      const result = await WebSocketService.emit(`${flowName}:posts:get`, {});

      const foundPost = (result || []).find(p => p._id === postId);
      setPost(foundPost || null);
    } catch (error) {
      console.error('Error loading post:', error);
      ErrorStore.addError(error.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = () => {
    onComplete({
      action: 'respond',
      postId
    });
  };

  const handleViewAll = () => {
    onComplete({
      action: 'list'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
        <Pressable style={styles.backButton} onPress={handleViewAll}>
          <Text style={styles.backButtonText}>VIEW ALL POSTS</Text>
        </Pressable>
      </View>
    );
  }

  const hasResponses = post.responses && post.responses.length > 0;

  return (
    <View style={styles.container}>
      <Scroll style={styles.scrollView}>
        {/* Post Card */}
        <View style={styles.post}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <AvatarStamp
                avatarUrl={post.authorAvatar}
                avatarColor={post.authorColor}
                size={40}
                borderRadius={6}
              />
              <Text style={styles.authorName}>{post.authorName}</Text>
            </View>
            <Text style={styles.hearts}>❤️ {post.hearts}</Text>
          </View>

          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Footer */}
          <View style={styles.postFooter}>
            <Text style={styles.date}>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
            <Text style={styles.responseCount}>
              {hasResponses ? `${post.responses.length} response${post.responses.length > 1 ? 's' : ''}` : 'No responses yet'}
            </Text>
          </View>
        </View>

        {/* Responses Section */}
        <View style={styles.responsesSection}>
          <Text style={styles.responsesSectionTitle}>Responses</Text>

          {hasResponses ? (
            post.responses.map((response, index) => (
              <View key={index} style={styles.response}>
                <View style={styles.responseHeader}>
                  <AvatarStamp
                    avatarUrl={response.responderAvatar}
                    avatarColor={response.responderColor}
                    size={32}
                    borderRadius={5}
                  />
                  <View style={styles.responseInfo}>
                    <Text style={styles.responderName}>{response.responderName}</Text>
                    <Text style={styles.responseDate}>
                      {new Date(response.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  {/* Show badge for first responder who won the bounty */}
                  {index === 0 && post.firstResponderId && (
                    <View style={styles.bountyBadge}>
                      <Text style={styles.bountyBadgeText}>❤️ +{post.hearts}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.responseContent}>{response.content}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noResponses}>Be the first to respond!</Text>
          )}
        </View>
      </Scroll>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={styles.respondButton} onPress={handleRespond}>
          <Text style={styles.respondButtonText}>RESPOND</Text>
        </Pressable>
        <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllButtonText}>VIEW ALL POSTS</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 15,
  },
  scrollView: {
    flex: 1,
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
    color: '#FF6B6B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  post: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(179, 230, 255, 0.5)',
    backgroundColor: 'rgba(179, 230, 255, 0.15)',
    marginBottom: 15,
    gap: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  hearts: {
    fontSize: 16,
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
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.15)',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    opacity: 0.7,
  },
  responseCount: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
  },
  responsesSection: {
    gap: 12,
  },
  responsesSectionTitle: {
    fontSize: 16,
    fontFamily: 'ChubbyTrail',
    color: '#403F3E',
    marginBottom: 5,
  },
  response: {
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.15)',
    gap: 10,
    marginBottom: 10,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  responseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  responseAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseAvatarText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  responseInfo: {
    flex: 1,
  },
  responderName: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
  },
  responseDate: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    opacity: 0.7,
  },
  bountyBadge: {
    backgroundColor: 'rgba(112, 68, 199, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7044C7',
  },
  bountyBadgeText: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  responseContent: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 20,
  },
  noResponses: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  respondButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7044C7',
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    alignItems: 'center',
  },
  respondButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  viewAllButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#5C5A58',
  },
  backButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#5C5A58',
  },
});

export default ViewPost;
