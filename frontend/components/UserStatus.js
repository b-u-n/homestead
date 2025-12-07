import React from 'react';
import { View, Text, Image, StyleSheet, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import profileStore from '../stores/ProfileStore';
import uxStore from '../stores/UXStore';
import StitchedBorder from './StitchedBorder';
import AvatarStamp from './AvatarStamp';

const buttonBgImage = require('../assets/images/button-bg.png');

const UserStatus = observer(() => {
  // Scale down on mobile
  const mobileStyle = uxStore.shouldScaleUI ? {
    transform: 'scale(0.7)',
    transformOrigin: 'top left',
  } : {};

  return (
    <View style={[styles.wrapper, mobileStyle]}>
      {/* Background texture */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '28%',
            borderRadius: 12,
            pointerEvents: 'none',
            opacity: 0.2,
          }}
        />
      )}
      {Platform.OS !== 'web' && (
        <ImageBackground
          source={buttonBgImage}
          style={styles.bgImage}
          imageStyle={styles.bgImageStyle}
          resizeMode="repeat"
        />
      )}

      <View style={styles.overlay}>
        <StitchedBorder borderRadius={12} borderColor="rgba(92, 90, 88, 0.2)" style={styles.container}>
          {/* Avatar */}
          <AvatarStamp
            avatarUrl={profileStore.avatarUrl}
            avatarColor={profileStore.avatarColor}
            size={56}
            borderRadius={8}
          />

          {/* Stats panel */}
          <View style={styles.statsPanel}>
            {/* Username */}
            {profileStore.username && (
              <Text style={styles.username}>{profileStore.username}</Text>
            )}

            {/* Energy bar */}
            <View style={styles.barContainer}>
              <View style={styles.barBackground}>
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
            <View style={styles.heartsContainer}>
              {profileStore.heartsArray.map((filled, index) => (
                <Text key={index} style={styles.heart}>
                  {filled ? '❤️' : '🤍'}
                </Text>
              ))}
            </View>

          </View>
        </StitchedBorder>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 10,
    left: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  bgImageStyle: {
    borderRadius: 12,
    opacity: 0.2,
  },
  overlay: {
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
  },
  container: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    minWidth: 280,
  },
  statsPanel: {
    flex: 1,
    gap: 6,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#403F3E',
    marginBottom: 4,
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
  heart: {
    fontSize: 14,
  },
});

export default UserStatus;
