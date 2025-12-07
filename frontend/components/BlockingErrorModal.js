import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import StitchedBorder from './StitchedBorder';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const BlockingErrorModal = observer(({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Background texture */}
          {Platform.OS === 'web' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '40%',
                borderRadius: 16,
                pointerEvents: 'none',
                opacity: 0.3,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={slotBgImage}
              style={styles.bgImage}
              imageStyle={styles.bgImageStyle}
              resizeMode="repeat"
            />
          )}

          {/* Red overlay */}
          <View style={styles.overlay}>
            <StitchedBorder
              borderRadius={14}
              borderWidth={2}
              borderColor="rgba(255, 120, 120, 0.6)"
              style={styles.stitchedContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.title}>Error</Text>
              </View>

              {/* Message */}
              <Text style={styles.message}>{error.message}</Text>

              {/* Dismiss button */}
              <Pressable onPress={onDismiss} style={styles.dismissButton}>
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Dismiss</Text>
                </View>
              </Pressable>
            </StitchedBorder>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff3333',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bgImageStyle: {
    opacity: 0.3,
    borderRadius: 16,
  },
  overlay: {
    backgroundColor: 'rgba(140, 30, 30, 0.92)',
    padding: 6,
  },
  stitchedContent: {
    flex: 0,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 28,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  buttonInner: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default BlockingErrorModal;
