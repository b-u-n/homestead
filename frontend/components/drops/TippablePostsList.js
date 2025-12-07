import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Scroll from '../Scroll';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import HeartPaymentModal from '../HeartPaymentModal';

/**
 * TippablePostsList Drop
 * Lists posts with ability to tip hearts to authors
 */
const TippablePostsList = ({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'new', 'unresponded'
  const [sort, setSort] = useState('date-desc'); // 'date-asc', 'date-desc', 'value-asc', 'value-desc'
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filter, sort]);

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

  const handleTipPress = (post) => {
    setSelectedPost(post);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = async (paymentData) => {
    const { amount, source } = paymentData;

    try {
      const flowName = context?.flowName || 'wishingWell';
      const result = await WebSocketService.emit(`${flowName}:posts:tip`, {
        sessionId: SessionStore.sessionId,
        postId: selectedPost._id,
        amount,
        source
      });

      if (result.success) {
        alert(result.message);
        setIsPaymentModalOpen(false);
        setSelectedPost(null);
        loadPosts(); // Refresh list
      } else {
        ErrorStore.addError(result.error || 'Failed to tip');
      }
    } catch (error) {
      console.error('Error tipping:', error);
      ErrorStore.addError('Failed to tip');
    }
  };

  const handleCreatePost = () => {
    onComplete({ action: 'create' });
  };

  return (
    <View style={styles.container}>
      {/* Filter & Sort */}
      <View style={styles.controls}>
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

        <Pressable style={styles.sortButton} onPress={() => {
          const sorts = ['date-desc', 'date-asc', 'value-desc', 'value-asc'];
          const currentIndex = sorts.indexOf(sort);
          const nextIndex = (currentIndex + 1) % sorts.length;
          setSort(sorts[nextIndex]);
        }}>
          <Text style={styles.sortButtonText}>Sort: {sort.replace('-', ' ')}</Text>
        </Pressable>
      </View>

      {/* Posts List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : posts.length === 0 ? (
        <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
      ) : (
        <Scroll style={styles.postsList}>
          {posts.map((post) => (
            <View key={post._id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.authorName}>{post.user?.name}</Text>
                <Text style={styles.tipCount}>❤️ {post.totalTips || 0}</Text>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              <View style={styles.postFooter}>
                <Text style={styles.responseCount}>
                  {post.responses?.length || 0} responses
                </Text>
                <Pressable
                  style={styles.tipButton}
                  onPress={() => handleTipPress(post)}
                >
                  <Text style={styles.tipButtonText}>TIP ❤️</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Scroll>
      )}

      {/* Create Post Button */}
      <Pressable style={styles.createButton} onPress={handleCreatePost}>
        <Text style={styles.createButtonText}>+ CREATE POST</Text>
      </Pressable>

      {/* Back Button */}
      {canGoBack && (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </Pressable>
      )}

      {/* Heart Payment Modal */}
      <HeartPaymentModal
        visible={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPost(null);
        }}
        onComplete={handlePaymentComplete}
        paymentInfo={{
          recipient: selectedPost?.user?.name,
          purpose: 'Tip for post'
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 15,
  },
  controls: {
    gap: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
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
  sortButton: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 40,
  },
  postsList: {
    flex: 1,
  },
  postCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  tipCount: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#E63946',
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
    marginTop: 5,
  },
  responseCount: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
  },
  tipButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E63946',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
  },
  tipButtonText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#E63946',
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
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
});

export default TippablePostsList;
