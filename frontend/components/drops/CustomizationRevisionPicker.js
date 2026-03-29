import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import CustomizationStore from '../../stores/CustomizationStore';
import SessionStore from '../../stores/SessionStore';
import WebSocketService from '../../services/websocket';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import { resolveAvatarUrl } from '../../utils/domain';

const CustomizationRevisionPicker = observer(({
  input,
  context,
  accumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const [revisions, setRevisions] = useState([]);
  const [currentApprovedIndex, setCurrentApprovedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedRevisionIndex, setSelectedRevisionIndex] = useState(null);
  const [error, setError] = useState(null);

  const shopItemId = accumulatedData?.['customizationTable:itemPicker']?.shopItemId;
  const platformAssetId = accumulatedData?.['customizationTable:assetPicker']?.platformAssetId;
  const activeCustomization = CustomizationStore.getCustomization(platformAssetId);

  useEffect(() => {
    const fetchRevisions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await WebSocketService.emit('bazaar:purchases:revisions', {
          sessionId: SessionStore.sessionId,
          shopItemId
        });
        setRevisions(data.revisions || []);
        setCurrentApprovedIndex(data.currentApprovedRevisionIndex);
      } catch (err) {
        console.error('Failed to load revisions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (shopItemId) {
      fetchRevisions();
    }
  }, [shopItemId]);

  const handleApply = async () => {
    if (selectedRevisionIndex === null) return;
    setApplying(true);
    try {
      const data = await WebSocketService.emit('bazaar:customization:set', {
        sessionId: SessionStore.sessionId,
        platformAssetId,
        shopItemId,
        revisionIndex: selectedRevisionIndex
      });
      CustomizationStore.updateFromServer(data);
      onComplete({ action: 'applied' });
    } catch (err) {
      console.error('Failed to apply customization:', err);
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

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
            Something went wrong: {error}
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
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.descText, {
            fontSize: FontSettingsStore.getScaledFontSize(12),
            lineHeight: FontSettingsStore.getScaledSpacing(18),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Select a version to apply. You'll stay on this version until you manually update.
          </Text>
        </MinkyPanel>

        <View style={styles.revisionGrid}>
          {revisions.map(rev => {
            const isLatest = rev.index === currentApprovedIndex;
            const isActive = activeCustomization
              && activeCustomization.shopItemId?.toString() === shopItemId
              && activeCustomization.revisionIndex === rev.index;
            const isSelected = selectedRevisionIndex === rev.index;

            return (
              <Pressable
                key={rev.index}
                onPress={() => setSelectedRevisionIndex(rev.index)}
              >
                <MinkyPanel
                  borderRadius={8}
                  padding={10}
                  paddingTop={10}
                  overlayColor={isSelected ? 'rgba(112, 68, 199, 0.35)' : 'rgba(112, 68, 199, 0.2)'}
                >
                  <View style={styles.revisionCard}>
                    {rev.contentUrl ? (
                      <Image
                        source={{ uri: resolveAvatarUrl(rev.contentUrl) }}
                        style={[styles.revisionImage, isSelected && styles.selectedBorder]}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.revisionPlaceholder, isSelected && styles.selectedBorder]}>
                        <Text style={[styles.placeholderText, {
                          fontSize: FontSettingsStore.getScaledFontSize(14),
                          color: FontSettingsStore.getFontColor('#7044C7')
                        }]}>
                          v{rev.index + 1}
                        </Text>
                      </View>
                    )}
                    <View style={styles.badgeRow}>
                      {isLatest && (
                        <Text style={[styles.badge, styles.latestBadge, {
                          fontSize: FontSettingsStore.getScaledFontSize(9),
                        }]}>
                          Latest
                        </Text>
                      )}
                      {isActive && (
                        <Text style={[styles.badge, styles.activeBadge, {
                          fontSize: FontSettingsStore.getScaledFontSize(9),
                        }]}>
                          Active
                        </Text>
                      )}
                    </View>
                    {rev.note && (
                      <Text style={[styles.revisionNote, {
                        fontSize: FontSettingsStore.getScaledFontSize(10),
                        color: FontSettingsStore.getFontColor('#454342')
                      }]} numberOfLines={2}>
                        {rev.note}
                      </Text>
                    )}
                    <Text style={[styles.revisionDate, {
                      fontSize: FontSettingsStore.getScaledFontSize(9),
                      color: FontSettingsStore.getFontColor('#454342')
                    }]}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>

        {selectedRevisionIndex !== null && (
          <View style={styles.applyRow}>
            <WoolButton
              variant="purple"
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? 'Applying...' : 'Apply This Version'}
            </WoolButton>
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
  revisionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  revisionCard: {
    width: 100,
    alignItems: 'center',
    gap: 4,
  },
  revisionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  selectedBorder: {
    borderWidth: 3,
    borderColor: '#7044C7',
  },
  revisionPlaceholder: {
    width: 80,
    height: 80,
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
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  latestBadge: {
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    color: '#7044C7',
  },
  activeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#2E7D32',
  },
  revisionNote: {
    fontFamily: 'Comfortaa',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  revisionDate: {
    fontFamily: 'Comfortaa',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  applyRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  backRow: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
});

export default CustomizationRevisionPicker;
