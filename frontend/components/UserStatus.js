import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import profileStore from '../stores/ProfileStore';
import uxStore from '../stores/UXStore';
import FontSettingsStore from '../stores/FontSettingsStore';
import MinkyPanel from './MinkyPanel';
import AvatarStamp from './AvatarStamp';
import Heart from './Heart';

const UserStatus = observer(({ compact = false }) => {
  // Check if we're in the side panel (compact mode when letterbox space available)
  const inSidePanel = compact && uxStore.letterboxWidth > 60;

  // Scale down on mobile (only when not in side panel)
  const mobileStyle = !inSidePanel && uxStore.shouldScaleUI ? {
    transform: 'scale(0.7)',
    transformOrigin: 'top left',
  } : {};

  // Side panel wrapper style (no absolute positioning, fits panel width)
  const sidePanelWrapperStyle = inSidePanel ? {
    position: 'relative',
    top: 0,
    left: 0,
    width: '100%',
  } : null;

  return (
    <View style={[inSidePanel ? sidePanelWrapperStyle : styles.wrapper, !inSidePanel && mobileStyle]}>
      <MinkyPanel
        borderRadius={inSidePanel ? 8 : 12}
        padding={inSidePanel ? 6 : 16}
        paddingTop={inSidePanel ? 6 : 16}
        overlayColor="rgba(222, 134, 223, 0.35)"
      >
        <View style={inSidePanel ? styles.sidePanelContainer : styles.container}>
          {/* Avatar */}
          <AvatarStamp
            avatarUrl={profileStore.avatarUrl}
            avatarColor={profileStore.avatarColor}
            size={inSidePanel ? 48 : 56}
            borderRadius={8}
          />

          {/* Stats panel */}
          <View style={[styles.statsPanel, inSidePanel && styles.statsPanelSidePanel]}>
            {/* Username */}
            {profileStore.username && (
              inSidePanel ? (
                // Side panel: split username on capital letters, display vertically
                <View style={styles.usernameVerticalContainer}>
                  {profileStore.username
                    .split(/(?=[A-Z])/)
                    .filter(word => word.length > 0)
                    .map((word, index) => {
                      // Scale font size to fit panel width
                      const availableWidth = uxStore.letterboxWidth - 24;
                      const baseFontSize = 11;
                      const charWidth = 8; // approx width per char at base font
                      const neededWidth = word.length * charWidth;
                      const fontSize = neededWidth > availableWidth
                        ? Math.max(5, baseFontSize * (availableWidth / neededWidth))
                        : baseFontSize;
                      return (
                        <Text
                          key={index}
                          style={[styles.usernameVerticalWord, { fontSize: FontSettingsStore.getScaledFontSize(fontSize), lineHeight: FontSettingsStore.getScaledFontSize(fontSize) + 2, color: FontSettingsStore.getFontColor('#403F3E') }]}
                        >
                          {word}
                        </Text>
                      );
                    })}
                </View>
              ) : (
                <Text style={[styles.username, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#403F3E') }]}>
                  {profileStore.username}
                </Text>
              )
            )}

            {/* Energy bar */}
            <View style={[styles.barContainer, inSidePanel && { width: '100%' }]}>
              <View style={[styles.barBackground, inSidePanel && { height: 10 }]}>
                <View
                  style={[
                    styles.barFill,
                    styles.energyFill,
                    { width: `${profileStore.energyPercentage}%` }
                  ]}
                />
              </View>
            </View>

            {/* Hearts */}
            {inSidePanel ? (
              // Side panel: 3x3 grid of hearts
              <View style={styles.heartsGrid}>
                {[0, 1, 2].map(row => (
                  <View key={row} style={styles.heartsGridRow}>
                    {profileStore.heartsArray.slice(row * 3, row * 3 + 3).map((filled, index) => (
                      <View key={row * 3 + index} style={[styles.heart, !filled && styles.heartEmpty]}>
                        <Heart size={14} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.heartsContainer}>
                {profileStore.heartsArray.map((filled, index) => (
                  <View key={index} style={[styles.heart, !filled && styles.heartEmpty]}>
                    <Heart size={16} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </MinkyPanel>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 20,
    left: 156,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    minWidth: 280,
  },
  sidePanelContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  statsPanel: {
    flex: 1,
    gap: 6,
  },
  statsPanelSidePanel: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  usernameVerticalContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  usernameVerticalWord: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    lineHeight: 15,
    marginVertical: 1,
  },
  barContainer: {
    marginBottom: 4,
  },
  barBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(92, 90, 88, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  energyFill: {
    backgroundColor: '#66B366',
  },
  heartsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  heartsGrid: {
    alignItems: 'center',
    gap: 2,
  },
  heartsGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  heart: {
    // Heart image container
  },
  heartEmpty: {
    opacity: 0.3,
  },
});

export default UserStatus;
