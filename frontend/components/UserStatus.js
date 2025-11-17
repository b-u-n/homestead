import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Platform, ImageBackground, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import profileStore from '../stores/ProfileStore';
import StitchedBorder from './StitchedBorder';
import BankModal from './BankModal';

const buttonBgImage = require('../assets/images/button-bg.png');

const UserStatus = observer(() => {
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  return (
    <>
      <BankModal visible={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />
    <View style={styles.wrapper}>
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
            backgroundSize: '40%',
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
          <View style={styles.avatarContainer}>
            {profileStore.avatarUrl ? (
              <Image source={{ uri: profileStore.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>?</Text>
              </View>
            )}
          </View>

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

            {/* Bank Icon - Bottom left */}
            <Pressable style={styles.bankIcon} onPress={() => setIsBankModalOpen(true)}>
              <Text style={styles.bankIconText}>💰</Text>
            </Pressable>
          </View>
        </StitchedBorder>
      </View>
    </View>
    </>
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
    backgroundColor: 'rgba(222, 134, 223, 0.1)',
    padding: 4,
  },
  container: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    minWidth: 280,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.55)',
  },
  avatar: {
    width: 60,
    height: 60,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    color: '#5C5A58',
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
  bankIcon: {
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(112, 68, 199, 0.3)',
  },
  bankIconText: {
    fontSize: 18,
  },
});

export default UserStatus;
