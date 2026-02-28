import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import { PLATFORM_ASSETS, ASSET_CATEGORIES } from '../../constants/platformAssets';

const BazaarAssetCatalog = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = ASSET_CATEGORIES;
  const filteredAssets = selectedCategory
    ? PLATFORM_ASSETS.filter(a => a.category === selectedCategory)
    : PLATFORM_ASSETS;

  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.descText, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            lineHeight: FontSettingsStore.getScaledSpacing(19),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Browse existing platform assets. Tap one to propose an updated version.
          </Text>
        </MinkyPanel>

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
          {filteredAssets.map(asset => (
            <Pressable
              key={asset.id}
              onPress={() => onComplete({
                action: 'selectAsset',
                platformAssetId: asset.id,
                assetName: asset.name
              })}
            >
              <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
                <View style={styles.assetCardContent}>
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
                  <Text style={[styles.assetName, {
                    fontSize: FontSettingsStore.getScaledFontSize(12),
                    color: FontSettingsStore.getFontColor('#2D2C2B')
                  }]} numberOfLines={2}>
                    {asset.name}
                  </Text>
                  <Text style={[styles.assetCategory, {
                    fontSize: FontSettingsStore.getScaledFontSize(10),
                    color: FontSettingsStore.getFontColor('#454342')
                  }]}>
                    {asset.category}
                  </Text>
                </View>
              </MinkyPanel>
            </Pressable>
          ))}
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
  assetImage: {
    width: 64,
    height: 64,
    borderRadius: 6,
  },
  assetIcon: {
    width: 64,
    height: 64,
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
});

export default BazaarAssetCatalog;
