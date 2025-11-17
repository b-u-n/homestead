import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import WebSocketService from '../../services/websocket';
import ErrorStore from '../../stores/ErrorStore';

/**
 * PostsList Drop
 * Shows expandable posts with filters and sorting
 */
const PostsList = ({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'new', 'unresponded'
  const [sort, setSort] = useState('date-desc'); // 'date-desc', 'date-asc', 'value-desc', 'value-asc'

  useEffect(() => {
    loadPosts();

    const flowName = context?.flowName || 'wishingWell';

    // Listen for real-time updates
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
  }, [filter, sort, context]);

  const loadPosts = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const flowName = context?.flowName || 'wishingWell';
      const result = await WebSocketService.emit(`${flowName}:posts:get`, {
        filter: filter === 'all' ? undefined : filter,
        sort
      });

      if (result.success) {
        setPosts(result.data);
      } else {
        ErrorStore.addError(result.error || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      ErrorStore.addError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const handleRespond = (postId) => {
    onComplete({
      action: 'respond',
      postId
    });
  };

  const renderPost = (post) => {
    const isExpanded = expandedPostId === post._id;
    const hasResponses = post.responses && post.responses.length > 0;

    return (
      <Pressable
        key={post._id}
        style={styles.post}
        onPress={() => toggleExpand(post._id)}
      >
        {/* Post Header */}
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

        {/* Post Content */}
        <Text style={styles.postContent} numberOfLines={isExpanded ? undefined : 3}>
          {post.content}
        </Text>

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

        {/* Expanded: Responses */}
        {isExpanded && (
          <View style={styles.responsesContainer}>
            {hasResponses ? (
              post.responses.map((response, index) => (
                <View key={index} style={styles.response}>
                  <View style={styles.responseHeader}>
                    {response.responderAvatar ? (
                      <Image source={{ uri: response.responderAvatar }} style={styles.responseAvatar} />
                    ) : (
                      <View style={styles.responseAvatarPlaceholder}>
                        <Text style={styles.responseAvatarText}>?</Text>
                      </View>
                    )}
                    <Text style={styles.responderName}>{response.responderName}</Text>
                  </View>
                  <Text style={styles.responseContent}>{response.content}</Text>
                  <Text style={styles.responseDate}>
                    {new Date(response.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noResponses}>Be the first to respond!</Text>
            )}

            {/* Respond Button */}
            <Pressable
              style={styles.respondButton}
              onPress={() => handleRespond(post._id)}
            >
              <Text style={styles.respondButtonText}>RESPOND</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {['all', 'new', 'unresponded'].map((f) => (
              <Pressable
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sort */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortButtons}>
            {[
              { value: 'date-desc', label: 'Newest' },
              { value: 'date-asc', label: 'Oldest' },
              { value: 'value-desc', label: 'Hearts ↓' },
              { value: 'value-asc', label: 'Hearts ↑' }
            ].map((s) => (
              <Pressable
                key={s.value}
                style={[styles.sortButton, sort === s.value && styles.sortButtonActive]}
                onPress={() => setSort(s.value)}
              >
                <Text style={[styles.sortButtonText, sort === s.value && styles.sortButtonTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Posts List */}
      <ScrollView style={styles.postsList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading wishes...</Text>
        ) : posts.length === 0 ? (
          <Text style={styles.emptyText}>No wishes found. Be the first to make one!</Text>
        ) : (
          posts.map(renderPost)
        )}
      </ScrollView>

      {/* Create Post Button */}
      <Pressable
        style={styles.createButton}
        onPress={() => onComplete({ action: 'create' })}
      >
        <Text style={styles.createButtonText}>+ CREATE POST</Text>
      </Pressable>

      {/* Back Button */}
      {canGoBack && (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 15,
  },
  filtersContainer: {
    marginBottom: 5,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonActive: {
    borderColor: '#7044C7',
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
  filterButtonTextActive: {
    color: '#7044C7',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortLabel: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sortButtonActive: {
    borderColor: '#7044C7',
    backgroundColor: 'rgba(112, 68, 199, 0.05)',
  },
  sortButtonText: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
  sortButtonTextActive: {
    color: '#7044C7',
  },
  postsList: {
    flex: 1,
  },
  post: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(179, 230, 255, 0.5)',
    backgroundColor: 'rgba(179, 230, 255, 0.15)',
    marginBottom: 15,
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
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    opacity: 0.7,
  },
  responseCount: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
  },
  responsesContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 90, 88, 0.2)',
    gap: 15,
  },
  response: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    gap: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  responseAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseAvatarText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  responderName: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
  },
  responseContent: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 18,
  },
  responseDate: {
    fontSize: 10,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    opacity: 0.7,
  },
  noResponses: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  respondButton: {
    padding: 12,
    borderRadius: 6,
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
  loadingText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  createButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7044C7',
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  backButton: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
});

export default PostsList;
