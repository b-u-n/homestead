import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { Colors } from '../constants/colors';

const ErrorNotification = observer(({ error, onDismiss, index = 0 }) => {
  const slideAnim = new Animated.Value(300);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateX: slideAnim }],
          bottom: 20 + (index * 90)
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(180, 50, 50, 0.9)', 'rgba(120, 30, 30, 0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.message}>{error.message}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.dismissGradient}
            >
              <Text style={styles.dismissText}>✕</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    left: 20,
    zIndex: 1000,
  },
  gradient: {
    borderRadius: 15,
    shadowColor: Colors.error,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.vaporwave.pink,
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dismissGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dismissText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ErrorNotification;