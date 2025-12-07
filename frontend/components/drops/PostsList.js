import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import WebSocketService from '../../services/websocket';
import ErrorStore from '../../stores/ErrorStore';
import Scroll from '../Scroll';
import AvatarStamp from '../AvatarStamp';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import Heart from '../Heart';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

/**
 * PostsList Drop
 * Landing page for Help Wanted - shows posts list with filters
 * Clicking a post navigates to view/respond
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
  const isWeepingWillow = context?.flowName === 'weepingWillow';
  // Single sort option - default to unresponded-first for weepingWillow
  const [sort, setSort] = useState(isWeepingWillow ? 'unresponded' : 'date-desc');

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
  }, [sort, context]);

  const loadPosts = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const flowName = context?.flowName || 'wishingWell';
      const result = await WebSocketService.emit(`${flowName}:posts:get`, {
        sort
      });

      // emit() returns response.data directly on success
      setPosts(result || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      ErrorStore.addError(error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId) => {
    onComplete({
      action: 'viewPost',
      postId
    });
  };

  const renderPost = (post) => {
    const hasResponses = post.responses && post.responses.length > 0;

    return (
      <Pressable
        key={post._id}
        style={styles.postWrapper}
        onPress={() => handlePostClick(post._id)}
      >
        <MinkyPanel
          borderRadius={8}
          padding={12}
          paddingTop={12}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <AvatarStamp
                avatarUrl={post.user?.avatar}
                avatarColor={post.user?.color}
                size={32}
                borderRadius={5}
              />
              <Text style={styles.authorName}>{post.user?.name}</Text>
            </View>
            <View style={styles.heartsRow}>
              <Text style={styles.hearts}>{post.hearts}</Text>
              <Heart size={14} />
            </View>
          </View>

          {/* Post Content */}
          <Text style={styles.postContent} numberOfLines={3}>
            {post.content}
          </Text>

          {/* Post Footer */}
          <View style={styles.postFooter}>
            <Text style={styles.date}>
              {formatTimeAgo(post.createdAt)}
            </Text>
            <Text style={styles.responseCount}>
              {hasResponses ? `${post.responses.length} response${post.responses.length > 1 ? 's' : ''}` : 'No responses yet'}
            </Text>
          </View>
        </MinkyPanel>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header row: Sort options + Ask for Help button */}
      <View style={styles.headerRow}>
        <Scroll horizontal style={styles.sortScroll}>
          <View style={styles.sortButtons}>
            {[
              { value: 'unresponded', label: 'Unresponded' },
              { value: 'date-desc', label: 'Newest' },
              { value: 'date-asc', label: 'Oldest' },
              { value: 'value-desc', label: 'Most Hearts' },
              { value: 'value-asc', label: 'Least Hearts' }
            ].map((s) => (
              <WoolButton
                key={s.value}
                onPress={() => setSort(s.value)}
                variant="purple"
                size="small"
                focused={sort === s.value}
              >
                {s.label}
              </WoolButton>
            ))}
          </View>
        </Scroll>

        <WoolButton
          onPress={() => onComplete({ action: 'create' })}
          variant="purple"
          size="small"
        >
          Ask for Help
        </WoolButton>
      </View>

      {/* Posts List */}
      <Scroll style={styles.postsList}>
        {loading ? (
          <MinkyPanel
            borderRadius={8}
            padding={20}
            paddingTop={20}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            <Text style={styles.statusText}>Loading posts...</Text>
          </MinkyPanel>
        ) : posts.length === 0 ? (
          <MinkyPanel
            borderRadius={8}
            padding={20}
            paddingTop={20}
            overlayColor="rgba(112, 68, 199, 0.2)"
          >
            <Text style={styles.statusText}>
              {isWeepingWillow
                ? 'No help requests found. Be the first to ask for help!'
                : 'No wishes found. Be the first to make one!'}
            </Text>
          </MinkyPanel>
        ) : (
          posts.map(renderPost)
        )}
      </Scroll>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sortScroll: {
    flex: 1,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  postsList: {
    flex: 1,
  },
  postWrapper: {
    marginBottom: 12,
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
    gap: 10,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hearts: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  postContent: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    lineHeight: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.85)',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  responseCount: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: 'rgba(64, 63, 62, 0.85)',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PostsList;
