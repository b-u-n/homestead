import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import SessionStore from '../../stores/SessionStore';
import WebSocketService from '../../services/websocket';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import { resolveAvatarUrl } from '../../utils/domain';

const CustomizationItemPicker = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const platformAssetId = accumulatedData?.['customizationTable:assetPicker']?.platformAssetId;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await WebSocketService.emit('bazaar:purchases:mine', {
          sessionId: SessionStore.sessionId
        });
        // Filter to items matching the selected platform asset
        const matching = (data || []).filter(
          item => item.platformAssetId === platformAssetId
        );
        setItems(matching);
      } catch (err) {
        console.error('Failed to load purchases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (platformAssetId) {
      fetchItems();
    }
  }, [platformAssetId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7044C7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.descText, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Something went wrong loading your items.
          </Text>
        </MinkyPanel>
        {canGoBack && (
          <View style={styles.backRow}>
            <WoolButton variant="secondary" size="small" onPress={onBack}>Back</WoolButton>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        {items.length === 0 ? (
          <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
            <Text style={[styles.descText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              You don't own any replacements for this asset yet. Visit the stalls to purchase some!
            </Text>
          </MinkyPanel>
        ) : (
          <View style={styles.itemList}>
            {items.map((item, idx) => (
              <Pressable
                key={item.shopItemId?.toString() || idx}
                onPress={() => onComplete({
                  action: 'selectItem',
                  shopItemId: item.shopItemId?.toString(),
                  itemTitle: item.title
                })}
              >
                <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
                  <View style={styles.itemRow}>
                    {item.contentUrl ? (
                      <Image
                        source={{ uri: resolveAvatarUrl(item.contentUrl) }}
                        style={styles.itemImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.itemPlaceholder}>
                        <Text style={[styles.placeholderText, {
                          fontSize: FontSettingsStore.getScaledFontSize(16),
                          color: FontSettingsStore.getFontColor('#7044C7')
                        }]}>
                          {(item.title || '?').charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemTitle, {
                        fontSize: FontSettingsStore.getScaledFontSize(14),
                        color: FontSettingsStore.getFontColor('#2D2C2B')
                      }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.purchasedAt && (
                        <Text style={[styles.itemDate, {
                          fontSize: FontSettingsStore.getScaledFontSize(11),
                          color: FontSettingsStore.getFontColor('#454342')
                        }]}>
                          Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </MinkyPanel>
              </Pressable>
            ))}
          </View>
        )}

        {canGoBack && (
          <View style={styles.backRow}>
            <WoolButton
              variant="purple"
              size="small"
              overlayColor="rgba(100, 130, 195, 0.25)"
              onPress={onBack}
            >
              Back
            </WoolButton>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  descText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  itemPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(112, 68, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
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
  itemDate: {
    fontFamily: 'Comfortaa',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  backRow: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
});

export default CustomizationItemPicker;
