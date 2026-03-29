import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import CustomizationStore from '../../stores/CustomizationStore';
import SessionStore from '../../stores/SessionStore';
import WebSocketService from '../../services/websocket';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import { PLATFORM_ASSETS, ASSET_CATEGORIES } from '../../constants/platformAssets';
import { resolveAvatarUrl } from '../../utils/domain';

const CustomizationAssetPicker = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filterMode, setFilterMode] = useState('owned');
  const [ownedAssetIds, setOwnedAssetIds] = useState(new Set());
  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const fetchOwned = async () => {
      try {
        const data = await WebSocketService.emit('bazaar:purchases:mine', {
          sessionId: SessionStore.sessionId
        });
        const ids = new Set();
        for (const item of (data || [])) {
          if (item.platformAssetId) ids.add(item.platformAssetId);
        }
        setOwnedAssetIds(ids);
      } catch (err) {
        console.error('Failed to load purchases for filter:', err);
      }
    };
    fetchOwned();
  }, []);

  const categories = ASSET_CATEGORIES;
  let filteredAssets = selectedCategory
    ? PLATFORM_ASSETS.filter(a => a.category === selectedCategory)
    : PLATFORM_ASSETS;

  if (filterMode === 'owned') {
    filteredAssets = filteredAssets.filter(a =>
      ownedAssetIds.has(a.id) || CustomizationStore.hasCustomization(a.id)
    );
  }

  const handleAssetPress = (asset) => {
    const hasCustomization = CustomizationStore.hasCustomization(asset.id);
    if (hasCustomization) {
      setExpandedAssetId(expandedAssetId === asset.id ? null : asset.id);
    } else {
      onComplete({
        action: 'selectAsset',
        platformAssetId: asset.id,
        assetName: asset.name
      });
    }
  };

  const handleChange = (asset) => {
    setExpandedAssetId(null);
    onComplete({
      action: 'selectAsset',
      platformAssetId: asset.id,
      assetName: asset.name
    });
  };

  const handleReset = async (asset) => {
    setClearing(true);
    try {
      const data = await WebSocketService.emit('bazaar:customization:clear', {
        sessionId: SessionStore.sessionId,
        platformAssetId: asset.id
      });
      CustomizationStore.updateFromServer(data);
      setExpandedAssetId(null);
    } catch (error) {
      console.error('Failed to clear customization:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.descText, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            lineHeight: FontSettingsStore.getScaledSpacing(19),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Customize platform assets with your purchased items. Tap an asset to assign a replacement.
          </Text>
        </MinkyPanel>

        {/* Owned / All filter */}
        <View style={styles.filterRow}>
          <WoolButton
            variant="secondary"
            focused={filterMode === 'owned'}
            size="small"
            onPress={() => setFilterMode('owned')}
          >
            Owned
          </WoolButton>
          <WoolButton
            variant="secondary"
            focused={filterMode === 'all'}
            size="small"
            onPress={() => setFilterMode('all')}
          >
            All
          </WoolButton>
        </View>

        {/* Category filters */}
        <View style={styles.categoryRow}>
          <WoolButton
            variant="secondary"
            focused={selectedCategory === null}
            size="small"
            onPress={() => setSelectedCategory(null)}
          >
            All
          </WoolButton>
          {categories.map(cat => (
            <WoolButton
              key={cat}
              variant="secondary"
              focused={selectedCategory === cat}
              size="small"
              onPress={() => setSelectedCategory(cat)}
            >
              {cat}
            </WoolButton>
          ))}
        </View>

        {/* Asset grid */}
        <View style={styles.assetGrid}>
          {filteredAssets.map(asset => {
            const customization = CustomizationStore.getCustomization(asset.id);
            const isExpanded = expandedAssetId === asset.id;

            return (
              <View key={asset.id}>
                <Pressable onPress={() => handleAssetPress(asset)}>
                  <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
                    <View style={styles.assetCardContent}>
                      <View style={styles.imageRow}>
                        {asset.image ? (
                          <Image source={asset.image} style={styles.assetImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.assetIcon}>
                            <Text style={[styles.assetIconText, {
                              fontSize: FontSettingsStore.getScaledFontSize(20),
                              color: FontSettingsStore.getFontColor('#7044C7')
                            }]}>
                              {asset.name.charAt(0)}
                            </Text>
                          </View>
                        )}
                        {customization && customization.contentUrl && (
                          <Image
                            source={{ uri: resolveAvatarUrl(customization.contentUrl) }}
                            style={styles.customImage}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text style={[styles.assetName, {
                        fontSize: FontSettingsStore.getScaledFontSize(12),
                        color: FontSettingsStore.getFontColor('#2D2C2B')
                      }]} numberOfLines={2}>
                        {asset.name}
                      </Text>
                      {customization && (
                        <Text style={[styles.customBadge, {
                          fontSize: FontSettingsStore.getScaledFontSize(9),
                        }]}>
                          Customized
                        </Text>
                      )}
                      {!customization && (
                        <Text style={[styles.assetCategory, {
                          fontSize: FontSettingsStore.getScaledFontSize(10),
                          color: FontSettingsStore.getFontColor('#454342')
                        }]}>
                          {asset.category}
                        </Text>
                      )}
                    </View>
                  </MinkyPanel>
                </Pressable>

                {/* Expanded options for customized assets */}
                {isExpanded && (
                  <View style={styles.expandedOptions}>
                    <WoolButton
                      variant="purple"
                      size="small"
                      onPress={() => handleChange(asset)}
                    >
                      Change
                    </WoolButton>
                    <WoolButton
                      variant="secondary"
                      size="small"
                      onPress={() => handleReset(asset)}
                      disabled={clearing}
                    >
                      Reset to Default
                    </WoolButton>
                    <WoolButton
                      variant="secondary"
                      size="small"
                      onPress={() => setExpandedAssetId(null)}
                    >
                      Cancel
                    </WoolButton>
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
  descText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  assetCardContent: {
    width: 96,
    alignItems: 'center',
    gap: 6,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  customImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#7044C7',
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  assetName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  assetCategory: {
    fontFamily: 'Comfortaa',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  customBadge: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  expandedOptions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
});

export default CustomizationAssetPicker;
