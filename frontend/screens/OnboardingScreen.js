import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, ScrollView, Image, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import VaporwaveButton from '../components/VaporwaveButton';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import AuthStore from '../stores/AuthStore';
import WebSocketService from '../services/websocket';
import domain from '../utils/domain';

const OnboardingScreen = observer(() => {
  const router = useRouter();
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
          router.push('/homestead/onboarding/username');
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
  }, [router]);

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
    router.push('/homestead/onboarding/username');
  };

  return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content} accessibilityRole="main">
          <View style={styles.headerContainer}>
          <Text
            style={[
              styles.title,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            homestead{' '}
            <Text style={styles.byHeartsbox}>by heartsbox</Text>
          </Text>
          <Text
            style={[
              styles.subtitle,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
          >
            sign in to save your progress
          </Text>
        </View>

        <Image
          source={require('../assets/images/middle-graphic.png')}
          style={styles.middleGraphic}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          <VaporwaveButton
            title={isLoading ? 'Connecting...' : 'Sign In with Google'}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            variant="primary"
            style={styles.googleButton}
            accessibilityLabel={isLoading ? 'Connecting to Google' : 'Sign in with Google'}
            accessibilityHint="Authenticate with your Google account to save progress"
          />

          <VaporwaveButton
            title="Skip & Explore"
            onPress={handleSkipForNow}
            variant="blue"
            style={styles.skipButton}
            accessibilityLabel="Skip authentication"
            accessibilityHint="Continue without signing in"
          />
        </View>

        <Text style={styles.footerText}></Text>
        </View>
      </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
    backgroundColor: 'transparent',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  middleGraphic: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  title: {
    fontFamily: Typography.fonts.header,
    fontSize: 42,
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.cottagecore.greyDark,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  byHeartsbox: {
    fontSize: 28,
    position: 'relative',
    top: -8,
  },
  subtitle: {
    fontFamily: Typography.fonts.subheader,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.cottagecore.greyDark,
    lineHeight: 26,
    paddingHorizontal: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
    gap: 16,
  },
  googleButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
  },
  footerText: {
    marginTop: 40,
  },
});

export default OnboardingScreen;