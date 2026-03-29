import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import uxStore from '../../stores/UXStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';
import AvatarStamp from '../AvatarStamp';
import Heart from '../Heart';
import { resolveAvatarUrl } from '../../utils/domain';
import { PLATFORM_ASSETS } from '../../constants/platformAssets';

const resolveAssetUri = (asset) => typeof asset === 'string' ? asset : (asset?.default || asset?.uri || asset);

const STALL_NAMES = {
  'map-sprite': 'Map Sprites',
  'toy': 'Toys',
  'emoji': 'Emojis',
  'decoration': 'Decorations',
  'avvie': 'Avatars',
  'spell': 'Spells',
};

const BazaarShop = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = uxStore.isMobile || uxStore.isPortrait;

  const storeType = input?.storeType || 'map-sprite';
  const stallName = STALL_NAMES[storeType] || storeType;

  useEffect(() => {
    loadItems();

    if (WebSocketService.socket) {
      WebSocketService.socket.on('bazaar:submissionUpdated', handleUpdate);
      WebSocketService.socket.on('bazaar:newPurchase', handleUpdate);
    }

    return () => {
      if (WebSocketService.socket) {
        WebSocketService.socket.off('bazaar:submissionUpdated', handleUpdate);
        WebSocketService.socket.off('bazaar:newPurchase', handleUpdate);
      }
    };
  }, [storeType]);

  const handleUpdate = (data) => {
    if (data.storeType === storeType) {
      loadItems();
    }
  };

  const loadItems = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('bazaar:shop:list', { storeType, sessionId: SessionStore.sessionId });
      setItems(result || []);
    } catch (error) {
      console.error('Error loading shop items:', error);
      ErrorStore.addError(error.message || 'Failed to load shop items');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (item) => {
    const avatarSize = isMobile ? 24 : 32;
    const platformAsset = item.platformAssetId
      ? PLATFORM_ASSETS.find(a => a.id === item.platformAssetId)
      : null;

    return (
      <Pressable
        key={item._id}
        onPress={() => onComplete({ action: 'viewItem', itemId: item._id, itemTitle: item.title })}
      >
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <View style={styles.itemRow}>
            {item.contentUrl && platformAsset ? (
              <View style={styles.comparisonThumbs}>
                {platformAsset.image ? (
                  <img
                    src={resolveAssetUri(platformAsset.image)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      border: '2px dashed rgba(112, 68, 199, 0.5)',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    border: '2px dashed rgba(112, 68, 199, 0.5)',
                    backgroundColor: 'rgba(112, 68, 199, 0.15)',
                  }} />
                )}
                <Text style={[styles.comparisonArrow, {
                  fontSize: FontSettingsStore.getScaledFontSize(12),
                  color: FontSettingsStore.getFontColor('#7044C7')
                }]}>→</Text>
                <img
                  src={resolveAvatarUrl(item.contentUrl)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    border: '2px dashed rgba(112, 68, 199, 0.5)',
                    objectFit: 'cover',
                  }}
                />
              </View>
            ) : item.contentUrl ? (
              <img
                src={resolveAvatarUrl(item.contentUrl)}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  border: '2px dashed rgba(112, 68, 199, 0.5)',
                  objectFit: 'cover',
                }}
              />
            ) : null}
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, {
                fontSize: FontSettingsStore.getScaledFontSize(15),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                {item.title}
              </Text>
              <View style={styles.itemMeta}>
                <AvatarStamp
                  avatarUrl={item.user?.avatar}
                  avatarColor={item.user?.color || '#7044C7'}
                  size={avatarSize}
                  borderRadius={4}
                />
                <Text style={[styles.artistName, {
                  fontSize: FontSettingsStore.getScaledFontSize(12),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  {item.user?.name}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Heart size={16} />
                <Text style={[styles.priceText, {
                  fontSize: FontSettingsStore.getScaledFontSize(14),
                  color: FontSettingsStore.getFontColor('#2D2C2B')
                }]}>
                  {item.price}
                </Text>
                <Text style={[styles.purchaseCount, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  {item.purchaseCount} sold
                </Text>
              </View>
              {item.platformStatus === 'approved-for-platform' && (
                <View style={styles.platformBadge}>
                  <Text style={[styles.platformBadgeText, {
                    fontSize: FontSettingsStore.getScaledFontSize(10)
                  }]}>
                    Platform Approved
                  </Text>
                </View>
              )}
              {item.isOwned && (
                <View style={styles.ownedBadge}>
                  <Text style={[styles.ownedBadgeText, {
                    fontSize: FontSettingsStore.getScaledFontSize(10)
                  }]}>
                    Owned
                  </Text>
                </View>
              )}
            </View>
          </View>
        </MinkyPanel>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        {loading ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Loading...
            </Text>
          </MinkyPanel>
        ) : items.length === 0 ? (
          <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.emptyText, {
              fontSize: FontSettingsStore.getScaledFontSize(14),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              No items in this stall yet. Be the first to submit!
            </Text>
          </MinkyPanel>
        ) : (
          <View style={styles.itemList}>
            {items.map(renderItem)}
          </View>
        )}
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  itemList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonThumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comparisonArrow: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  purchaseCount: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginLeft: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  platformBadgeText: {
    fontFamily: 'Comfortaa',
    color: '#2E7D32',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ownedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(135, 180, 210, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownedBadgeText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#1565C0',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default BazaarShop;
