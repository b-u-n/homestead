import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import * as WebBrowser from 'expo-web-browser';
import GradientBackground from '../components/GradientBackground';
import VaporwaveButton from '../components/VaporwaveButton';
import { Colors } from '../constants/colors';
import AuthStore from '../stores/AuthStore';
import WebSocketService from '../services/websocket';
import domain from '../utils/domain';

const OnboardingScreen = observer(({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Handle deep link from auth callback
    const handleAuthCallback = (url) => {
      const params = new URLSearchParams(url.split('?')[1]);
      const token = params.get('token');
      const userStr = params.get('user');
      const error = params.get('error');

      if (error) {
        Alert.alert('Authentication Failed', 'Please try again');
        return;
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          AuthStore.setUser(user, token);
          WebSocketService.connect();
          navigation.navigate('UsernameCreation');
        } catch (e) {
          Alert.alert('Error', 'Failed to process authentication');
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthCallback(url);
    });

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthCallback(url);
    });

    return () => subscription?.remove();
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const authUrl = `${domain()}/auth/google`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'com.heartsbox.homestead://'
      );

      if (result.type === 'cancel') {
        Alert.alert('Authentication cancelled');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    // For development purposes
    navigation.navigate('UsernameCreation');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollTestWindow}>
        <View style={styles.content} accessibilityRole="main">
        <View style={styles.headerContainer}>
          <Text 
            style={styles.title}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            Welcome to the Future
          </Text>
          <Text style={styles.subtitle}>
            Connect with Google to save your progress and unlock the digital realm
          </Text>
        </View>

        <View 
          style={styles.glowOrb}
          accessibilityRole="image"
          accessibilityLabel="Digital globe icon representing connection to the virtual world"
        >
          <Text style={styles.orbText} accessible={false}>🌐</Text>
        </View>

        <View style={styles.buttonContainer}>
          <VaporwaveButton
            title={isLoading ? '◉ Connecting...' : '🚀 Sign In with Google'}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            variant="primary"
            style={styles.googleButton}
            accessibilityLabel={isLoading ? 'Connecting to Google' : 'Sign in with Google'}
            accessibilityHint="Authenticate with your Google account to save progress"
          />

          <VaporwaveButton
            title="↗ Skip to the Grid"
            onPress={handleSkipForNow}
            variant="accent"
            style={styles.skipButton}
            accessibilityLabel="Skip authentication"
            accessibilityHint="Continue without signing in"
          />
        </View>

        <Text style={styles.footerText}>
          ✨ Your journey to the digital homestead begins here
        </Text>
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollTestWindow: {
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text.primary,
    textShadowColor: Colors.vaporwave.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.light.primary,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  glowOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background.card,
    borderWidth: 3,
    borderColor: Colors.vaporwave.pink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.vaporwave.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  orbText: {
    fontSize: 50,
    textShadowColor: Colors.vaporwave.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  googleButton: {
    minWidth: 250,
  },
  skipButton: {
    minWidth: 200,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});

export default OnboardingScreen;